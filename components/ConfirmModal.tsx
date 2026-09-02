import { View, Text, TouchableOpacity, Modal, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AlertTriangle } from "lucide-react-native";
import { Colors, Shadows, Gradient } from "../constants/theme";

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const accentColor = destructive ? Colors.error : Colors.primary;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: "rgba(5, 5, 15, 0.7)" }}
        onPress={onCancel}
      >
        <Pressable onPress={(e) => e.stopPropagation()} className="w-full max-w-sm">
          <LinearGradient
            colors={[...Gradient.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            className="rounded-xl p-5 border border-midnight-border overflow-hidden"
            style={Shadows.elevated}
          >
            <View className="items-center mb-4">
              <View
                className="w-12 h-12 rounded-full items-center justify-center mb-3"
                style={{
                  backgroundColor: destructive
                    ? "rgba(248, 113, 113, 0.15)"
                    : "rgba(99, 102, 241, 0.15)",
                }}
              >
                <AlertTriangle size={22} color={accentColor} />
              </View>
              <Text className="text-lg font-semibold text-ltext text-center">
                {title}
              </Text>
              <Text className="text-sm text-ltext-secondary text-center mt-2 leading-5">
                {message}
              </Text>
            </View>

            <View className="flex-row gap-3 mt-2">
              <TouchableOpacity
                onPress={onCancel}
                disabled={loading}
                activeOpacity={0.7}
                className="flex-1 py-3 rounded-full border border-midnight-border items-center justify-center bg-midnight-lighter"
                style={{ opacity: loading ? 0.5 : 1 }}
              >
                <Text className="text-sm font-medium text-ltext-secondary">
                  {cancelLabel}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onConfirm}
                disabled={loading}
                activeOpacity={0.8}
                className="flex-1 rounded-full overflow-hidden"
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                <LinearGradient
                  colors={
                    destructive
                      ? ["#f87171", "#b91c1c"]
                      : [Colors.primary, Colors.primaryDark]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="py-3 items-center justify-center"
                >
                  <Text className="text-sm font-semibold text-white">
                    {loading ? "Please wait..." : confirmLabel}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Pressable>
      </Pressable>
    </Modal>
  );
}