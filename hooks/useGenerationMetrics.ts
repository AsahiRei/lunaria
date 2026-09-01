import { useState, useCallback } from "react";

type GenerationMetrics = {
  startTime: number | null;
  endTime: number | null;
  tokenCount: number;
  generationTime: number;
  tokensPerSecond: number;
  textLength: number;
  success: boolean;
};

export function useGenerationMetrics() {
  const [metrics, setMetrics] = useState<GenerationMetrics>({
    startTime: null,
    endTime: null,
    tokenCount: 0,
    generationTime: 0,
    tokensPerSecond: 0,
    textLength: 0,
    success: false,
  });

  const startGeneration = useCallback((textLength: number) => {
    setMetrics({
      startTime: Date.now(),
      endTime: null,
      tokenCount: 0,
      generationTime: 0,
      tokensPerSecond: 0,
      textLength,
      success: false,
    });
  }, []);

  const endGeneration = useCallback((tokenCount: number, success: boolean) => {
    setMetrics((prev) => {
      const endTime = Date.now();
      const generationTime = prev.startTime
        ? (endTime - prev.startTime) / 1000
        : 0;
      const tokensPerSecond =
        generationTime > 0 ? tokenCount / generationTime : 0;

      return {
        ...prev,
        endTime,
        tokenCount,
        generationTime,
        tokensPerSecond,
        success,
      };
    });
  }, []);

  const updateTokens = useCallback((count: number) => {
    setMetrics((prev) => ({ ...prev, tokenCount: count }));
  }, []);

  return {
    metrics,
    startGeneration,
    endGeneration,
    updateTokens,
  };
}
