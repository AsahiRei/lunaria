import { useEffect, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Brain, ArrowLeft, CheckCircle2, Loader2, FileText } from "lucide-react-native";
import { Colors } from "../constants/theme";
import { useReviewerStore, type GenerationState, type ReviewerData } from "../store/useReviewerStore";
import { useLlama } from "../hooks/useLlama";
import { useGenerationMetrics } from "../hooks/useGenerationMetrics";
import { extractTextFromPdf, chunkDocument } from "../lib/pdfExtractor";
import {
  buildMessages,
  parseReviewerResponse,
  mergeReviewers,
  REVIEWER_JSON_SCHEMA,
} from "../lib/reviewerPrompt";
import { getCachedReviewer, setCachedReviewer } from "../lib/cache";

const STEPS = [
  { key: "extracting", label: "Extracting text from PDF" },
  { key: "loading", label: "Loading AI model" },
  { key: "analyzing", label: "Analyzing document" },
  { key: "generating", label: "Generating reviewer" },
  { key: "parsing", label: "Finalizing results" },
];

function SpinningIcon({ size, color }: { size: number; color: string }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 900, easing: Easing.linear }),
      -1,
      false
    );
  }, [rotation]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={style}>
      <Loader2 size={size} color={color} />
    </Animated.View>
  );
}

