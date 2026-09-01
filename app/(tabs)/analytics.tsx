import { View, Text, ScrollView } from "react-native";
import { Brain, Timer, Flame } from "lucide-react-native";
import { Colors, Shadows, Gradient } from "../../constants/theme";
import { FadeIn, useFocusKey } from "../../components/Stagger";
import { TopAppBar } from "../../components/TopAppBar";
import { SparklineChart } from "../../components/SparklineChart";
import { StatCard } from "../../components/StatCard";
import { LinearGradient } from "expo-linear-gradient";

const MASTERY_DATA = [
  32, 35, 33, 38, 42, 40, 45, 48, 46, 50, 53, 55, 52, 58, 60, 62, 61, 65,
  67, 64, 68, 70, 72, 71, 74, 76, 78, 80, 82, 85,
];

const SUBJECTS = [
  { name: "Intro to Psychology", mastery: 85, color: Colors.primary },
  { name: "Cellular Biology", mastery: 62, color: Colors.success },
  { name: "World History", mastery: 91, color: Colors.warning },
];

const HEATMAP_DATA = [
  [0.4, 0.8, 0.2, 1.0, 0, 0.6, 0.9],
  [0.7, 0.5, 0, 0.3, 0.8, 1.0, 0.4],
];

export default function AnalyticsScreen() {
  const focusKey = useFocusKey();

  return (
    <View className="flex-1 bg-midnight">
      <TopAppBar />

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
              <Text className="text-xs text-ltext-secondary">Last 30 Days</Text>
            </View>
            <SparklineChart data={MASTERY_DATA} />
          </LinearGradient>
        </FadeIn>

        <FadeIn delay={200}>
          <View className="flex-row gap-3 mb-4">
            <StatCard
              icon={<Brain size={18} color="#ffffff" />}
              label="Total Quizzes Taken"
              value="42"
              variant="primary"
            />
            <StatCard
              icon={<Timer size={18} color={Colors.silver} />}
              label="Total Study Time"
              value="18h 45m"
              variant="secondary"
            />
          </View>
        </FadeIn>

        <FadeIn delay={300}>
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
            <View className="gap-4">
              {SUBJECTS.map((subject) => (
                <View key={subject.name}>
                  <View className="flex-row justify-between items-center mb-1.5">
                    <View className="flex-row items-center gap-2">
                      <View
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: subject.color }}
                      />
                      <Text className="text-sm text-silver">{subject.name}</Text>
                    </View>
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: subject.color }}
                    >
                      {subject.mastery}%
                    </Text>
                  </View>
                  <View className="w-full h-1.5 bg-midnight-lighter rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${subject.mastery}%`,
                        backgroundColor: subject.color,
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </LinearGradient>
        </FadeIn>

        <FadeIn delay={400}>
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
                  7-Day Streak
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

            <View className="gap-1.5">
              {HEATMAP_DATA.map((row, rowIdx) => (
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
          </LinearGradient>
        </FadeIn>
      </ScrollView>
    </View>
  );
}
