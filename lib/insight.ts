import { ensureModelLoaded, getSharedContext } from "../hooks/useLlama";
import { buildInsightMessages, type InsightStats } from "./insightPrompt";
import type { QuizAttempt, Subject } from "./storage";

let cachedInsight: { signature: string; text: string } | null = null;
let inFlight: { signature: string; promise: Promise<string | null> } | null = null;

export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function computeStreak(attempts: QuizAttempt[]): number {
  const days = new Set(attempts.map((a) => dayKey(new Date(a.completedAt))));
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!days.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function getInsightKey(attempts: QuizAttempt[]): string {
  return attempts.length > 0
    ? `${attempts.length}:${attempts[attempts.length - 1].completedAt}`
    : "";
}

export function buildInsightStats(
  subjects: Subject[],
  attempts: QuizAttempt[]
): InsightStats {
  const totalQuizzes = attempts.length;
  const averageScore =
    totalQuizzes > 0
      ? Math.round(
          attempts.reduce((sum, a) => sum + a.percentage, 0) / totalQuizzes
        )
      : 0;
  const recent = attempts.slice(-5);
  const recentAverageScore =
    recent.length > 0
      ? Math.round(
          recent.reduce((sum, a) => sum + a.percentage, 0) / recent.length
        )
      : 0;
  const ranked = [...subjects].sort((a, b) => b.mastery - a.mastery);
  const bestSubject =
    ranked.length > 0 && ranked[0].mastery > 0 ? ranked[0].title : null;
  const weakestSubject =
    ranked.length > 0 ? ranked[ranked.length - 1].title : null;

  return {
    totalQuizzes,
    averageScore,
    recentAverageScore,
    bestSubject,
    weakestSubject,
    streakDays: computeStreak(attempts),
    activeDays: new Set(
      attempts.map((a) => dayKey(new Date(a.completedAt)))
    ).size,
  };
}

export function getCachedInsight(signature: string): string | null {
  return cachedInsight?.signature === signature ? cachedInsight.text : null;
}

export function ensureInsight(
  signature: string,
  stats: InsightStats
): Promise<string | null> {
  if (cachedInsight?.signature === signature) {
    return Promise.resolve(cachedInsight.text);
  }
  if (inFlight?.signature === signature) {
    return inFlight.promise;
  }

  const promise = (async () => {
    try {
      const ctx = await ensureModelLoaded();
      const result = await ctx.completion({
        messages: buildInsightMessages(stats),
        n_predict: 160,
        temperature: 0.7,
        top_p: 0.9,
        top_k: 45,
        stop: ["</s>", "<|end|>", "<|eot_id|>", "<|end_of_text|>"],
      });
      const content = (result.text || result.content || "").trim();
      if (content) {
        cachedInsight = { signature, text: content };
        return content;
      }
      return null;
    } finally {
      if (inFlight?.signature === signature) {
        inFlight = null;
      }
    }
  })();

  inFlight = { signature, promise };
  promise.then(
    () => {},
    () => {}
  );
  return promise;
}

export function prewarmInsight(
  subjects: Subject[],
  attempts: QuizAttempt[]
): void {
  if (attempts.length === 0) return;
  const signature = getInsightKey(attempts);
  if (cachedInsight?.signature === signature) return;
  ensureInsight(signature, buildInsightStats(subjects, attempts)).catch(
    (err) => console.error("[insight] Background generation failed:", err)
  );
}

export function prewarmInsightIfModelReady(
  subjects: Subject[],
  attempts: QuizAttempt[]
): void {
  if (!getSharedContext()) return;
  prewarmInsight(subjects, attempts);
}