function ProcessingOrb({ isDone, isError }: { isDone: boolean; isError: boolean }) {
  const pulse = useSharedValue(1);
  const ring = useSharedValue(0);

  useEffect(() => {
    if (isDone || isError) {
      cancelAnimation(pulse);
      cancelAnimation(ring);
      pulse.value = withTiming(1, { duration: 250 });
      return;
    }

    pulse.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    ring.value = withRepeat(
      withTiming(360, { duration: 2800, easing: Easing.linear }),
      -1,
      false
    );
  }, [isDone, isError, pulse, ring]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ring.value}deg` }],
  }));

  const tint = isDone
    ? "rgba(74, 222, 128, 0.15)"
    : isError
      ? "rgba(248, 113, 113, 0.15)"
      : "rgba(99, 102, 241, 0.15)";

  return (
    <View className="w-28 h-28 items-center justify-center mb-6">
      {!isDone && !isError && (
        <Animated.View
          className="absolute w-28 h-28 rounded-full"
          style={[
            ringStyle,
            {
              borderWidth: 2,
              borderColor: "transparent",
              borderTopColor: Colors.primary,
              borderRightColor: Colors.primaryLight,
            },
          ]}
        />
      )}
      <Animated.View
        className="w-24 h-24 rounded-full items-center justify-center"
        style={[pulseStyle, { backgroundColor: tint }]}
      >
        {isDone ? (
          <CheckCircle2 size={48} color={Colors.success} />
        ) : isError ? (
          <ArrowLeft size={48} color={Colors.error} />
        ) : (
          <Brain size={48} color={Colors.primary} />
        )}
      </Animated.View>
    </View>
  );
}

function getStepIndex(state: GenerationState, progress: string): number {
  if (state === "done") return STEPS.length;
  if (state === "error") return -1;
  if (progress.includes("Reading PDF") || progress.includes("Extracting")) return 0;
  if (progress.includes("Loading AI")) return 1;
  if (progress.includes("Analyzing")) return 2;
  if (progress.includes("Generating")) return 3;
  if (progress.includes("Parsing")) return 4;
  return 0;
}

export default function ProcessingScreen() {
  const router = useRouter();
  const { fileUri, fileName, fileSize, focusTopic, pageRange, customRange } =
    useLocalSearchParams<{
      fileUri: string;
      fileName: string;
      fileSize: string;
      focusTopic?: string;
      pageRange?: string;
      customRange?: string;
    }>();

  const {
    addSubject,
    generationState,
    generationProgress,
    setGenerationState,
    setError,
  } = useReviewerStore();

  const { loadModel } = useLlama();
  const { startGeneration, endGeneration, updateTokens } = useGenerationMetrics();
  const hasStarted = useRef(false);

  const runGeneration = useCallback(async () => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    let reviewerData: ReviewerData | null = null;

    try {
      setError(null);
      setGenerationState("extracting", "Reading PDF...");

      const pdfText = await extractTextFromPdf(fileUri!);
      if (!pdfText || pdfText.trim().length === 0) {
        Alert.alert(
          "No Text Found",
          "Could not extract text from this PDF. It may be a scanned or image-based document."
        );
        setGenerationState("idle");
        router.back();
        return;
      }

      const chunks = chunkDocument(pdfText);
      startGeneration(pdfText.length);

      const cached = await getCachedReviewer(pdfText);
      if (cached) {
        console.log("[processing] Using cached reviewer");
        reviewerData = cached;
        reviewerData.title = fileName?.replace(/\.pdf$/i, "") || reviewerData.title;

        const id = String(Date.now());
        const subject = {
          id,
          title: reviewerData.title,
          subtitle: reviewerData.subtitle,
          mastery: 0,
          needsReview: true,
        };

        addSubject(subject, reviewerData);
        endGeneration(0, true);
        setGenerationState("done");

        setTimeout(() => {
          setGenerationState("idle");
          router.replace({ pathname: "/reviewer/[id]", params: { id } });
        }, 800);

        return;
      }

      setGenerationState("generating", "Loading AI model...");

      let ctx;
      try {
        ctx = await loadModel();
      } catch {
        Alert.alert(
          "Model Error",
          "Failed to load the AI model. Try downloading it again from the Add PDF tab."
        );
        setGenerationState("idle");
        router.back();
        return;
      }

      setGenerationState("generating", "Analyzing document...");

      const parts: ReviewerData[] = [];
      let tokenCount = 0;
      const maxAttempts = chunks.length > 1 ? 2 : 3;

      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const sectionHint =
          chunks.length > 1
            ? `This is section ${chunkIndex + 1} of ${chunks.length}. Extract terms unique to this section.`
            : undefined;
        const messages = buildMessages(
          chunks[chunkIndex],
          focusTopic || undefined,
          pageRange === "custom" ? customRange : undefined,
          sectionHint
        );

        let chunkReviewer: ReviewerData | null = null;
        let attempts = 0;

        while (!chunkReviewer && attempts < maxAttempts) {
          attempts++;
          const sectionLabel =
            chunks.length > 1
              ? `section ${chunkIndex + 1}/${chunks.length}`
              : "reviewer";
          setGenerationState(
            "generating",
            `Generating ${sectionLabel}... (attempt ${attempts}/${maxAttempts})`
          );

          const result = await ctx.completion(
            {
              messages,
              n_predict: 2000,
              temperature: 0.3 + (attempts - 1) * 0.15,
              top_p: 0.9,
              top_k: 45,
              penalty_repeat: 1.1,
              stop: ["</s>", "<|end|>", "<|eot_id|>", "<|end_of_text|>"],
              response_format: {
                type: "json_schema",
                json_schema: {
                  strict: true,
                  schema: REVIEWER_JSON_SCHEMA,
                },
              },
            },
            (data) => {
              if (data.token) {
                tokenCount++;
                updateTokens(tokenCount);
                if (tokenCount % 20 === 0) {
                  setGenerationState(
                    "generating",
                    `Generating ${sectionLabel}... (${tokenCount} tokens)`
                  );
                }
              }
            }
          );

          setGenerationState("generating", "Parsing results...");
          console.log("[processing] Raw text:", result.text?.slice(0, 500));
          console.log("[processing] Raw content:", result.content?.slice(0, 500));
          console.log(
            "[processing] truncated:",
            result.truncated,
            "stopped_limit:",
            result.stopped_limit,
            "tokens_predicted:",
            result.tokens_predicted
          );
          chunkReviewer = parseReviewerResponse(result.text || result.content);
        }

        if (chunkReviewer) {
          parts.push(chunkReviewer);
        } else {
          console.log("[processing] Skipping failed section", chunkIndex + 1);
        }
      }

      endGeneration(tokenCount, parts.length > 0);
      reviewerData = mergeReviewers(parts);

      if (!reviewerData) {
        Alert.alert(
          "Generation Failed",
          "The AI model could not generate a valid reviewer after multiple attempts. Try a shorter or simpler document."
        );
        setGenerationState("idle");
        router.back();
        return;
      }

      reviewerData.title = fileName?.replace(/\.pdf$/i, "") || reviewerData.title;

      const id = String(Date.now());
      const subject = {
        id,
        title: reviewerData.title,
        subtitle: reviewerData.subtitle,
        mastery: 0,
        needsReview: true,
      };

      addSubject(subject, reviewerData);
      setCachedReviewer(pdfText, reviewerData);
      setGenerationState("done");

      setTimeout(() => {
        setGenerationState("idle");
        router.replace({ pathname: "/reviewer/[id]", params: { id } });
      }, 800);
    } catch (err) {
      console.error("[processing] Generation error:", err);
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      Alert.alert("Error", "Something went wrong: " + message);
      setGenerationState("idle");
      router.back();
    }
  }, [
    fileUri,
    fileName,
    focusTopic,
    pageRange,
    customRange,
    loadModel,
    addSubject,
    setGenerationState,
    setError,
    router,
  ]);

  useEffect(() => {
    if (fileUri) {
      runGeneration();
    }
  }, [fileUri, runGeneration]);

  const activeIndex = getStepIndex(generationState, generationProgress);
  const isDone = generationState === "done";
  const isError = generationState === "error";

  return (
    <View className="flex-1 bg-midnight">
      <View className="flex-row items-center px-5 pt-14 pb-4">
        <TouchableOpacity
          onPress={() => {
            setGenerationState("idle");
            router.back();
          }}
          className="w-10 h-10 items-center justify-center rounded-full bg-midnight-lighter border border-midnight-border"
        >
          <ArrowLeft size={20} color={Colors.silver} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-ltext ml-3">
          Generating Reviewer
        </Text>
      </View>

      <View className="flex-1 items-center justify-center px-8">
        <View className="items-center mb-12">
          <ProcessingOrb isDone={isDone} isError={isError} />

          <Text className="text-xl font-semibold text-ltext text-center mb-2">
            {isDone
              ? "Reviewer Ready!"
              : isError
              ? "Something went wrong"
              : "Creating Your Reviewer"}
          </Text>
          <Text className="text-sm text-ltext-secondary text-center">
            {isDone
              ? "Redirecting you shortly..."
              : isError
              ? "Returning to try again..."
              : fileName || "Processing your document"}
          </Text>
        </View>

        <View className="w-full gap-3">
          {STEPS.map((step, i) => {
            const isActive = i === activeIndex;
            const isCompleted = activeIndex > i || isDone;

            return (
              <View
                key={step.key}
                className="flex-row items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  backgroundColor: isActive
                    ? "rgba(99, 102, 241, 0.1)"
                    : isCompleted
                    ? "rgba(74, 222, 128, 0.05)"
                    : "rgba(255, 255, 255, 0.02)",
                  borderWidth: 1,
                  borderColor: isActive
                    ? "rgba(99, 102, 241, 0.3)"
                    : isCompleted
                    ? "rgba(74, 222, 128, 0.15)"
                    : "rgba(255, 255, 255, 0.05)",
                }}
              >
                <View
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: isCompleted
                      ? "rgba(74, 222, 128, 0.2)"
                      : isActive
                      ? "rgba(99, 102, 241, 0.2)"
                      : "rgba(255, 255, 255, 0.05)",
                  }}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={16} color={Colors.success} />
                  ) : isActive ? (
                    <SpinningIcon size={16} color={Colors.primary} />
                  ) : (
                    <Text className="text-xs text-ltext-muted font-medium">
                      {i + 1}
                    </Text>
                  )}
                </View>

                <Text
                  className="text-sm flex-1"
                  style={{
                    color: isCompleted
                      ? Colors.success
                      : isActive
                      ? Colors.textPrimary
                      : Colors.textMuted,
                    fontWeight: isActive ? "600" : "400",
                  }}
                >
                  {step.label}
                </Text>

                {isActive && !isDone && (
                  <SpinningIcon size={14} color={Colors.primary} />
                )}
              </View>
            );
          })}
        </View>

        {generationProgress && !isDone && !isError && (
          <View className="mt-6 items-center">
            <Text className="text-xs text-ltext-secondary">
              {generationProgress}
            </Text>
          </View>
        )}
      </View>

      <View className="px-8 pb-12">
        <View className="flex-row items-center gap-2 bg-midnight-light px-4 py-3 rounded-full border border-midnight-border justify-center">
          <FileText size={14} color={Colors.silverDark} />
          <Text className="text-xs text-ltext-secondary">
            Processing 100% offline on your device
          </Text>
        </View>
      </View>
    </View>
  );
}