import * as DocumentPicker from "expo-document-picker";
import { extractText, isAvailable } from "expo-pdf-text-extract";

export type PickedPdf = {
  uri: string;
  name: string;
  size: number;
};

export async function pickPdf(): Promise<PickedPdf | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/pdf",
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, name: asset.name, size: asset.size ?? 0 };
}

export async function extractTextFromPdf(uri: string): Promise<string> {
  console.log("[pdfExtractor] Starting extraction for:", uri);

  if (!isAvailable()) {
    throw new Error("PDF extraction not available. Use a development build.");
  }

  const text = await extractText(uri);
  console.log("[pdfExtractor] Extracted", text.length, "chars total");
  return text;
}

const CHUNK_TOKEN_BUDGET = 900;
const MAX_REVIEW_CHUNKS = 4;

function charsForTokens(tokens: number): number {
  return tokens * 4;
}

/** Split a long document into evenly spaced sections the 1.5B model can finish. */
export function chunkDocument(
  text: string,
  maxTokensPerChunk: number = CHUNK_TOKEN_BUDGET,
  maxChunks: number = MAX_REVIEW_CHUNKS
): string[] {
  const cleaned = text.replace(/\r/g, "").trim();
  if (!cleaned) return [];

  const chunkChars = charsForTokens(maxTokensPerChunk);
  if (cleaned.length <= chunkChars) {
    return [cleaned];
  }

  const parts = cleaned.split(/\n+/).filter((line) => line.trim().length > 0);
  const sequential: string[] = [];
  let current = "";

  for (const part of parts) {
    if (part.length > chunkChars) {
      if (current.trim()) {
        sequential.push(current.trim());
        current = "";
      }
      for (let i = 0; i < part.length; i += chunkChars) {
        sequential.push(part.slice(i, i + chunkChars).trim());
      }
      continue;
    }

    const next = current ? `${current}\n${part}` : part;
    if (next.length > chunkChars && current.length > 0) {
      sequential.push(current.trim());
      current = part;
    } else {
      current = next;
    }
  }
  if (current.trim()) sequential.push(current.trim());

  if (sequential.length <= maxChunks) return sequential;

  const sampled: string[] = [];
  const seen = new Set<number>();
  for (let i = 0; i < maxChunks; i++) {
    const idx = Math.round((i * (sequential.length - 1)) / (maxChunks - 1));
    if (seen.has(idx)) continue;
    seen.add(idx);
    sampled.push(sequential[idx]);
  }
  return sampled;
}

export function smartExtract(text: string, maxTokens: number = 2500): string {
  const approxChars = maxTokens * 4;
  if (text.length <= approxChars) return text;

  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const scored = lines.map((line) => ({
    text: line,
    score: scoreLine(line),
  }));

  scored.sort((a, b) => b.score - a.score);

  let result = "";
  let charCount = 0;

  const topLines = scored.slice(0, Math.floor(scored.length * 0.6));
  topLines.sort((a, b) => {
    const aIdx = lines.indexOf(a.text);
    const bIdx = lines.indexOf(b.text);
    return aIdx - bIdx;
  });

  for (const item of topLines) {
    if (charCount + item.text.length > approxChars) break;
    result += item.text + "\n";
    charCount += item.text.length + 1;
  }

  if (charCount < approxChars * 0.5) {
    const remaining = text.slice(0, approxChars - charCount);
    result += "\n" + remaining;
  }

  return result.trim() + "\n\n[...smart extracted...]";
}

function scoreLine(line: string): number {
  let score = 0;

  if (/^[A-Z][A-Za-z0-9\s:.-]{5,60}$/.test(line.trim())) {
    score += 5;
  }

  if (
    /\b(defin|refers?|means?|is a|is the|concept|term|formula)\b/i.test(line)
  ) {
    score += 4;
  }

  if (/\b(equation|formula|theorem|principle|law|rule)\b/i.test(line)) {
    score += 4;
  }

  if (/\b(example|for instance|such as|e\.g\.|i\.e\.)\b/i.test(line)) {
    score += 2;
  }

  if (
    /\b(important|key|essential|crucial|fundamental|basic|main)\b/i.test(line)
  ) {
    score += 2;
  }

  if (/[A-Z][a-z]+[A-Z][a-z]+/.test(line)) {
    score += 1;
  }

  if (
    /\b(^[A-Z][a-z]+)\s+(is|are|was|were|has|have|can|will|shall)\b/.test(line)
  ) {
    score += 3;
  }

  if (line.length > 50 && line.length < 200) {
    score += 1;
  }

  return score;
}

export function truncateText(text: string, maxTokens: number = 3000): string {
  const approxChars = maxTokens * 4;
  if (text.length <= approxChars) return text;
  return text.slice(0, approxChars) + "\n\n[...truncated...]";
}
