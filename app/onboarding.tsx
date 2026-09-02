import { useCallback, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  type ImageSourcePropType,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Moon, FileText, Sparkles, BarChart3 } from "lucide-react-native";
import { StyledSafeAreaView as SafeAreaView } from "../components/StyledSafeAreaView";
import { Colors, Shadows } from "../constants/theme";
import { FadeIn } from "../components/Stagger";
import { useOnboardingStore } from "../store/useOnboardingStore";

const HERO_IMAGE = require("../assets/images/lunaria.png");

const FEATURES = [
  {
    icon: FileText,
    title: "PDFs in, reviewers out",
    description:
      "Add any lecture notes or readings and get clean summaries, key terms, and formulas.",
  },
  {
    icon: Sparkles,
    title: "100% offline, always private",
    description:
      "The AI runs entirely on your device. No accounts, no uploads — your notes never leave your phone.",
  },
  {
    icon: BarChart3,
    title: "Study smarter",
    description:
      "Quizzes and mastery tracking show you exactly what to review next, day by day.",
  },
];

function PulsingMoon() {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View
      style={style}
      className="w-24 h-24 rounded-full items-center justify-center bg-lunar-muted"
    >
      <Moon size={48} color={Colors.primaryLight} />
    </Animated.View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const complete = useOnboardingStore((s) => s.complete);

  const handleGetStarted = useCallback(async () => {
    await complete();
    router.replace("/(tabs)");
  }, [complete, router]);

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-midnight">
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn delay={0}>
          <View className="items-center mb-8">
            {HERO_IMAGE ? (
              <Image
                source={HERO_IMAGE}
                className="w-40 h-44 rounded-2xl"
                resizeMode="contain"
              />
            ) : (
              <View
                className="w-full h-64 rounded-2xl items-center justify-center border border-midnight-border overflow-hidden"
                style={Shadows.elevated}
              >
                <LinearGradient
                  colors={["#1a1040", "#0d0d2b"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  className="absolute inset-0"
                />
                <PulsingMoon />
              </View>
            )}
          </View>
        </FadeIn>

        <FadeIn delay={100}>
          <View className="items-center mb-10">
            <Text className="text-3xl font-bold text-ltext text-center">
              Welcome to Lunaria
            </Text>
            <Text className="text-base text-ltext-secondary text-center mt-3 leading-relaxed px-2">
              Turn your study materials into smart reviewers and quizzes —
              powered by AI that runs right on your device.
            </Text>
          </View>
        </FadeIn>

        <View className="gap-4 mb-10">
          {FEATURES.map((feature, index) => (
            <FadeIn key={feature.title} delay={200 + index * 100}>
              <View className="flex-row items-start gap-3 rounded-xl p-4 bg-midnight-light border border-midnight-border">
                <View className="w-10 h-10 rounded-lg bg-lunar-muted items-center justify-center shrink-0">
                  <feature.icon size={20} color={Colors.primaryLight} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-ltext mb-1">
                    {feature.title}
                  </Text>
                  <Text className="text-sm text-ltext-secondary leading-snug">
                    {feature.description}
                  </Text>
                </View>
              </View>
            </FadeIn>
          ))}
        </View>

        <FadeIn delay={550}>
          <TouchableOpacity
            className="w-full flex-row items-center justify-center gap-2 py-4 px-8 rounded-full overflow-hidden"
            activeOpacity={0.8}
            style={Shadows.glow}
            onPress={handleGetStarted}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="absolute inset-0"
            />
            <Moon size={20} color="#ffffff" />
            <Text className="text-lg font-semibold text-white relative z-10">
              Get Started
            </Text>
          </TouchableOpacity>

          <Text className="text-xs text-ltext-muted text-center mt-4">
            Made for moonlit study sessions
          </Text>
        </FadeIn>
      </ScrollView>
    </SafeAreaView>
  );
}
