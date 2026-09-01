import { ReactNode, useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";

type StaggerProps = {
  children: ReactNode;
  delay?: number;
  duration?: number;
};

export function FadeIn({
  children,
  delay = 0,
  duration = 400,
}: StaggerProps) {
  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(duration)}>
      {children}
    </Animated.View>
  );
}

export function useFocusKey(): number {
  const [key, setKey] = useState(0);
  useFocusEffect(useCallback(() => {
    setKey((k) => k + 1);
  }, []));
  return key;
}
