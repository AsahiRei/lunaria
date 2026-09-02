import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  AlertCircle,
  Check,
  ChevronRight,
  ClipboardList,
  Minus,
  Play,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Trophy,
  X,
} from "lucide-react-native";
import { Colors, Shadows, Gradient } from "../constants/theme";
import { FadeIn } from "./Stagger";
import {
  generateQuiz,
  getMaxQuizItems,
  type QuizQuestion,
} from "../lib/quizGenerator";
import type { ReviewerData } from "../lib/storage";
import { useReviewerStore } from "../store/useReviewerStore";

const COUNT_CHIPS = [5, 10, 15, 20];
const LETTERS = ["A", "B", "C", "D"];

type QuizPhase = "setup" | "running" | "results";
type OptionState = "idle" | "correct" | "wrong" | "dimmed";

function optionColors(state: OptionState) {
  switch (state) {
    case "correct":
      return {
        borderColor: Colors.success,
        bg: "rgba(74, 222, 128, 0.12)",
        text: Colors.success,
        letterBg: Colors.success,
        letterText: "#0a0a1a",
      };
    case "wrong":
      return {
        borderColor: Colors.error,
        bg: "rgba(248, 113, 113, 0.12)",
        text: Colors.error,
        letterBg: Colors.error,
        letterText: "#0a0a1a",
      };
    case "dimmed":
      return {
        borderColor: Colors.surfaceBorder,
        bg: "rgba(18, 18, 42, 0.4)",
        text: Colors.textSecondary,
        letterBg: Colors.surfaceElevated,
        letterText: Colors.textSecondary,
      };
    default:
      return {
        borderColor: Colors.surfaceBorder,
        bg: "rgba(26, 26, 62, 0.5)",
        text: Colors.textPrimary,
        letterBg: Colors.primaryMuted,
        letterText: Colors.primaryLight,
      };
  }
}

function scoreMessage(percentage: number): string {
  if (percentage >= 90) return "Outstanding! You've mastered this material.";
  if (percentage >= 75) return "Great job! A little more polish and you're there.";
  if (percentage >= 50) return "Good effort — review the misses and try again.";
  return "Time to hit the reviewer again. You've got this!";
}

type QuizProps = {
  reviewer: ReviewerData;
  subjectId?: string;
};

