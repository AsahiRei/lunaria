export type InsightStats = {
  totalQuizzes: number;
  averageScore: number;
  recentAverageScore: number;
  bestSubject: string | null;
  weakestSubject: string | null;
  streakDays: number;
  activeDays: number;
};

const INSIGHT_SYSTEM_PROMPT =
  "You are Luna, a warm and encouraging study coach inside an offline study app. " +
  "Based on the student's quiz statistics, write a short assessment of their learning condition " +
  "with one concrete tip. Reply with 2-3 short sentences, maximum 60 words total. " +
  "Plain text only. No lists, no markdown, no emojis.";

export function buildInsightMessages(stats: InsightStats) {
  const lines = [
    `Quizzes taken: ${stats.totalQuizzes}`,
    `Average quiz score: ${stats.averageScore}%`,
    `Average of recent quizzes: ${stats.recentAverageScore}%`,
    stats.bestSubject ? `Strongest subject: ${stats.bestSubject}` : null,
    stats.weakestSubject ? `Subject needing work: ${stats.weakestSubject}` : null,
    `Current study streak: ${stats.streakDays} day(s)`,
    `Days with quiz activity: ${stats.activeDays}`,
  ].filter(Boolean);

  return [
    { role: "system" as const, content: INSIGHT_SYSTEM_PROMPT },
    {
      role: "user" as const,
      content: "Here are my quiz statistics:\n" + lines.join("\n"),
    },
  ];
}
