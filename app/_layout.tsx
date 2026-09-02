import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useReviewerStore } from "../store/useReviewerStore";
import { useOnboardingStore } from "../store/useOnboardingStore";
import { ModelReminderGate } from "../components/ModelReminderGate";
import { prewarmInsightIfModelReady } from "../lib/insight";
import "../global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const loadSubjects = useReviewerStore((s) => s.loadSubjects);
  const loadQuizAttempts = useReviewerStore((s) => s.loadQuizAttempts);
  const onboarded = useOnboardingStore((s) => s.onboarded);
  const isReady = useOnboardingStore((s) => s.isReady);
  const loadOnboarding = useOnboardingStore((s) => s.load);

  useEffect(() => {
    loadOnboarding();
  }, [loadOnboarding]);

  useEffect(() => {
    (async () => {
      await loadSubjects();
      await loadQuizAttempts();
      const { subjects, attempts } = useReviewerStore.getState();
      prewarmInsightIfModelReady(subjects, attempts);
    })();
  }, [loadSubjects, loadQuizAttempts]);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isReady]);

  if (!isReady) return null;

  return (
    <GestureHandlerRootView className="flex-1">
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0a0a1a" },
        }}
      >
        <Stack.Protected guard={onboarded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="subjects" />
          <Stack.Screen name="reviewer/[id]" />
          <Stack.Screen name="processing" />
        </Stack.Protected>

        <Stack.Protected guard={!onboarded}>
          <Stack.Screen
            name="onboarding"
            options={{ gestureEnabled: false }}
          />
        </Stack.Protected>
      </Stack>
      <ModelReminderGate />
    </GestureHandlerRootView>
  );
}
