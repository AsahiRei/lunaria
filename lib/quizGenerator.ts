import type { ReviewerData } from "./storage";

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
};

const OPTIONS_PER_QUESTION = 4;
const MIN_DEFINITION_LENGTH = 10;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      result.push(trimmed);
    }
  }
  return result;
}

function pickDistractors(bank: string[], correct: string): string[] | null {
  if (bank.length < OPTIONS_PER_QUESTION) return null;
  const pool = shuffle(bank.filter((value) => value !== correct));
  if (pool.length < OPTIONS_PER_QUESTION - 1) return null;
  return pool.slice(0, OPTIONS_PER_QUESTION - 1);
}

function buildQuestionPool(data: ReviewerData): QuizQuestion[] {
  const termEntries = dedupe(
    [...data.concepts, ...data.keywords].map((entry) => entry.term)
  );
  const definitionsByTerm = new Map<string, string>();
  for (const entry of [...data.concepts, ...data.keywords]) {
    const term = entry.term.trim();
    const definition = entry.definition.trim();
    if (term && definition && !definitionsByTerm.has(term)) {
      definitionsByTerm.set(term, definition);
    }
  }

  const formulaEntries = dedupe(data.formulas.map((f) => f.formula));
  const labelByFormula = new Map<string, string>();
  for (const f of data.formulas) {
    const formula = f.formula.trim();
    const label = f.label.trim();
    if (formula && label && !labelByFormula.has(formula)) {
      labelByFormula.set(formula, label);
    }
  }

  const allDefinitions = dedupe([...definitionsByTerm.values()]);

  const questions: QuizQuestion[] = [];
  let counter = 0;

  const assemble = (
    question: string,
    correct: string,
    distractors: string[]
  ): QuizQuestion => {
    const options = shuffle([correct, ...distractors]);
    return {
      id: `q${counter++}`,
      question,
      options,
      correctIndex: options.indexOf(correct),
    };
  };

  for (const term of termEntries) {
    const definition = definitionsByTerm.get(term);
    if (!definition) continue;

    const definitionDistractors = pickDistractors(allDefinitions, definition);
    if (definitionDistractors) {
      questions.push(
        assemble(
          `What best describes "${term}"?`,
          definition,
          definitionDistractors
        )
      );
    }

    if (definition.length >= MIN_DEFINITION_LENGTH) {
      const termDistractors = pickDistractors(termEntries, term);
      if (termDistractors) {
        questions.push(
          assemble(
            `Which term is described as: "${definition}"?`,
            term,
            termDistractors
          )
        );
      }
    }
  }

  for (const formula of formulaEntries) {
    const label = labelByFormula.get(formula);
    if (!label) continue;

    const formulaDistractors = pickDistractors(formulaEntries, formula);
    if (formulaDistractors) {
      questions.push(
        assemble(
          `Which formula matches "${label}"?`,
          formula,
          formulaDistractors
        )
      );
    }
  }

  // Keep both directions of a term from appearing back to back.
  return shuffle(questions);
}

export function getMaxQuizItems(data: ReviewerData): number {
  return buildQuestionPool(data).length;
}

export function generateQuiz(
  data: ReviewerData,
  count: number
): QuizQuestion[] {
  return buildQuestionPool(data).slice(0, Math.max(0, Math.floor(count)));
}
