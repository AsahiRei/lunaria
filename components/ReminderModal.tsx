import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Bell, BellOff, ChevronUp, ChevronDown } from "lucide-react-native";
import { Colors, Shadows, Gradient } from "../constants/theme";
import { useReminderStore } from "../store/useReminderStore";
import {
  requestNotificationPermission,
  scheduleDailyReminder,
  cancelDailyReminder,
} from "../lib/notifications";

type ReminderModalProps = {
  visible: boolean;
  onClose: () => void;
};

function TimeControl({
  value,
  onChange,
  min = 0,
  max = 23,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label: string;
}) {
  const increment = () => onChange(value >= max ? min : value + 1);
  const decrement = () => onChange(value <= min ? max : value - 1);

  return (
    <View className="items-center">
      <TouchableOpacity onPress={increment} activeOpacity={0.6} className="p-1">
        <ChevronUp size={24} color={Colors.silverDark} />
      </TouchableOpacity>
      <View className="w-16 h-16 rounded-xl bg-midnight-lighter border border-midnight-border items-center justify-center my-1">
        <Text className="text-2xl font-bold text-ltext tabular-nums">
          {String(value).padStart(2, "0")}
        </Text>
      </View>
      <TouchableOpacity onPress={decrement} activeOpacity={0.6} className="p-1">
        <ChevronDown size={24} color={Colors.silverDark} />
      </TouchableOpacity>
      <Text className="text-xs text-ltext-muted mt-1">{label}</Text>
    </View>
  );
}

export function ReminderModal({ visible, onClose }: ReminderModalProps) {
  const { enabled, hour, minute, setReminder } = useReminderStore();
  const [localEnabled, setLocalEnabled] = useState(enabled);
  const [localHour, setLocalHour] = useState(hour);
  const [localMinute, setLocalMinute] = useState(minute);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setLocalEnabled(enabled);
      setLocalHour(hour);
      setLocalMinute(minute);
    }
  }, [visible, enabled, hour, minute]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (localEnabled) {
        const granted = await requestNotificationPermission();
        if (!granted) {
          setSaving(false);
          return;
        }
        await scheduleDailyReminder(localHour, localMinute);
      } else {
        await cancelDailyReminder();
      }
      await setReminder(localEnabled, localHour, localMinute);
      onClose();
    } catch (err) {
      console.error("[reminder] Failed to save:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: "rgba(5, 5, 15, 0.7)" }}
        onPress={onClose}
      >
        <Pressable onPress={(e) => e.stopPropagation()} className="w-full max-w-sm">
          <LinearGradient
            colors={[...Gradient.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            className="rounded-xl p-5 border border-midnight-border overflow-hidden"
            style={Shadows.elevated}
          >
            <View className="items-center mb-5">
              <View
                className="w-12 h-12 rounded-full items-center justify-center mb-3"
                style={{
                  backgroundColor: localEnabled
                    ? "rgba(99, 102, 241, 0.15)"
                    : "rgba(136, 152, 168, 0.15)",
                }}
              >
                {localEnabled ? (
                  <Bell size={22} color={Colors.primary} />
                ) : (
                  <BellOff size={22} color={Colors.silverDark} />
                )}
              </View>
              <Text className="text-lg font-semibold text-ltext text-center">
                Study Reminder
              </Text>
              <Text className="text-sm text-ltext-secondary text-center mt-2 leading-5">
                Get a daily notification to remind you to study.
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setLocalEnabled(!localEnabled)}
              activeOpacity={0.7}
              className="flex-row items-center justify-between bg-midnight-lighter rounded-xl px-4 py-3 border border-midnight-border mb-5"
            >
              <Text className="text-sm font-medium text-ltext">
                {localEnabled ? "Reminders on" : "Reminders off"}
              </Text>
              <View
                className="w-11 h-6 rounded-full items-center justify-center"
                style={{
                  backgroundColor: localEnabled ? Colors.primary : Colors.surfaceBorder,
                  justifyContent: localEnabled ? "flex-end" : "flex-start",
                  paddingHorizontal: 2,
                }}
              >
                <View
                  className="w-5 h-5 rounded-full bg-white"
                  style={{
                    marginLeft: localEnabled ? 0 : 2,
                    marginRight: localEnabled ? 2 : 0,
                  }}
                />
              </View>
            </TouchableOpacity>

            {localEnabled && (
              <View className="items-center mb-5">
                <Text className="text-xs text-ltext-muted mb-3 uppercase tracking-wider">
                  Reminder time
                </Text>
                <View className="flex-row items-center gap-2">
                  <TimeControl
                    value={localHour}
                    onChange={setLocalHour}
                    min={0}
                    max={23}
                    label="Hour"
                  />
                  <Text className="text-2xl font-bold text-ltext mt-[-20px]">:</Text>
                  <TimeControl
                    value={localMinute}
                    onChange={setLocalMinute}
                    min={0}
                    max={59}
                    label="Min"
                  />
                </View>
              </View>
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={onClose}
                disabled={saving}
                activeOpacity={0.7}
                className="flex-1 py-3 rounded-full border border-midnight-border items-center justify-center bg-midnight-lighter"
                style={{ opacity: saving ? 0.5 : 1 }}
              >
                <Text className="text-sm font-medium text-ltext-secondary">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
                className="flex-1 rounded-full overflow-hidden"
                style={{ opacity: saving ? 0.6 : 1 }}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="py-3 items-center justify-center"
                >
                  <Text className="text-sm font-semibold text-white">
                    {saving ? "Saving..." : "Save"}
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
