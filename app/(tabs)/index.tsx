import { useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BookOpen } from "lucide-react-native";
import { StyledSafeAreaView as SafeAreaView } from "../../components/StyledSafeAreaView";
import { Colors, Shadows, Gradient } from "../../constants/theme";
import { FadeIn, useFocusKey } from "../../components/Stagger";
import { SubjectCard } from "../../components/SubjectCard";
import { Calendar } from "../../components/Calendar";
import { useReviewerStore } from "../../store/useReviewerStore";
import { dayKey } from "../../lib/insight";

export default function DashboardScreen() {
  const focusKey = useFocusKey();
  const router = useRouter();
  const subjects = useReviewerStore((s) => s.subjects);
  const attempts = useReviewerStore((s) => s.attempts);

  const totalSubjects = subjects.length;
  const avgMastery = totalSubjects > 0
    ? Math.round(subjects.reduce((sum, s) => sum + s.mastery, 0) / totalSubjects)
    : 0;
  const needsReview = subjects.filter((s) => s.needsReview).length;

  const markedDays = useMemo(() => {
    const counts = new Map<string, number>();
    attempts.forEach((a) => {
      const key = dayKey(new Date(a.completedAt));
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }, [attempts]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-midnight">
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 32 }}
        key={focusKey}
      >
        <FadeIn delay={0}>
          <View className="mt-6 mb-6">
            <Text className="text-2xl font-semibold text-ltext">
              Overview
            </Text>
            <Text className="text-sm text-ltext-secondary mt-1">
              Your learning overview at a glance.
            </Text>
          </View>
        </FadeIn>

        <FadeIn delay={0}>
          <LinearGradient
            colors={[...Gradient.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            className="rounded-xl p-4 border border-midnight-border mb-4 overflow-hidden"
            style={Shadows.card}
          >
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-semibold text-ltext">
                Daily Mastery
              </Text>
              {totalSubjects > 0 && (
                <View className="bg-lunar-muted px-2 py-1 rounded-full">
                  <Text className="text-xs font-medium text-lunar-light">
                    {totalSubjects} subject{totalSubjects !== 1 ? "s" : ""}
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-row justify-between items-end mb-2">
              <Text className="text-4xl font-bold text-lunar-light">{avgMastery}%</Text>
              <Text className="text-sm text-ltext-secondary mb-1">Overall Progress</Text>
            </View>

            <View className="w-full h-2 bg-midnight-lighter rounded-full overflow-hidden mb-3">
              <LinearGradient
                colors={[Colors.primary, Colors.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="h-full rounded-full"
                style={{ width: `${avgMastery}%` }}
              />
            </View>

            <Text className="text-sm text-ltext-secondary">
              {totalSubjects === 0
                ? "No subjects yet. Add a PDF to get started!"
                : needsReview > 0
                ? `${needsReview} topic${needsReview !== 1 ? "s" : ""} need your attention today.`
                : "All caught up! Great job keeping on track."}
            </Text>
          </LinearGradient>
        </FadeIn>

        <FadeIn delay={100}>
          <View className="mb-4">
            <Calendar markedDays={markedDays} />
          </View>
        </FadeIn>

        <FadeIn delay={200}>
          <View className="mb-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-ltext">
                Current Subjects
              </Text>
              {totalSubjects > 0 && (
                <TouchableOpacity onPress={() => router.push("/subjects")}>
                  <Text className="text-lunar-light text-xs font-medium uppercase tracking-wider">
                    View All
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {totalSubjects === 0 ? (
              <FadeIn delay={300}>
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)/add-pdf")}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[...Gradient.card]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    className="rounded-xl p-4 border border-midnight-border overflow-hidden"
                    style={Shadows.card}
                  >
                    <View className="flex-row items-start gap-3 pt-1">
                      <View className="w-10 h-10 rounded-lg bg-midnight-lighter items-center justify-center shrink-0">
                        <BookOpen size={20} color={Colors.silverDark} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-ltext leading-tight mb-1">
                          No subjects yet
                        </Text>
                        <Text className="text-sm text-ltext-secondary">
                          Tap to add a PDF and generate your first reviewer
                        </Text>
                      </View>
                    </View>

                    <View className="mt-4 pt-3 border-t border-midnight-border">
                      <Text className="text-xs text-ltext-muted text-center">
                        Add PDF → Generate Reviewer
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </FadeIn>
            ) : (
              <View className="gap-3">
                {subjects.map((subject, index) => (
                  <FadeIn key={subject.id} delay={300 + index * 80}>
                    <SubjectCard
                      subject={subject}
                      onPress={() => router.push({ pathname: "/reviewer/[id]", params: { id: subject.id } })}
                    />
                  </FadeIn>
                ))}
              </View>
            )}
          </View>
        </FadeIn>
      </ScrollView>
    </SafeAreaView>
  );
}
