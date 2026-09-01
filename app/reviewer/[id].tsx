import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, BookOpen, Calculator, List, RectangleVertical, Tag } from "lucide-react-native";
import { Colors, Shadows, Gradient } from "../../constants/theme";
import { FadeIn } from "../../components/Stagger";
import { FlashCardPager } from "../../components/FlashCardPager";
import { useReviewerStore } from "../../store/useReviewerStore";

const FALLBACK_REVIEWER = {
  title: "No Reviewer Found",
  subtitle: "Generate one from the Add PDF tab",
  summary: [],
  formulas: [],
  concepts: [],
  keywords: [],
};

export default function ReviewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"reviewer" | "quiz">("reviewer");
  const [viewMode, setViewMode] = useState<"list" | "flashcard">("list");
  const getReviewer = useReviewerStore((s) => s.getReviewer);

  const data = (id ? getReviewer(id) : undefined) ?? FALLBACK_REVIEWER;
  const conceptTerms = new Set(data.concepts.map((c) => c.term.toLowerCase()));
  const uniqueKeywords = data.keywords.filter(
    (k) => !conceptTerms.has(k.term.toLowerCase())
  );

  return (
    <View className="flex-1 bg-midnight">
      <View className="flex-row items-center justify-between px-5 pt-12 pb-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center"
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={Colors.silver} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-lunar-light tracking-wide">
          Review Subject
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <FadeIn delay={0}>
          <View className="mt-4 mb-4">
            <Text className="text-2xl font-bold text-ltext leading-tight">
              {data.title}
            </Text>
            <Text className="text-sm text-ltext-secondary mt-1">
              {data.subtitle}
            </Text>
          </View>
        </FadeIn>

        <FadeIn delay={50}>
          <View className="flex-row border-b border-midnight-border mb-5">
            <TouchableOpacity
              onPress={() => setActiveTab("reviewer")}
              className={`px-4 py-3 border-b-2 ${
                activeTab === "reviewer"
                  ? "border-lunar"
                  : "border-transparent"
              }`}
              activeOpacity={0.7}
            >
              <Text className={`text-sm font-semibold ${
                activeTab === "reviewer" ? "text-lunar-light" : "text-ltext-secondary"
              }`}>
                Review Subject
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab("quiz")}
              className={`px-4 py-3 border-b-2 ${
                activeTab === "quiz"
                  ? "border-lunar"
                  : "border-transparent"
              }`}
              activeOpacity={0.7}
            >
              <Text className={`text-sm font-semibold ${
                activeTab === "quiz" ? "text-lunar-light" : "text-ltext-secondary"
              }`}>
                Quiz
              </Text>
            </TouchableOpacity>
          </View>
        </FadeIn>

        {activeTab === "reviewer" && (data.formulas.length > 0 || data.concepts.length > 0 || uniqueKeywords.length > 0) && (
          <FadeIn delay={70}>
            <View className="flex-row justify-end mb-4 gap-2">
              <TouchableOpacity
                onPress={() => setViewMode("list")}
                className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                  viewMode === "list"
                    ? "border-lunar bg-lunar/10"
                    : "border-midnight-border bg-midnight/40"
                }`}
                activeOpacity={0.7}
              >
                <List size={14} color={viewMode === "list" ? Colors.primaryLight : Colors.silverDark} />
                <Text className={`text-xs font-medium ${viewMode === "list" ? "text-lunar-light" : "text-ltext-secondary"}`}>
                  List
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setViewMode("flashcard")}
                className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                  viewMode === "flashcard"
                    ? "border-lunar bg-lunar/10"
                    : "border-midnight-border bg-midnight/40"
                }`}
                activeOpacity={0.7}
              >
                <RectangleVertical size={14} color={viewMode === "flashcard" ? Colors.primaryLight : Colors.silverDark} />
                <Text className={`text-xs font-medium ${viewMode === "flashcard" ? "text-lunar-light" : "text-ltext-secondary"}`}>
                  Flashcards
                </Text>
              </TouchableOpacity>
            </View>
          </FadeIn>
        )}

        {activeTab === "reviewer" ? (
          <>
            {data.summary.length > 0 && (
              <FadeIn delay={100}>
                <LinearGradient
                  colors={[...Gradient.card]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  className="rounded-xl p-4 border border-midnight-border mb-4 overflow-hidden"
                  style={Shadows.card}
                >
                  <View className="flex-row items-center gap-2 mb-3">
                    <BookOpen size={18} color={Colors.primary} />
                    <Text className="text-base font-semibold text-ltext">Summary</Text>
                  </View>
                  <View className="gap-2">
                    {data.summary.map((item, i) => (
                      <View key={i} className="flex-row gap-2">
                        <Text className="text-lunar-light mt-0.5">•</Text>
                        <Text className="flex-1 text-sm text-ltext-secondary leading-5">
                          {item}
                        </Text>
                      </View>
                    ))}
                  </View>
                </LinearGradient>
              </FadeIn>
            )}

            {data.concepts.length > 0 && (
              <FadeIn delay={140}>
                <LinearGradient
                  colors={[...Gradient.card]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  className="rounded-xl p-4 border border-midnight-border mb-4 overflow-hidden"
                  style={Shadows.card}
                >
                  <View className="flex-row items-center gap-2 mb-3">
                    <Tag size={18} color={Colors.primary} />
                    <Text className="text-base font-semibold text-ltext">Key Concepts</Text>
                  </View>
                  {viewMode === "list" ? (
                    <View className="gap-2">
                      {data.concepts.map((item, i) => (
                        <View
                          key={i}
                          className={`pb-2 ${
                            i < data.concepts.length - 1 ? "border-b border-midnight-border" : ""
                          }`}
                        >
                          <Text className="text-sm font-semibold text-ltext mb-0.5">
                            {item.term}
                          </Text>
                          <Text className="text-xs text-ltext-secondary leading-4">
                            {item.definition}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <FlashCardPager
                      items={data.concepts.map((item) => ({
                        frontLabel: "Concept",
                        frontValue: item.term,
                        backLabel: "Definition",
                        backValue: item.definition,
                        accentColor: Colors.primary,
                      }))}
                    />
                  )}
                </LinearGradient>
              </FadeIn>
            )}

            {data.formulas.length > 0 && (
              <FadeIn delay={180}>
                <LinearGradient
                  colors={[...Gradient.card]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  className="rounded-xl p-4 border border-midnight-border mb-4 overflow-hidden"
                  style={Shadows.card}
                >
                  <View className="flex-row items-center gap-2 mb-3">
                    <Calculator size={18} color={Colors.primaryLight} />
                    <Text className="text-base font-semibold text-ltext">Key Formulas</Text>
                  </View>
                  {viewMode === "list" ? (
                    <View className="gap-2">
                      {data.formulas.map((item, i) => (
                        <View
                          key={i}
                          className="bg-midnight/60 rounded-lg p-3 border border-midnight-border"
                        >
                          <Text className="text-xs text-ltext-secondary mb-1">{item.label}</Text>
                          <Text className="text-base font-semibold text-lunar-light text-center">
                            {item.formula}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <FlashCardPager
                      items={data.formulas.map((item) => ({
                        frontLabel: "Formula",
                        frontValue: item.label,
                        backLabel: "Expression",
                        backValue: item.formula,
                        accentColor: Colors.primaryLight,
                      }))}
                    />
                  )}
                </LinearGradient>
              </FadeIn>
            )}

            {uniqueKeywords.length > 0 && (
              <FadeIn delay={320}>
                <LinearGradient
                  colors={[...Gradient.card]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  className="rounded-xl p-4 border border-midnight-border mb-4 overflow-hidden"
                  style={Shadows.card}
                >
                  <View className="flex-row items-center gap-2 mb-3">
                    <Tag size={18} color={Colors.info} />
                    <Text className="text-base font-semibold text-ltext">Keywords</Text>
                  </View>
                  {viewMode === "list" ? (
                    <View className="gap-2">
                      {uniqueKeywords.map((item, i) => (
                        <View
                          key={i}
                          className={`pb-2 ${
                            i < uniqueKeywords.length - 1 ? "border-b border-midnight-border" : ""
                          }`}
                        >
                          <Text className="text-sm font-semibold text-ltext mb-0.5">
                            {item.term}
                          </Text>
                          <Text className="text-xs text-ltext-secondary leading-4">
                            {item.definition}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <FlashCardPager
                      items={uniqueKeywords.map((item) => ({
                        frontLabel: "Keyword",
                        frontValue: item.term,
                        backLabel: "Definition",
                        backValue: item.definition,
                        accentColor: Colors.info,
                      }))}
                    />
                  )}
                </LinearGradient>
              </FadeIn>
            )}
          </>
        ) : (
          <FadeIn delay={100}>
            <View className="items-center py-16">
              <Text className="text-ltext-secondary text-sm">
                Quiz content coming soon.
              </Text>
            </View>
          </FadeIn>
        )}

        {activeTab === "reviewer" && data.summary.length > 0 && (
          <FadeIn delay={340}>
            <View className="items-center mt-4 mb-10">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActiveTab("quiz")}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="flex-row items-center gap-2 px-8 py-4 rounded-full overflow-hidden"
                  style={Shadows.card}
                >
                  <Text className="text-white text-sm font-semibold tracking-wide">
                    START QUIZ
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </FadeIn>
        )}
      </ScrollView>
    </View>
  );
}
