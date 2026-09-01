import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Shadows } from "../constants/theme";

export function StatCard({
  icon,
  label,
  value,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  variant: "primary" | "secondary";
}) {
  if (variant === "primary") {
    return (
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-xl p-4 flex-1 justify-center overflow-hidden"
        style={Shadows.card}
      >
        <View className="flex-row items-center gap-2 mb-2">
          {icon}
          <Text className="text-xs font-medium text-white">{label}</Text>
        </View>
        <Text className="text-2xl font-bold text-white">{value}</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[Colors.surfaceElevated, Colors.surface]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="rounded-xl p-4 flex-1 justify-center border border-midnight-border overflow-hidden"
      style={Shadows.card}
    >
      <View className="flex-row items-center gap-2 mb-2">
        {icon}
        <Text className="text-xs font-medium text-ltext-secondary">{label}</Text>
      </View>
      <Text className="text-2xl font-bold text-ltext">{value}</Text>
    </LinearGradient>
  );
}
