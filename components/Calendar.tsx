import { useMemo, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Shadows, Gradient } from "../constants/theme";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAYS_FULL = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

function toKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export type CalendarProps = {
  /** Map of "yyyy-mm-dd" → number of quiz attempts that day. */
  markedDays?: Map<string, number>;
  onSelectDate?: (date: Date) => void;
};

export function Calendar({ markedDays, onSelectDate }: CalendarProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<Date>(today);

  const rows = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const leading = (first.getDay() + 6) % 7;
    const trailing = (7 - ((leading + daysInMonth) % 7)) % 7;

    const cells: (Date | null)[] = [];
    for (let i = 0; i < leading; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(new Date(viewYear, viewMonth, day));
    }
    for (let i = 0; i < trailing; i++) cells.push(null);

    const result: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      result.push(cells.slice(i, i + 7));
    }
    return result;
  }, [viewYear, viewMonth]);

  const navigate = (delta: number) => {
    let month = viewMonth + delta;
    let year = viewYear;
    if (month < 0) {
      month = 11;
      year--;
    } else if (month > 11) {
      month = 0;
      year++;
    }
    setViewMonth(month);
    setViewYear(year);
  };

  const handleSelect = (date: Date) => {
    setSelected(date);
    onSelectDate?.(date);
  };

  const selectedCount = markedDays?.get(toKey(selected)) ?? 0;

  return (
    <LinearGradient
      colors={[...Gradient.card]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="rounded-xl p-4 border border-midnight-border overflow-hidden"
      style={Shadows.card}
    >
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-base font-semibold text-ltext">
          {MONTHS[viewMonth]} {viewYear}
        </Text>
        <View className="flex-row gap-1">
          <TouchableOpacity
            onPress={() => navigate(-1)}
            activeOpacity={0.7}
            className="w-8 h-8 rounded-lg bg-midnight-lighter items-center justify-center"
          >
            <ChevronLeft size={16} color={Colors.silverDark} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigate(1)}
            activeOpacity={0.7}
            className="w-8 h-8 rounded-lg bg-midnight-lighter items-center justify-center"
          >
            <ChevronRight size={16} color={Colors.silverDark} />
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-row justify-between mb-2 px-0.5">
        {WEEKDAYS.map((day) => (
          <Text
            key={day}
            className="text-[10px] text-ltext-muted w-[12.5%] text-center"
          >
            {day}
          </Text>
        ))}
      </View>

      <View className="gap-1.5">
        {rows.map((row, rowIdx) => (
          <View key={rowIdx} className="flex-row gap-1.5">
            {row.map((date, colIdx) => {
              if (!date) {
                return <View key={colIdx} className="flex-1 aspect-square" />;
              }

              const isSelected = isSameDay(date, selected);
              const isToday = isSameDay(date, today);
              const count = markedDays?.get(toKey(date)) ?? 0;

              return (
                <TouchableOpacity
                  key={toKey(date)}
                  onPress={() => handleSelect(date)}
                  activeOpacity={0.7}
                  className={`flex-1 aspect-square rounded-lg items-center justify-center ${
                    isSelected
                      ? "bg-lunar"
                      : isToday
                      ? "border border-lunar bg-midnight-lighter"
                      : count > 0
                      ? "bg-midnight-lighter"
                      : ""
                  }`}
                  style={isSelected ? Shadows.glow : undefined}
                >
                  <Text
                    className={`text-sm ${
                      isSelected
                        ? "text-white font-semibold"
                        : isToday
                        ? "text-lunar-light font-semibold"
                        : "text-ltext-secondary"
                    }`}
                  >
                    {date.getDate()}
                  </Text>
                  {count > 0 && (
                    <View
                      className="absolute bottom-1 w-1 h-1 rounded-full"
                      style={{
                        backgroundColor: isSelected
                          ? Colors.silverLight
                          : Colors.primaryLight,
                      }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <View className="mt-4 pt-3 border-t border-midnight-border flex-row justify-between items-center">
        <Text className="text-sm text-ltext-secondary">
          {WEEKDAYS_FULL[selected.getDay()]}, {MONTHS[selected.getMonth()]}{" "}
          {selected.getDate()}
        </Text>
        <Text
          className={`text-xs font-medium ${
            selectedCount > 0 ? "text-lunar-light" : "text-ltext-muted"
          }`}
        >
          {selectedCount > 0
            ? selectedCount === 1
              ? "1 quiz"
              : `${selectedCount} quizzes`
            : "No activity"}
        </Text>
      </View>
    </LinearGradient>
  );
}
