import { useCallback, useRef, useState } from "react";
import { initLlama, releaseAllLlama, type LlamaContext } from "llama.rn";
import { File, Paths } from "expo-file-system";

const MODEL_URL =
  "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q5_k_m.gguf";

const MODEL_FILENAME = "qwen2.5-1.5b-instruct-q5_k_m.gguf";

function getModelFile(): File {
  return new File(Paths.document, MODEL_FILENAME);
}

type LlamaState = {
  context: LlamaContext | null;
  isLoaded: boolean;
  isLoading: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  loadProgress: number;
  modelExists: boolean;
  error: string | null;
};

export function useLlama() {
  const [state, setState] = useState<LlamaState>({
    context: null,
    isLoaded: false,
    isLoading: false,
    isDownloading: false,
    downloadProgress: 0,
    loadProgress: 0,
    modelExists: false,
    error: null,
  });

  const contextRef = useRef<LlamaContext | null>(null);

  const checkModel = useCallback(async () => {
    const file = getModelFile();
    const exists = file.exists;
    setState((s) => ({ ...s, modelExists: exists }));
    return exists;
  }, []);

  const downloadModel = useCallback(async () => {
    const file = getModelFile();
    if (file.exists) {
      setState((s) => ({ ...s, modelExists: true }));
      return file.uri;
    }

    setState((s) => ({
      ...s,
      isDownloading: true,
      downloadProgress: 0,
      error: null,
    }));

    try {
      const destination = new File(Paths.document, MODEL_FILENAME);
      const task = File.createDownloadTask(MODEL_URL, destination, {
        onProgress: ({ bytesWritten, totalBytes }) => {
          const p = totalBytes > 0 ? bytesWritten / totalBytes : 0;
          setState((s) => ({ ...s, downloadProgress: p }));
        },
      });

      await task.downloadAsync();

      setState((s) => ({
        ...s,
        isDownloading: false,
        downloadProgress: 1,
        modelExists: true,
      }));

      return destination.uri;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState((s) => ({
        ...s,
        isDownloading: false,
        downloadProgress: 0,
        error: "Download failed: " + message,
      }));
      throw err;
    }
  }, []);

  const loadModel = useCallback(async () => {
    if (contextRef.current) return contextRef.current;

    const file = getModelFile();
    if (!file.exists) {
      throw new Error("Model file not found. Please download it first.");
    }

    setState((s) => ({ ...s, isLoading: true, error: null }));

    try {
      const ctx = await initLlama(
        {
          model: file.uri,
          use_mlock: false,
          n_ctx: 4096,
          n_gpu_layers: 99,
        },
        (progress) => {
          setState((s) => ({ ...s, loadProgress: progress }));
        },
      );

      contextRef.current = ctx;
      setState((s) => ({
        ...s,
        context: ctx,
        isLoaded: true,
        isLoading: false,
        loadProgress: 1,
        error: null,
      }));

      return ctx;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState((s) => ({
        ...s,
        isLoading: false,
        error: message,
      }));
      throw err;
    }
  }, []);

  const completion = useCallback(
    async (
      params: Parameters<LlamaContext["completion"]>[0],
      onToken?: Parameters<LlamaContext["completion"]>[1],
    ) => {
      const ctx = contextRef.current;
      if (!ctx) throw new Error("Model not loaded");

      return ctx.completion(params, onToken);
    },
    [],
  );

  const release = useCallback(async () => {
    if (contextRef.current) {
      await releaseAllLlama();
      contextRef.current = null;
      setState({
        context: null,
        isLoaded: false,
        isLoading: false,
        isDownloading: false,
        downloadProgress: 0,
        loadProgress: 0,
        modelExists: false,
        error: null,
      });
    }
  }, []);

  return {
    ...state,
    checkModel,
    downloadModel,
    loadModel,
    completion,
    release,
  };
}
