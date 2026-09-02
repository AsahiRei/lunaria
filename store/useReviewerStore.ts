import { create } from "zustand";
import {
  saveReviewer,
  getReviewer as getReviewerFromDb,
  getAllSubjects,
  deleteReviewer as deleteReviewerFromDb,
  saveQuizAttempt,
  getQuizAttempts,
  updateSubjectProgress,
  type QuizAttempt,
} from "../lib/storage";
import { prewarmInsight } from "../lib/insight";

export type ReviewerSummary = string[];
export type ReviewerFormula = { label: string; formula: string };
export type ReviewerConcept = { term: string; definition: string };
export type ReviewerKeyword = { term: string; definition: string };

export type ReviewerData = {
  title: string;
  subtitle: string;
  summary: ReviewerSummary;
  formulas: ReviewerFormula[];
  concepts: ReviewerConcept[];
  keywords: ReviewerKeyword[];
};

export type Subject = {
  id: string;
  title: string;
  subtitle: string;
  mastery: number;
  needsReview: boolean;
};

export type GenerationState = "idle" | "picking" | "extracting" | "generating" | "done" | "error";

type ReviewerStore = {
  subjects: Subject[];
  attempts: QuizAttempt[];
  isLoaded: boolean;
  generationState: GenerationState;
  generationProgress: string;
  error: string | null;

  loadSubjects: () => Promise<void>;
  loadQuizAttempts: () => Promise<void>;
  addSubject: (subject: Subject, reviewer: ReviewerData, cacheKey?: string) => Promise<void>;
  setGenerationState: (state: GenerationState, progress?: string) => void;
  setError: (error: string | null) => void;
  getReviewer: (id: string) => Promise<ReviewerData | undefined>;
  deleteSubject: (id: string) => Promise<void>;
  recordQuizResult: (subjectId: string, score: number, total: number, durationMs: number) => Promise<void>;
};

export const useReviewerStore = create<ReviewerStore>((set, get) => ({
  subjects: [],
  attempts: [],
  isLoaded: false,
  generationState: "idle",
  generationProgress: "",
  error: null,

  loadSubjects: async () => {
    const subjects = await getAllSubjects();
    set({ subjects, isLoaded: true });
  },

  loadQuizAttempts: async () => {
    const attempts = await getQuizAttempts();
    set({ attempts });
  },

  addSubject: async (subject, reviewer, cacheKey) => {
    await saveReviewer(subject, reviewer, cacheKey);
    set((state) => ({
      subjects: [subject, ...state.subjects.filter((s) => s.id !== subject.id)],
    }));
  },

  setGenerationState: (generationState, progress = "") =>
    set({ generationState, generationProgress: progress }),

  setError: (error) => set({ error }),

  getReviewer: (id: string) => getReviewerFromDb(id),

  deleteSubject: async (id) => {
    await deleteReviewerFromDb(id);
    set((state) => ({
      subjects: state.subjects.filter((s) => s.id !== id),
      attempts: state.attempts.filter((a) => a.subjectId !== id),
    }));
  },

  recordQuizResult: async (subjectId, score, total, durationMs) => {
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    const attempt: QuizAttempt = {
      id: `a${Date.now()}`,
      subjectId,
      score,
      total,
      percentage,
      durationMs,
      completedAt: Date.now(),
    };

    const subject = get().subjects.find((s) => s.id === subjectId);
    const mastery =
      !subject || subject.mastery === 0
        ? percentage
        : Math.round(subject.mastery * 0.6 + percentage * 0.4);
    const needsReview = mastery < 75;

    try {
      await saveQuizAttempt(attempt);
      if (subject) {
        await updateSubjectProgress(subjectId, mastery, needsReview);
      }
    } catch (err) {
      console.error("[store] Failed to record quiz result:", err);
      return;
    }

    set((state) => ({
      attempts: [...state.attempts, attempt],
      subjects: subject
        ? state.subjects.map((s) =>
            s.id === subjectId ? { ...s, mastery, needsReview } : s
          )
        : state.subjects,
    }));

    prewarmInsight(get().subjects, get().attempts);
  },
}));