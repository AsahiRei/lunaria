import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDED_KEY = "@lunaria/onboarded";

type OnboardingStore = {
  isReady: boolean;
  onboarded: boolean;
  load: () => Promise<void>;
  complete: () => Promise<void>;
};

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  isReady: false,
  onboarded: false,

  load: async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDED_KEY);
      set({ onboarded: value === "true", isReady: true });
    } catch (err) {
      console.error("[onboarding] Failed to read onboarding flag:", err);
      set({ onboarded: false, isReady: true });
    }
  },

  complete: async () => {
    set({ onboarded: true });
    try {
      await AsyncStorage.setItem(ONBOARDED_KEY, "true");
    } catch (err) {
      console.error("[onboarding] Failed to persist onboarding flag:", err);
    }
  },
}));
