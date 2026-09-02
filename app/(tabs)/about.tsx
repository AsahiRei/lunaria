import { useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Globe, GitFork, Info } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Shadows, Gradient } from "../../constants/theme";
import { FadeIn, useFocusKey } from "../../components/Stagger";
import { StyledSafeAreaView as SafeAreaView } from "../../components/StyledSafeAreaView";

const LOGO_IMAGE = require("../../assets/images/lunaria.png");

const SOCIALS = [
  {
    icon: Globe,
    label: "Facebook",
    url: "https://www.facebook.com/profile.php?id=61593685534634",
  },
  {
    icon: GitFork,
    label: "GitHub",
    url: "https://github.com/AsahiRei",
  },
];

export default function AboutScreen() {
  const focusKey = useFocusKey();
  const openLink = useCallback(async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.error("[about] Failed to open link:", err);
    }
  }, []);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-midnight">
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{
          paddingBottom: 32,
          flexGrow: 1,
          justifyContent: "center",
        }}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn delay={0} focusKey={focusKey}>
          <View className="items-center mb-8">
            <Image
              source={LOGO_IMAGE}
              className="w-36 h-40"
              resizeMode="contain"
            />
          </View>
        </FadeIn>

        <FadeIn delay={100} focusKey={focusKey}>
          <View className="items-center mb-8">
            <Text className="text-3xl font-bold text-ltext text-center">
              Lunaria
            </Text>
            <Text className="text-sm text-ltext-muted mt-1 tracking-widest uppercase">
              Learn Brighter Under the Moonlight
            </Text>
          </View>
        </FadeIn>

        <FadeIn delay={200} focusKey={focusKey}>
          <LinearGradient
            colors={[...Gradient.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            className="rounded-xl p-4 border border-midnight-border mb-4 overflow-hidden"
            style={Shadows.card}
          >
            <View className="flex-row items-center gap-2 mb-2">
              <Info size={18} color={Colors.primary} />
              <Text className="text-base font-semibold text-ltext">
                About This Project
              </Text>
            </View>
            <Text className="text-sm text-ltext-secondary leading-5">
              Lunaria is an AI-powered study companion that turns your PDFs
              into smart reviewers and quizzes. It summarizes lecture notes,
              highlights key terms and formulas, and tracks your mastery over
              time — all with an AI that runs entirely on your device. No
              account needed and completely offline: your notes never
              leave your phone.
            </Text>
          </LinearGradient>
        </FadeIn>

        <FadeIn delay={300} focusKey={focusKey}>
          <LinearGradient
            colors={[...Gradient.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            className="rounded-xl p-4 border border-midnight-border mb-4 overflow-hidden"
            style={Shadows.card}
          >
            <Text className="text-base font-semibold text-ltext mb-1">
              Creator
            </Text>
            <Text className="text-sm text-ltext-secondary mb-4">
              Lunaria was created and developed by
            </Text>
            <Image source={require("../../assets/images/asahirei.jpg")} className="w-20 h-20 rounded-full mb-4 self-center" />
            <Text className="text-lg font-bold text-ltext text-center mb-1">
              Arn Christian S. Rosales
            </Text>
            <Text className="text-xs text-ltext-muted text-center mb-4">
              Follow or reach out through the links below
            </Text>

            <View className="flex-row justify-center gap-3">
              {SOCIALS.map((social) => (
                <TouchableOpacity
                  key={social.label}
                  className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl border border-midnight-border"
                  style={{ backgroundColor: Colors.surface }}
                  activeOpacity={0.8}
                  onPress={() => openLink(social.url)}
                >
                  <social.icon size={18} color={Colors.primaryLight} />
                  <Text className="text-sm font-medium text-ltext">
                    {social.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </LinearGradient>
        </FadeIn>

        <FadeIn delay={400} focusKey={focusKey}>
          <Text className="text-xs text-ltext-muted text-center mt-2">
            Version 1.0.0
          </Text>
        </FadeIn>
      </ScrollView>
    </SafeAreaView>
  );
}