export function Quiz({ reviewer, subjectId }: QuizProps) {
  const recordQuizResult = useReviewerStore((s) => s.recordQuizResult);
  const maxItems = useMemo(() => getMaxQuizItems(reviewer), [reviewer]);
  const [phase, setPhase] = useState<QuizPhase>("setup");
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const startedAtRef = useRef(0);

  useEffect(() => {
    setCount((c) => Math.max(1, Math.min(c, maxItems)));
  }, [maxItems]);

  const effectiveCount = Math.min(count, maxItems);

  const startQuiz = (items: number) => {
    const size = Math.max(1, Math.min(items, maxItems));
    setQuestions(generateQuiz(reviewer, size));
    setCurrentIndex(0);
    setSelectedIndex(null);
    setAnswers([]);
    startedAtRef.current = Date.now();
    setPhase("running");
  };

  const handleSelect = (index: number) => {
    if (selectedIndex !== null) return;
    const current = questions[currentIndex];
    setSelectedIndex(index);
    setAnswers((prev) => [...prev, index === current.correctIndex]);
  };

  const handleNext = () => {
    if (currentIndex === questions.length - 1) {
      if (subjectId) {
        const score = answers.filter(Boolean).length;
        recordQuizResult(
          subjectId,
          score,
          questions.length,
          Date.now() - startedAtRef.current
        ).catch((err) =>
          console.error("[quiz] Failed to record quiz result:", err)
        );
      }
      setPhase("results");
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedIndex(null);
    }
  };

  if (phase === "setup") {
    if (maxItems === 0) {
      return (
        <View className="items-center py-16 mb-10">
          <View
            className="w-14 h-14 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: "rgba(99, 102, 241, 0.12)" }}
          >
            <AlertCircle size={26} color={Colors.textMuted} />
          </View>
          <Text className="text-base font-semibold text-ltext">
            Not enough content
          </Text>
          <Text className="text-sm text-ltext-secondary text-center mt-2 leading-5 px-4">
            A multiple-choice quiz needs at least 4 distinct terms,
            definitions, or formulas. Add more content to this reviewer to
            generate one.
          </Text>
        </View>
      );
    }

    const chips = COUNT_CHIPS.filter((c) => c <= maxItems);
    if (maxItems > COUNT_CHIPS[COUNT_CHIPS.length - 1]) {
      chips.push(maxItems);
    }

    return (
      <View className="mb-10">
        <LinearGradient
          colors={[...Gradient.card]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="rounded-xl p-5 border border-midnight-border overflow-hidden"
          style={Shadows.card}
        >
          <View className="flex-row items-center gap-2 mb-2">
            <ClipboardList size={18} color={Colors.primary} />
            <Text className="text-base font-semibold text-ltext">
              Quiz Setup
            </Text>
          </View>
          <Text className="text-sm text-ltext-secondary leading-5">
            Test yourself with multiple-choice questions generated from this
            reviewer.
          </Text>
          <Text className="text-xs text-ltext-muted mt-2">
            {maxItems} question{maxItems === 1 ? "" : "s"} available
          </Text>

          <View className="flex-row items-center justify-between mt-5">
            <Text className="text-sm text-ltext-secondary">
              Number of items
            </Text>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                onPress={() => setCount((c) => Math.max(1, c - 1))}
                disabled={effectiveCount <= 1}
                className="w-9 h-9 rounded-full border border-midnight-border bg-midnight-lighter items-center justify-center"
                activeOpacity={0.7}
                style={{ opacity: effectiveCount <= 1 ? 0.4 : 1 }}
              >
                <Minus size={16} color={Colors.silver} />
              </TouchableOpacity>
              <Text className="text-2xl font-bold text-lunar-light w-10 text-center">
                {effectiveCount}
              </Text>
              <TouchableOpacity
                onPress={() => setCount((c) => Math.min(maxItems, c + 1))}
                disabled={effectiveCount >= maxItems}
                className="w-9 h-9 rounded-full border border-midnight-border bg-midnight-lighter items-center justify-center"
                activeOpacity={0.7}
                style={{ opacity: effectiveCount >= maxItems ? 0.4 : 1 }}
              >
                <Plus size={16} color={Colors.silver} />
              </TouchableOpacity>
            </View>
          </View>

          {chips.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mt-4">
              {chips.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCount(c)}
                  className={`px-4 py-2 rounded-full border ${
                    effectiveCount === c
                      ? "border-lunar bg-lunar/10"
                      : "border-midnight-border bg-midnight/40"
                  }`}
                  activeOpacity={0.7}
                >
                  <Text
                    className={`text-xs font-medium ${
                      effectiveCount === c
                        ? "text-lunar-light"
                        : "text-ltext-secondary"
                    }`}
                  >
                    {c === maxItems ? `All (${c})` : `${c} items`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => startQuiz(effectiveCount)}
            className="mt-5 rounded-full overflow-hidden"
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="py-4 items-center justify-center flex-row gap-2"
              style={Shadows.card}
            >
              <Play size={16} color="#ffffff" fill="#ffffff" />
              <Text className="text-white text-sm font-semibold tracking-wide">
                START QUIZ
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  if (phase === "running" && questions.length > 0) {
    const current = questions[currentIndex];
    const answered = selectedIndex !== null;
    const isLast = currentIndex === questions.length - 1;
    const progress =
      ((currentIndex + (answered ? 1 : 0)) / questions.length) * 100;

    return (
      <View className="mb-10">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-xs text-ltext-secondary">
            Question {currentIndex + 1} of {questions.length}
          </Text>
          <TouchableOpacity
            onPress={() => setPhase("setup")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <X size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View className="h-1.5 bg-midnight-lighter rounded-full overflow-hidden mb-5">
          <View
            className="h-full bg-lunar rounded-full"
            style={{ width: `${progress}%` }}
          />
        </View>

        <Text className="text-lg font-semibold text-ltext leading-6 mb-4">
          {current.question}
        </Text>

        <View className="gap-2.5">
          {current.options.map((option, i) => {
            const state: OptionState = !answered
              ? "idle"
              : i === current.correctIndex
                ? "correct"
                : i === selectedIndex
                  ? "wrong"
                  : "dimmed";
            const c = optionColors(state);
            return (
              <TouchableOpacity
                key={i}
                activeOpacity={0.7}
                disabled={answered}
                onPress={() => handleSelect(i)}
                className="flex-row items-center gap-3 rounded-xl border p-3.5"
                style={{ borderColor: c.borderColor, backgroundColor: c.bg }}
              >
                <View
                  className="w-7 h-7 rounded-lg items-center justify-center"
                  style={{ backgroundColor: c.letterBg }}
                >
                  <Text className="text-xs font-bold" style={{ color: c.letterText }}>
                    {LETTERS[i]}
                  </Text>
                </View>
                <Text
                  className="flex-1 text-sm leading-5"
                  style={{ color: c.text }}
                >
                  {option}
                </Text>
                {answered && i === current.correctIndex && (
                  <Check size={16} color={Colors.success} />
                )}
                {answered && i === selectedIndex && i !== current.correctIndex && (
                  <X size={16} color={Colors.error} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {answered && (
          <FadeIn delay={0}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleNext}
              className="mt-6 rounded-full overflow-hidden"
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-3.5 items-center justify-center flex-row gap-2"
                style={Shadows.card}
              >
                <Text className="text-white text-sm font-semibold">
                  {isLast ? "See Results" : "Next Question"}
                </Text>
                <ChevronRight size={16} color="#ffffff" />
              </LinearGradient>
            </TouchableOpacity>
          </FadeIn>
        )}
      </View>
    );
  }

  const total = questions.length;
  const correctCount = answers.filter(Boolean).length;
  const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const missed = questions.filter((_, i) => !answers[i]);

  return (
    <View className="mb-10">
      <LinearGradient
        colors={[...Gradient.card]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="rounded-xl p-5 border border-midnight-border overflow-hidden"
        style={Shadows.card}
      >
        <View className="items-center py-2">
          <Trophy
            size={36}
            color={percentage >= 75 ? Colors.warning : Colors.primaryLight}
          />
          <Text className="text-4xl font-bold text-ltext mt-3">
            {correctCount} / {total}
          </Text>
          <Text className="text-sm font-semibold text-lunar-light mt-1">
            {percentage}%
          </Text>
          <Text className="text-sm text-ltext-secondary text-center mt-2 leading-5 px-2">
            {scoreMessage(percentage)}
          </Text>
        </View>
      </LinearGradient>

      {missed.length > 0 && (
        <View className="mt-4">
          <Text className="text-sm font-semibold text-ltext mb-2">
            Review your misses ({missed.length})
          </Text>
          {missed.map((q) => (
            <View
              key={q.id}
              className="rounded-xl border border-midnight-border bg-midnight-light/50 p-3.5 mb-2"
            >
              <Text className="text-sm text-ltext font-medium leading-5">
                {q.question}
              </Text>
              <View className="flex-row items-start gap-1.5 mt-2">
                <Check size={14} color={Colors.success} style={{ marginTop: 2 }} />
                <Text
                  className="flex-1 text-xs leading-4"
                  style={{ color: Colors.success }}
                >
                  {q.options[q.correctIndex]}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View className="flex-row gap-3 mt-4">
        <TouchableOpacity
          onPress={() => setPhase("setup")}
          className="flex-1 py-3.5 rounded-full border border-midnight-border bg-midnight-lighter items-center justify-center flex-row gap-2"
          activeOpacity={0.7}
        >
          <SlidersHorizontal size={16} color={Colors.silver} />
          <Text className="text-sm font-medium text-ltext-secondary">
            New Quiz
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => startQuiz(effectiveCount)}
          className="flex-1 rounded-full overflow-hidden"
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="py-3.5 items-center justify-center flex-row gap-2"
          >
            <RotateCcw size={16} color="#ffffff" />
            <Text className="text-sm font-semibold text-white">Retake</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}
