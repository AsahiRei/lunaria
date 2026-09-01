import { View, Text, TouchableOpacity } from "react-native";
import { FileText } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Shadows, Gradient } from "../constants/theme";

export type Subject = {
  id: string;
  title: string;
  subtitle: string;
  mastery: number;
  needsReview: boolean;
};

export function SubjectCard({
  subject,
  onPress,
}: {
  subject: Subject;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
    <LinearGradient
      colors={[...Gradient.card]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className={`rounded-xl p-4 border overflow-hidden ${
        subject.needsReview ? "border-rose-dark" : "border-midnight-border"
      }`}
      style={Shadows.card}
    >
      {subject.needsReview && (
        <View className="absolute top-0 right-0 bg-rose-dark rounded-bl-lg px-3 py-1">
          <Text className="text-white text-xs font-medium">Needs review</Text>
        </View>
      )}

      <View className="flex-row items-start gap-3 pt-1">
        <View className="w-10 h-10 rounded-lg bg-midnight-lighter items-center justify-center shrink-0">
          <FileText size={20} color={Colors.silverDark} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-ltext leading-tight mb-1">
            {subject.title}
          </Text>
          <Text className="text-sm text-ltext-secondary">{subject.subtitle}</Text>
        </View>
      </View>

      <View className="mt-4 pt-3 border-t border-midnight-border">
        <View className="flex-row justify-between mb-2">
          <Text className="text-xs text-ltext-secondary font-medium tracking-wider uppercase">
            Mastery
          </Text>
          <Text className="text-xs font-semibold text-lunar-light">
            {subject.mastery}%
          </Text>
        </View>
        <View className="w-full h-1.5 bg-midnight-lighter rounded-full overflow-hidden">
          <LinearGradient
            colors={[Colors.primary, Colors.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="h-full rounded-full"
            style={{ width: `${subject.mastery}%` }}
          />
        </View>
      </View>
    </LinearGradient>
    </TouchableOpacity>
  );
}
