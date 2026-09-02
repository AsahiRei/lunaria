import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { Moon, Timer, Flame, Sparkles } from "lucide-react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Colors, Shadows, Gradient } from "../../constants/theme";
import { FadeIn, useFocusKey } from "../../components/Stagger";
import { StyledSafeAreaView as SafeAreaView } from "../../components/StyledSafeAreaView";
import { SparklineChart } from "../../components/SparklineChart";
import { StatCard } from "../../components/StatCard";
import { LinearGradient } from "expo-linear-gradient";
import { useReviewerStore } from "../../store/useReviewerStore";
import {
  buildInsightStats,
  computeStreak,
  dayKey,
  ensureInsight,
  getCachedInsight,
  getInsightKey,
} from "../../lib/insight";
import type { InsightStats } from "../../lib/insightPrompt";
import type { QuizAttempt } from "../../lib/storage";

const SUBJECT_COLORS = [Colors.primary, Colors.success, Colors.warning];

const revealedKeys = new Set<string>();

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function buildMasteryGrowth(attempts: QuizAttempt[]): number[] {
  const growth: number[] = [];
  let sum = 0;
  attempts.forEach((attempt, i) => {
    sum += attempt.percentage;
    growth.push(Math.round(sum / (i + 1)));
  });
  return growth;
}

function buildHeatmap(attempts: QuizAttempt[]): number[][] {
  const counts = new Map<string, number>();
  attempts.forEach((a) => {
    const key = dayKey(new Date(a.completedAt));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monday = new Date(today);
  monday.setDate(monday.getDate() - ((today.getDay() + 6) % 7));

  const rows: { count: number }[][] = [];
  for (let week = 1; week >= 0; week--) {
    const start = new Date(monday);
    start.setDate(monday.getDate() - week * 7);
    const row: { count: number }[] = [];
    for (let day = 0; day < 7; day++) {
      const cell = new Date(start);
      cell.setDate(start.getDate() + day);
      const key = dayKey(cell);
      row.push({ count: cell > today ? 0 : counts.get(key) ?? 0 });
    }
    rows.push(row);
  }

  const max = Math.max(...rows.flat().map((c) => c.count));
  return rows.map((row) =>
    row.map((cell) =>
      cell.count === 0 || max === 0 ? 0 : 0.3 + 0.7 * (cell.count / max)
    )
  );
}

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
      <Sparkles size={size} color={color} />
    </Animated.View>
  );
}

