import { useState } from "react";
import { TouchableOpacity, View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Shadows, Gradient } from "../constants/theme";

type FlashCardProps = {
  frontLabel: string;
  frontValue: string;
  backLabel: string;
  backValue: string;
  accentColor?: string;
};

export function FlashCard({
  frontLabel,
  frontValue,
  backLabel,
  backValue,
  accentColor = "#818cf8",
}: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);
  const progress = useSharedValue(0);

  const toggle = () => {
    const to = flipped ? 0 : 1;
    progress.value = withTiming(to, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });
    setFlipped(!flipped);
  };

  const frontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(progress.value, [0, 1], [0, 180]);
    const opacity = interpolate(progress.value, [0, 0.5, 1], [1, 0, 0]);
    return {
      transform: [{ perspective: 800 }, { rotateY: `${rotateY}deg` }],
      opacity,
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(progress.value, [0, 1], [-180, 0]);
    const opacity = interpolate(progress.value, [0, 0.5, 1], [0, 0, 1]);
    return {
      transform: [{ perspective: 800 }, { rotateY: `${rotateY}deg` }],
      opacity,
    };
  });

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={toggle}>
      <View className="h-40">
        {/* Front */}
        <Animated.View style={[frontStyle, { position: "absolute", width: "100%", height: "100%" }]}>
          <LinearGradient
            colors={[...Gradient.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            className="flex-1 rounded-xl p-4 border border-midnight-border items-center justify-center"
            style={Shadows.card}
          >
            <Text className="text-xs text-ltext-secondary mb-2">{frontLabel}</Text>
            <Text
              className="text-lg font-bold text-center leading-6"
              style={{ color: accentColor }}
            >
              {frontValue}
            </Text>
            <Text className="text-[10px] text-ltext-secondary mt-3 opacity-50">Tap to flip</Text>
          </LinearGradient>
        </Animated.View>

        {/* Back */}
        <Animated.View style={[backStyle, { position: "absolute", width: "100%", height: "100%" }]}>
          <LinearGradient
            colors={["#1a1040", "#151530"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            className="flex-1 rounded-xl p-4 border border-midnight-border items-center justify-center"
            style={Shadows.glow}
          >
            <Text className="text-xs text-ltext-secondary mb-2">{backLabel}</Text>
            <Text className="text-sm text-ltext leading-5 text-center px-2">
              {backValue}
            </Text>
            <Text className="text-[10px] text-ltext-secondary mt-3 opacity-50">Tap to flip</Text>
          </LinearGradient>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}
