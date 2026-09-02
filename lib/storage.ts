import * as SQLite from "expo-sqlite";
import { deleteCachedReviewerByHash } from "./cache";

export type ReviewerData = {
  title: string;
  subtitle: string;
  summary: string[];
  formulas: { label: string; formula: string }[];
  concepts: { term: string; definition: string }[];
  keywords: { term: string; definition: string }[];
};

export type Subject = {
  id: string;
  title: string;
  subtitle: string;
  mastery: number;
  needsReview: boolean;
};

export type QuizAttempt = {
  id: string;
  subjectId: string;
  score: number;
  total: number;
  percentage: number;
  durationMs: number;
  completedAt: number;
};

type ReviewerRow = {
  id: string;
  title: string;
  subtitle: string;
  mastery: number;
  needsReview: number;
  cacheKey: string | null;
  summary: string;
  formulas: string;
  concepts: string;
  keywords: string;
};

let db: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync("lunaria.db");
  }
  return db;
}

let initPromise: Promise<void> | null = null;

function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const database = getDb();

      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS reviewers (
          id TEXT PRIMARY KEY,
          title TEXT,
          subtitle TEXT,
          mastery INTEGER DEFAULT 0,
          needsReview INTEGER DEFAULT 0,
          cacheKey TEXT,
          summary TEXT,
          formulas TEXT,
          concepts TEXT,
          keywords TEXT
        );
        CREATE TABLE IF NOT EXISTS quiz_attempts (
          id TEXT PRIMARY KEY,
          subjectId TEXT NOT NULL,
          score INTEGER,
          total INTEGER,
          percentage INTEGER,
          durationMs INTEGER DEFAULT 0,
          completedAt INTEGER
        );
      `);

      // Migrate older databases created before these columns existed.
      const columns = await database.getAllAsync<{ name: string }>(
        "PRAGMA table_info(reviewers);"
      );
      const columnNames = columns.map((c) => c.name);

      if (!columnNames.includes("mastery")) {
        await database.execAsync(
          "ALTER TABLE reviewers ADD COLUMN mastery INTEGER DEFAULT 0;"
        );
      }
      if (!columnNames.includes("needsReview")) {
        await database.execAsync(
          "ALTER TABLE reviewers ADD COLUMN needsReview INTEGER DEFAULT 0;"
        );
      }
      if (!columnNames.includes("cacheKey")) {
        await database.execAsync(
          "ALTER TABLE reviewers ADD COLUMN cacheKey TEXT;"
        );
      }
    })();
  }
  return initPromise;
}

export async function saveReviewer(
  subject: Subject,
  reviewer: ReviewerData,
  cacheKey?: string
): Promise<void> {
  await ensureInitialized();
  const database = getDb();

  const summaryJson = JSON.stringify(reviewer.summary);
  const formulasJson = JSON.stringify(reviewer.formulas);
  const conceptsJson = JSON.stringify(reviewer.concepts);
  const keywordsJson = JSON.stringify(reviewer.keywords);

  await database.runAsync(
    `INSERT OR REPLACE INTO reviewers
      (id, title, subtitle, mastery, needsReview, cacheKey, summary, formulas, concepts, keywords)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      subject.id,
      subject.title,
      subject.subtitle,
      subject.mastery,
      subject.needsReview ? 1 : 0,
      cacheKey ?? null,
      summaryJson,
      formulasJson,
      conceptsJson,
      keywordsJson,
    ]
  );
}

export async function getReviewer(id: string): Promise<ReviewerData | undefined> {
  await ensureInitialized();
  const database = getDb();

  const result = await database.getFirstAsync<ReviewerRow | null>(
    "SELECT * FROM reviewers WHERE id = ?",
    [id]
  );

  if (!result) return undefined;

  return {
    title: result.title || "",
    subtitle: result.subtitle || "",
    summary: JSON.parse(result.summary || "[]"),
    formulas: JSON.parse(result.formulas || "[]"),
    concepts: JSON.parse(result.concepts || "[]"),
    keywords: JSON.parse(result.keywords || "[]"),
  };
}

// Lightweight — used to rehydrate the dashboard list on app start.
export async function getAllSubjects(): Promise<Subject[]> {
  await ensureInitialized();
  const database = getDb();

  const results = await database.getAllAsync<ReviewerRow>(
    "SELECT id, title, subtitle, mastery, needsReview FROM reviewers"
  );

  return results.map((row) => ({
    id: row.id,
    title: row.title || "",
    subtitle: row.subtitle || "",
    mastery: row.mastery ?? 0,
    needsReview: !!row.needsReview,
  }));
}

export async function deleteReviewer(id: string): Promise<void> {
  await ensureInitialized();
  const database = getDb();

  // Look up the cache key before deleting the row so we can clean up
  // the matching cache file on disk too.
  const row = await database.getFirstAsync<{ cacheKey: string | null }>(
    "SELECT cacheKey FROM reviewers WHERE id = ?",
    [id]
  );

  await database.runAsync("DELETE FROM reviewers WHERE id = ?", [id]);
  await database.runAsync("DELETE FROM quiz_attempts WHERE subjectId = ?", [id]);

  if (row?.cacheKey) {
    deleteCachedReviewerByHash(row.cacheKey);
  }
}

export async function saveQuizAttempt(attempt: QuizAttempt): Promise<void> {
  await ensureInitialized();
  const database = getDb();

  await database.runAsync(
    `INSERT OR REPLACE INTO quiz_attempts
      (id, subjectId, score, total, percentage, durationMs, completedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      attempt.id,
      attempt.subjectId,
      attempt.score,
      attempt.total,
      attempt.percentage,
      attempt.durationMs,
      attempt.completedAt,
    ]
  );
}

export async function getQuizAttempts(): Promise<QuizAttempt[]> {
  await ensureInitialized();
  const database = getDb();

  return database.getAllAsync<QuizAttempt>(
    "SELECT id, subjectId, score, total, percentage, durationMs, completedAt FROM quiz_attempts ORDER BY completedAt ASC"
  );
}

export async function updateSubjectProgress(
  id: string,
  mastery: number,
  needsReview: boolean
): Promise<void> {
  await ensureInitialized();
  const database = getDb();

  await database.runAsync(
    "UPDATE reviewers SET mastery = ?, needsReview = ? WHERE id = ?",
    [mastery, needsReview ? 1 : 0, id]
  );
}