function AIInsightCard({
  stats,
  dataKey,
}: {
  stats: InsightStats;
  dataKey: string;
}) {
  const [status, setStatus] = useState<"loading" | "ready" | "hidden">(() =>
    getCachedInsight(dataKey) ? "ready" : "loading"
  );
  const [fullText, setFullText] = useState(
    () => getCachedInsight(dataKey) ?? ""
  );
  const [animate, setAnimate] = useState(() => {
    const cached = getCachedInsight(dataKey);
    return !!cached && !revealedKeys.has(dataKey);
  });
  const [displayed, setDisplayed] = useState(() => {
    const cached = getCachedInsight(dataKey);
    if (!cached) return "";
    return revealedKeys.has(dataKey) ? cached : "";
  });
  const fullTextRef = useRef(fullText);

  useEffect(() => {
    let cancelled = false;
    ensureInsight(dataKey, stats)
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setStatus("hidden");
          return;
        }
        if (fullTextRef.current === result) return;
        fullTextRef.current = result;
        setFullText(result);
        setAnimate(!revealedKeys.has(dataKey));
        setStatus("ready");
      })
      .catch((err) => {
        console.error("[analytics] Failed to generate insight:", err);
        if (!cancelled) setStatus("hidden");
      });

    return () => {
      cancelled = true;
    };
  }, [dataKey, stats]);

  const typing =
    status === "ready" && animate && displayed.length < fullText.length;

  useEffect(() => {
    if (status !== "ready" || !fullText) return;
    if (!animate) {
      setDisplayed(fullText);
      revealedKeys.add(dataKey);
      return;
    }
    setDisplayed("");
    let i = 0;
    const step = Math.max(1, Math.ceil(fullText.length / 150));
    const timer = setInterval(() => {
      i += step;
      setDisplayed(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(timer);
    }, 18);
    revealedKeys.add(dataKey);
    return () => clearInterval(timer);
  }, [fullText, animate, status, dataKey]);

  if (status === "hidden") return null;

  return (
    <LinearGradient
      colors={[...Gradient.card]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="rounded-xl p-4 border border-midnight-border mb-4 overflow-hidden"
      style={Shadows.card}
    >
      <View className="flex-row items-center gap-2 mb-2">
        <Sparkles size={18} color={Colors.primary} />
        <Text className="text-base font-semibold text-ltext">
          Luna's Insight
        </Text>
      </View>
      {status === "ready" ? (
        <Text className="text-sm text-ltext-secondary leading-5">
          {displayed}
          {typing && (
            <Text style={{ color: Colors.primary }}>&#9613;</Text>
          )}
        </Text>
      ) : (
        <View className="flex-row items-center gap-2 py-1">
          <SpinningIcon size={14} color={Colors.primary} />
          <Text className="text-sm text-ltext-secondary">
            Analyzing your progress...
          </Text>
        </View>
      )}
    </LinearGradient>
  );
}

export default function AnalyticsScreen() {
  const focusKey = useFocusKey();
  const subjects = useReviewerStore((s) => s.subjects);
  const attempts = useReviewerStore((s) => s.attempts);

  const totalQuizzes = attempts.length;
  const totalStudyMs = attempts.reduce((sum, a) => sum + a.durationMs, 0);
  const growth = buildMasteryGrowth(attempts);
  const sparkData = growth.length === 1 ? [growth[0], growth[0]] : growth;
  const streak = computeStreak(attempts);
  const heatmap = buildHeatmap(attempts);

  const insightStats = useMemo(
    () => buildInsightStats(subjects, attempts),
    [subjects, attempts]
  );
  const insightKey = getInsightKey(attempts);

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
              Study Analytics
            </Text>
            <Text className="text-sm text-ltext-secondary mt-1">
              Track your progress and mastery over time.
            </Text>
          </View>
        </FadeIn>

        <FadeIn delay={100}>
          <LinearGradient
            colors={[...Gradient.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            className="rounded-xl p-4 border border-midnight-border mb-4 overflow-hidden"
            style={Shadows.card}
          >
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base font-semibold text-ltext">
                Mastery Growth
              </Text>
              <Text className="text-xs text-ltext-secondary">All Time</Text>
            </View>
            {sparkData.length < 2 ? (
              <View className="items-center py-10">
                <Text className="text-sm text-ltext-secondary text-center leading-5">
                  Take a quiz to start tracking your mastery growth.
                </Text>
              </View>
            ) : (
              <SparklineChart data={sparkData} />
            )}
          </LinearGradient>
        </FadeIn>

        {attempts.length > 0 && (
          <FadeIn delay={200}>
            <AIInsightCard stats={insightStats} dataKey={insightKey} />
          </FadeIn>
        )}

        <FadeIn delay={300}>
          <View className="flex-row gap-3 mb-4">
            <StatCard
              icon={<Moon size={18} color="#ffffff" />}
              label="Total Quizzes Taken"
              value={`${totalQuizzes}`}
              variant="primary"
            />
            <StatCard
              icon={<Timer size={18} color={Colors.silver} />}
              label="Total Quiz Time"
              value={formatDuration(totalStudyMs)}
              variant="secondary"
            />
          </View>
        </FadeIn>

        <FadeIn delay={400}>
          <LinearGradient
            colors={[...Gradient.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            className="rounded-xl p-4 border border-midnight-border mb-4 overflow-hidden"
            style={Shadows.card}
          >
            <Text className="text-base font-semibold text-ltext mb-4">
              Subject Mastery
            </Text>
            {subjects.length === 0 ? (
              <Text className="text-sm text-ltext-secondary text-center py-4 leading-5">
                Add a PDF to start building subjects.
              </Text>
            ) : (
              <View className="gap-4">
                {subjects.map((subject, index) => {
                  const color = SUBJECT_COLORS[index % SUBJECT_COLORS.length];
                  return (
                    <View key={subject.id}>
                      <View className="flex-row items-center gap-2 mb-1.5">
                        <View className="flex-row items-center gap-2 flex-1 min-w-0">
                          <View
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <Text
                            className="flex-1 text-sm text-silver"
                            numberOfLines={1}
                          >
                            {subject.title}
                          </Text>
                        </View>
                        <Text
                          className="text-sm font-semibold"
                          style={{ color }}
                        >
                          {subject.mastery}%
                        </Text>
                      </View>
                      <View className="w-full h-1.5 bg-midnight-lighter rounded-full overflow-hidden">
                        <View
                          className="h-full rounded-full"
                          style={{
                            width: `${subject.mastery}%`,
                            backgroundColor: color,
                          }}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </LinearGradient>
        </FadeIn>

        <FadeIn delay={500}>
          <LinearGradient
            colors={[...Gradient.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            className="rounded-xl p-4 border border-midnight-border overflow-hidden"
            style={Shadows.card}
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-base font-semibold text-ltext">
                Study Consistency
              </Text>
              <View className="flex-row items-center gap-1 bg-rose-dark/30 px-2.5 py-1 rounded-full">
                <Flame size={14} color={Colors.rose} />
                <Text className="text-xs font-medium text-rose">
                  {streak}-Day Streak
                </Text>
              </View>
            </View>

            <View className="flex-row justify-between mb-2 px-0.5">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <Text
                  key={day}
                  className="text-[10px] text-ltext-muted w-[12.5%] text-center"
                >
                  {day}
                </Text>
              ))}
            </View>

            {attempts.length === 0 ? (
              <Text className="text-sm text-ltext-secondary text-center py-6 leading-5">
                No quiz activity yet. Complete a quiz to fill in your week.
              </Text>
            ) : (
              <View className="gap-1.5">
                {heatmap.map((row, rowIdx) => (
                  <View key={rowIdx} className="flex-row gap-1.5">
                    {row.map((intensity, colIdx) => (
                      <View
                        key={colIdx}
                        className="flex-1 aspect-square rounded-sm"
                        style={{
                          backgroundColor:
                            intensity === 0
                              ? Colors.surfaceBorder
                              : `rgba(99, 102, 241, ${intensity})`,
                        }}
                      />
                    ))}
                  </View>
                ))}
              </View>
            )}
          </LinearGradient>
        </FadeIn>
      </ScrollView>
    </SafeAreaView>
  );
}
