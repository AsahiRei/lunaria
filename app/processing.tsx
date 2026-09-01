import { useEffect, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Brain, ArrowLeft, CheckCircle2, Loader2, FileText } from "lucide-react-native";
import { Colors } from "../constants/theme";
import { useReviewerStore, type GenerationState, type ReviewerData } from "../store/useReviewerStore";
import { useLlama } from "../hooks/useLlama";
import { useGenerationMetrics } from "../hooks/useGenerationMetrics";
import { extractTextFromPdf, smartExtract } from "../lib/pdfExtractor";
import { buildMessages, parseReviewerResponse } from "../lib/reviewerPrompt";
import { getCachedReviewer, setCachedReviewer } from "../lib/cache";

const STEPS = [
  { key: "extracting", label: "Extracting text from PDF" },
  { key: "loading", label: "Loading AI model" },
  { key: "analyzing", label: "Analyzing document" },
  { key: "generating", label: "Generating reviewer" },
  { key: "parsing", label: "Finalizing results" },
];

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

      const truncated = smartExtract(pdfText, 2000);
      startGeneration(truncated.length);

      const cached = await getCachedReviewer(truncated);
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

      const messages = buildMessages(
        truncated,
        focusTopic || undefined,
        pageRange === "custom" ? customRange : undefined
      );

      let attempts = 0;
      const maxAttempts = 3;
      let tokenCount = 0;

      while (!reviewerData && attempts < maxAttempts) {
        attempts++;
        tokenCount = 0;
        setGenerationState("generating", `Generating reviewer... (attempt ${attempts}/${maxAttempts})`);

        const result = await ctx.completion(
          {
            messages,
            n_predict: 2000,
            temperature: 0.3,
            top_p: 0.9,
            top_k: 45,
            penalty_repeat: 1.1,
            stop: ["</s>", "<|end|>", "<|eot_id|>", "<|end_of_text|>"],
          },
          (data) => {
            if (data.token) {
              tokenCount++;
              updateTokens(tokenCount);
              if (tokenCount % 20 === 0) {
                setGenerationState("generating", `Generating... (${tokenCount} tokens)`);
              }
            }
          }
        );

        setGenerationState("generating", "Parsing results...");
        console.log("[processing] Raw text:", result.text?.slice(0, 500));
        console.log("[processing] Raw content:", result.content?.slice(0, 500));
        console.log("[processing] truncated:", result.truncated, "stopped_limit:", result.stopped_limit, "tokens_predicted:", result.tokens_predicted);
        reviewerData = parseReviewerResponse(result.text || result.content);
        endGeneration(tokenCount, !!reviewerData);
      }

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
      setCachedReviewer(truncated, reviewerData);
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
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-6"
            style={{
              backgroundColor: isDone
                ? "rgba(74, 222, 128, 0.15)"
                : isError
                ? "rgba(248, 113, 113, 0.15)"
                : "rgba(99, 102, 241, 0.15)",
            }}
          >
            {isDone ? (
              <CheckCircle2 size={48} color={Colors.success} />
            ) : isError ? (
              <ArrowLeft size={48} color={Colors.error} />
            ) : (
              <Brain size={48} color={Colors.primary} />
            )}
          </View>

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
                    <Loader2 size={16} color={Colors.primary} />
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
                  <Loader2 size={14} color={Colors.primary} />
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