import { create } from "zustand";

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
  reviewers: Record<string, ReviewerData>;
  generationState: GenerationState;
  generationProgress: string;
  error: string | null;

  addSubject: (subject: Subject, reviewer: ReviewerData) => void;
  setGenerationState: (state: GenerationState, progress?: string) => void;
  setError: (error: string | null) => void;
  getReviewer: (id: string) => ReviewerData | undefined;
};

export const useReviewerStore = create<ReviewerStore>((set, get) => ({
  subjects: [],
  reviewers: {},
  generationState: "idle",
  generationProgress: "",
  error: null,

  addSubject: (subject, reviewer) =>
    set((state) => ({
      subjects: [subject, ...state.subjects],
      reviewers: { ...state.reviewers, [subject.id]: reviewer },
    })),

  setGenerationState: (generationState, progress = "") =>
    set({ generationState, generationProgress: progress }),

  setError: (error) => set({ error }),

  getReviewer: (id) => get().reviewers[id],
}));
