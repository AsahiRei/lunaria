import { useCallback, useEffect } from "react";
import { Alert } from "react-native";
import { usePathname } from "expo-router";
import { useLlama } from "../hooks/useLlama";
import { ModelDownloadModal } from "./ModelDownloadModal";
import { useModelModalStore } from "../store/useModelModalStore";

export function ModelReminderGate() {
  const pathname = usePathname();
  const {
    modelExists,
    isLoaded,
    isDownloading,
    downloadProgress,
    checkModel,
    downloadModel,
  } = useLlama();
  const visible = useModelModalStore((s) => s.visible);
  const openModelModal = useModelModalStore((s) => s.openModelModal);
  const closeModelModal = useModelModalStore((s) => s.closeModelModal);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const exists = await checkModel();
      if (!cancelled && !exists) openModelModal();
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, checkModel, openModelModal]);

  useEffect(() => {
    if (visible && (modelExists || isLoaded)) closeModelModal();
  }, [visible, modelExists, isLoaded, closeModelModal]);

  const handleDownload = useCallback(async () => {
    try {
      await downloadModel();
    } catch {
      Alert.alert(
        "Download Failed",
        "Could not download the AI model. Check your connection and try again.",
      );
    }
  }, [downloadModel]);

  return (
    <ModelDownloadModal
      visible={visible}
      isDownloading={isDownloading}
      progress={downloadProgress}
      onDownload={handleDownload}
      onCancel={closeModelModal}
    />
  );
}
