import { View, Text, TouchableOpacity, Modal, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { DownloadCloud } from "lucide-react-native";
import { Colors, Shadows, Gradient } from "../constants/theme";

type ModelDownloadModalProps = {
  visible: boolean;
  isDownloading: boolean;
  progress: number;
  onDownload: () => void;
  onCancel: () => void;
};

export function ModelDownloadModal({
  visible,
  isDownloading,
  progress,
  onDownload,
  onCancel,
}: ModelDownloadModalProps) {
  const dismiss = () => {
    if (!isDownloading) onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={dismiss}
      statusBarTranslucent
    >
      <Pressable
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: "rgba(5, 5, 15, 0.7)" }}
        onPress={dismiss}
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
                style={{ backgroundColor: "rgba(99, 102, 241, 0.15)" }}
              >
                <DownloadCloud size={22} color={Colors.primary} />
              </View>
              <Text className="text-lg font-semibold text-ltext text-center">
                {isDownloading ? "Downloading AI Model" : "Enable Offline Mode"}
              </Text>
              <Text className="text-sm text-ltext-secondary text-center mt-2 leading-5">
                {isDownloading
                  ? "Please keep the app open. This is a one-time download stored on your device."
                  : "The AI model isn't downloaded yet. Download it once to generate reviewers 100% offline on your device."}
              </Text>
            </View>

            {isDownloading && (
              <View className="mb-4">
                <View className="w-full h-2 bg-midnight-lighter rounded-full overflow-hidden">
                  <View
                    className="h-full bg-lunar rounded-full"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </View>
                <Text className="text-xs text-lunar-light font-medium text-right mt-2">
                  {Math.round(progress * 100)}%
                </Text>
              </View>
            )}

            <View className="flex-row gap-3 mt-2">
              <TouchableOpacity
                onPress={dismiss}
                disabled={isDownloading}
                activeOpacity={0.7}
                className="flex-1 py-3 rounded-full border border-midnight-border items-center justify-center bg-midnight-lighter"
                style={{ opacity: isDownloading ? 0.5 : 1 }}
              >
                <Text className="text-sm font-medium text-ltext-secondary">
                  Not Now
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onDownload}
                disabled={isDownloading}
                activeOpacity={0.8}
                className="flex-1 rounded-full overflow-hidden"
                style={{ opacity: isDownloading ? 0.6 : 1 }}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="py-3 items-center justify-center"
                >
                  <Text className="text-sm font-semibold text-white">
                    {isDownloading ? "Downloading..." : "Download Model"}
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
