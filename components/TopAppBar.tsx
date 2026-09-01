import { Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Gradient } from "../constants/theme";

export function TopAppBar({ title = "Lunaria" }: { title?: string }) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[...Gradient.header]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="px-5"
      style={{ paddingTop: insets.top, height: 36 + insets.top }}
    >
      <Text className="text-xl font-semibold text-ltext">{title}</Text>
    </LinearGradient>
  );
}
