import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Upload,
  Plus,
  BookOpen,
  Target,
  Moon,
  Lock,
  FileText,
  X,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Shadows, Gradient } from "../../constants/theme";
import { FadeIn, useFocusKey } from "../../components/Stagger";
import { StyledSafeAreaView as SafeAreaView } from "../../components/StyledSafeAreaView";
import { useReviewerStore } from "../../store/useReviewerStore";
import { useLlama } from "../../hooks/useLlama";
import { useModelModalStore } from "../../store/useModelModalStore";
import { pickPdf, type PickedPdf } from "../../lib/pdfExtractor";

export default function AddPdfScreen() {
  const focusKey = useFocusKey();
  const router = useRouter();
  const { generationState } = useReviewerStore();
  const {
    isLoaded,
    modelExists,
    checkModel,
  } = useLlama();

  const [pageRange, setPageRange] = useState<"all" | "custom">("all");
  const [customRange, setCustomRange] = useState("");
  const [focusTopic, setFocusTopic] = useState("");
  const [pickedFile, setPickedFile] = useState<PickedPdf | null>(null);

  useEffect(() => {
    checkModel();
  }, [checkModel]);

  const needsModel = !modelExists && !isLoaded;
  const modelModalVisible = useModelModalStore((s) => s.visible);
  const openModelModal = useModelModalStore((s) => s.openModelModal);

  useEffect(() => {
    if (!modelModalVisible) checkModel();
  }, [modelModalVisible, checkModel]);

  const handlePickFile = useCallback(async () => {
    if (generationState === "generating" || generationState === "extracting")
      return;
    const file = await pickPdf();
    if (file) {
      setPickedFile(file);
      if (needsModel) openModelModal();
    }
  }, [generationState, needsModel, openModelModal]);

  const handleClearFile = useCallback(() => {
    setPickedFile(null);
  }, []);

  const handleGenerate = useCallback(() => {
    if (!pickedFile) {
      Alert.alert("No File", "Please select a PDF file first.");
      return;
    }

    if (needsModel) {
      openModelModal();
      return;
    }

    router.push({
      pathname: "/processing",
      params: {
        fileUri: pickedFile.uri,
        fileName: pickedFile.name,
        fileSize: String(pickedFile.size),
        focusTopic: focusTopic || undefined,
        pageRange,
        customRange: pageRange === "custom" ? customRange : undefined,
      },
    });
  }, [pickedFile, focusTopic, pageRange, customRange, router, needsModel, openModelModal]);

  const canGenerate = !!pickedFile;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-midnight">
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 32 }}
        key={focusKey}
      >
        <FadeIn delay={0}>
          <View className="mt-6 mb-6">
            <Text className="text-2xl font-semibold text-ltext">
              New Study Topic
            </Text>
            <Text className="text-sm text-ltext-secondary mt-1">
              Import a document to create an offline study session.
            </Text>
          </View>
        </FadeIn>

        <FadeIn delay={100}>
          <TouchableOpacity
            className="rounded-xl p-6 mb-4 border border-midnight-border items-center justify-center min-h-[220px] relative overflow-hidden"
            activeOpacity={0.8}
            style={Shadows.elevated}
            onPress={handlePickFile}
            disabled={
              generationState === "generating" ||
              generationState === "extracting"
            }
          >
            <LinearGradient
              colors={[...Gradient.card]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="absolute inset-0 rounded-xl"
            />

            <View className="relative z-10 items-center text-center p-6 w-full border-2 border-dashed border-midnight-border rounded-lg bg-midnight/50">
              {pickedFile ? (
                <>
                  <View className="mb-4">
                    <FileText size={40} color={Colors.primary} />
                  </View>
                  <Text className="text-lg font-semibold text-ltext mb-1 text-center">
                    {pickedFile.name}
                  </Text>
                  <Text className="text-sm text-ltext-secondary text-center mb-3">
                    {(pickedFile.size / 1024 / 1024).toFixed(1)} MB
                  </Text>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleClearFile();
                    }}
                    className="flex-row items-center gap-1.5 bg-midnight-lighter px-4 py-2 rounded-full border border-midnight-border"
                  >
                    <X size={14} color={Colors.silverDark} />
                    <Text className="text-xs text-ltext-secondary">Remove</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View className="mb-4">
                    <Upload size={40} color={Colors.primary} />
                  </View>
                  <Text className="text-lg font-semibold text-ltext mb-1 text-center">
                    Select a PDF from your device to begin
                  </Text>
                  <Text className="text-sm text-ltext-secondary text-center mb-5">
                    Tap to browse files
                  </Text>
                  <TouchableOpacity
                    className="bg-lunar flex-row items-center gap-2 px-6 py-2.5 rounded-full"
                    onPress={(e) => {
                      e.stopPropagation();
                      handlePickFile();
                    }}
                  >
                    <Plus size={16} color="#ffffff" />
                    <Text className="text-sm font-medium text-white">
                      Choose File
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableOpacity>
        </FadeIn>

        <View className="flex-col gap-4 mb-8">
          <FadeIn delay={200}>
            <LinearGradient
              colors={[...Gradient.card]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              className="rounded-xl p-4 border border-midnight-border overflow-hidden"
              style={Shadows.card}
            >
              <View className="flex-row items-center gap-2 mb-3">
                <BookOpen size={20} color={Colors.primary} />
                <Text className="text-lg font-semibold text-ltext">
                  Page Range
                </Text>
              </View>

              <View className="gap-2">
                <TouchableOpacity
                  className={`flex-row items-center gap-3 p-3 rounded-lg border overflow-hidden ${
                    pageRange === "all"
                      ? "border-lunar bg-lunar-muted/50"
                      : "border-midnight-border"
                  }`}
                  onPress={() => setPageRange("all")}
                  activeOpacity={0.7}
                  disabled={
                    generationState === "generating" ||
                    generationState === "extracting"
                  }
                >
                  <View
                    className={`w-4 h-4 rounded-full border-2 items-center justify-center ${
                      pageRange === "all"
                        ? "border-lunar"
                        : "border-silver-dark"
                    }`}
                  >
                    {pageRange === "all" && (
                      <View className="w-2 h-2 rounded-full bg-lunar" />
                    )}
                  </View>
                  <Text className="text-sm text-ltext">All pages</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-col gap-2 p-3 rounded-lg border overflow-hidden ${
                    pageRange === "custom"
                      ? "border-lunar bg-lunar-muted/50"
                      : "border-midnight-border"
                  }`}
                  onPress={() => setPageRange("custom")}
                  activeOpacity={0.7}
                  disabled={
                    generationState === "generating" ||
                    generationState === "extracting"
                  }
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      className={`w-4 h-4 rounded-full border-2 items-center justify-center ${
                        pageRange === "custom"
                          ? "border-lunar"
                          : "border-silver-dark"
                      }`}
                    >
                      {pageRange === "custom" && (
                        <View className="w-2 h-2 rounded-full bg-lunar" />
                      )}
                    </View>
                    <Text className="text-sm text-ltext">Custom range</Text>
                  </View>
                  {pageRange === "custom" && (
                    <TextInput
                      className="w-full bg-midnight rounded border border-midnight-border text-sm p-2.5 text-ltext ml-7"
                      placeholder="e.g., 10-25, 30"
                      placeholderTextColor={Colors.textMuted}
                      value={customRange}
                      onChangeText={setCustomRange}
                      editable={generationState === "idle"}
                    />
                  )}
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </FadeIn>

          <FadeIn delay={300}>
            <LinearGradient
              colors={[...Gradient.card]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              className="rounded-xl p-4 border border-midnight-border overflow-hidden"
              style={Shadows.card}
            >
              <View className="flex-row items-center gap-2 mb-2">
                <Target size={20} color={Colors.primary} />
                <Text className="text-lg font-semibold text-ltext">
                  Focus Topic{" "}
                  <Text className="text-ltext-muted font-normal text-sm">
                    (Optional)
                  </Text>
                </Text>
              </View>
              <Text className="text-sm text-ltext-secondary mb-3">
                Guide the reviewer to focus on specific themes or concepts
                within the document.
              </Text>
              <TextInput
                className="w-full bg-midnight rounded-lg border border-midnight-border text-sm p-3 text-ltext"
                placeholder="e.g., Cell division, mitosis phases..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={focusTopic}
                onChangeText={setFocusTopic}
                style={{ minHeight: 80 }}
                editable={generationState === "idle"}
              />
            </LinearGradient>
          </FadeIn>
        </View>

        <FadeIn delay={400}>
          <View className="gap-4">
            <TouchableOpacity
              className="w-full flex-row items-center justify-center gap-2 py-4 px-8 rounded-full overflow-hidden"
              activeOpacity={0.8}
              style={Shadows.glow}
              onPress={handleGenerate}
              disabled={!canGenerate}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="absolute inset-0"
              />
              <Moon size={22} color="#ffffff" />
              <Text className="text-lg font-semibold text-white relative z-10">
                Generate Reviewer
              </Text>
            </TouchableOpacity>

            <View className="flex-row items-center gap-2 bg-midnight-light px-4 py-2 rounded-full border border-midnight-border">
              <Lock size={14} color={Colors.silverDark} />
              <Text className="text-xs text-ltext-secondary opacity-80 px-2">
                Processing happens 100% offline. Your data never leaves this
                device.
              </Text>
            </View>
          </View>
        </FadeIn>
      </ScrollView>
    </SafeAreaView>
  );
}
