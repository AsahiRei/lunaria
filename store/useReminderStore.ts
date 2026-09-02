import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const REMINDER_ENABLED_KEY = "@lunaria/reminderEnabled";
const REMINDER_HOUR_KEY = "@lunaria/reminderHour";
const REMINDER_MINUTE_KEY = "@lunaria/reminderMinute";

type ReminderStore = {
  isReady: boolean;
  enabled: boolean;
  hour: number;
  minute: number;
  load: () => Promise<void>;
  setReminder: (enabled: boolean, hour: number, minute: number) => Promise<void>;
};

export const useReminderStore = create<ReminderStore>((set) => ({
  isReady: false,
  enabled: false,
  hour: 20,
  minute: 0,

  load: async () => {
    try {
      const [enabledStr, hourStr, minuteStr] = await Promise.all([
        AsyncStorage.getItem(REMINDER_ENABLED_KEY),
        AsyncStorage.getItem(REMINDER_HOUR_KEY),
        AsyncStorage.getItem(REMINDER_MINUTE_KEY),
      ]);
      set({
        enabled: enabledStr === "true",
        hour: hourStr !== null ? parseInt(hourStr, 10) : 20,
        minute: minuteStr !== null ? parseInt(minuteStr, 10) : 0,
        isReady: true,
      });
    } catch (err) {
      console.error("[reminder] Failed to load settings:", err);
      set({ isReady: true });
    }
  },

  setReminder: async (enabled, hour, minute) => {
    set({ enabled, hour, minute });
    try {
      await Promise.all([
        AsyncStorage.setItem(REMINDER_ENABLED_KEY, String(enabled)),
        AsyncStorage.setItem(REMINDER_HOUR_KEY, String(hour)),
        AsyncStorage.setItem(REMINDER_MINUTE_KEY, String(minute)),
      ]);
    } catch (err) {
      console.error("[reminder] Failed to persist settings:", err);
    }
  },
}));
