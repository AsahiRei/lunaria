import type { ReviewerData } from "../store/useReviewerStore";

export const REVIEWER_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "subtitle", "concepts", "keywords", "formulas", "summary"],
  properties: {
    title: { type: "string" },
    subtitle: { type: "string" },
    concepts: {
      type: "array",
      minItems: 4,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["term", "definition"],
        properties: {
          term: { type: "string" },
          definition: { type: "string" },
        },
      },
    },
    keywords: {
      type: "array",
      minItems: 4,
      maxItems: 10,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["term", "definition"],
        properties: {
          term: { type: "string" },
          definition: { type: "string" },
        },
      },
    },
    formulas: {
      type: "array",
      minItems: 0,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "formula"],
        properties: {
          label: { type: "string" },
          formula: { type: "string" },
        },
      },
    },
    summary: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: { type: "string" },
    },
  },
} as const;

const SYSTEM_PROMPT = `JSON only. No markdown, no explanation, no text outside the JSON object.

{"title":"doc title","subtitle":"chapter/topic","concepts":[{"term":"word","definition":"concise meaning"}],"keywords":[{"term":"technical term","definition":"1-sentence explanation"}],"formulas":[{"label":"name","formula":"expr"}],"summary":["3-5 key idea sentences"]}

Rules:
- Fill concepts FIRST (4-8 distinct key terms with concise definitions). Required. Prefer more items when the section is dense.
- keywords: 4-10 technical/defined terms not already listed as concepts. Required.
- formulas: 0-5 labeled formulas (empty array if none)
- summary: 3-6 distinct main ideas from THIS section only
- Keep every string value under 200 characters
- Never use double-quote characters inside a string value; rephrase instead
- Do not use raw newlines inside a string value
- Use exact terminology from source
- Output ONLY the JSON object, ensure valid JSON with matching braces`;

export function buildGenerationPrompt(
  pdfText: string,
  focusTopic?: string,
  pageRange?: string,
  sectionHint?: string
): string {
  let prompt = `Extract a dense study reviewer from this document section. Cover as many distinct terms, definitions, and ideas as the text actually contains. Do not stop after a short summary.`;
  if (sectionHint) {
    prompt += ` ${sectionHint}`;
  }
  prompt += `\n\n${pdfText}`;

  if (focusTopic) {
    prompt += `\n\nFocus: ${focusTopic}`;
  }

  if (pageRange && pageRange !== "all") {
    prompt += `\nPages: ${pageRange}`;
  }

  return prompt;
}

export function buildMessages(
  pdfText: string,
  focusTopic?: string,
  pageRange?: string,
  sectionHint?: string
) {
  return [
    { role: "system" as const, content: SYSTEM_PROMPT },
    {
      role: "user" as const,
      content: buildGenerationPrompt(pdfText, focusTopic, pageRange, sectionHint),
    },
  ];
}

function parseTermList(value: unknown): { term: string; definition: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item: unknown) =>
        typeof item === "object" &&
        item !== null &&
        "term" in item &&
        "definition" in item
    )
    .map((item: { term: string; definition: string }) => ({
      term: String(item.term || "").trim(),
      definition: String(item.definition || "").trim(),
    }))
    .filter((item) => item.term.length > 0 && item.definition.length > 0);
}

function extractTermPairs(raw: string): { term: string; definition: string }[] {
  const pairs: { term: string; definition: string }[] = [];
  const re =
    /"term"\s*:\s*"((?:\\.|[^"\\])*)"\s*,\s*"definition"\s*:\s*"((?:\\.|[^"\\])*)"/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(raw)) !== null) {
    const term = unescapeJsonString(match[1]).trim();
    const definition = unescapeJsonString(match[2]).trim();
    if (term && definition) {
      pairs.push({ term, definition });
    }
  }
  return pairs;
}

function unescapeJsonString(value: string): string {
  return value
    .replace(/\\n/g, " ")
    .replace(/\\"/g, "'")
    .replace(/\\\\/g, "\\");
}

export function parseReviewerResponse(raw: string): ReviewerData | null {
  if (!raw || raw.trim().length === 0) return null;

  let cleaned = raw.trim();

  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    cleaned = jsonMatch[1].trim();
  }

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  let parsed = tryParse(cleaned);

  if (!parsed) {
    const fixed = cleaned
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/}\s*,?\s*$/, "}");
    parsed = tryParse(fixed);
  }

  if (!parsed) {
    parsed = tryParse(closeTruncatedJson(cleaned));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (parsed ?? {}) as any;
  const salvagedTerms = extractTermPairs(raw);

  const hasTitle = typeof data.title === "string" && data.title.length > 0;
  const summary = Array.isArray(data.summary)
    ? data.summary
        .filter((s: unknown) => typeof s === "string" && s.length > 0)
        .slice(0, 12)
    : [];

  let concepts = parseTermList(data.concepts).slice(0, 24);
  let keywords = parseTermList(data.keywords).slice(0, 32);

  if (concepts.length === 0 && keywords.length === 0 && salvagedTerms.length > 0) {
    concepts = salvagedTerms.slice(0, 16);
    keywords = salvagedTerms.slice(0, 16);
  }

  if (concepts.length === 0 && keywords.length > 0) {
    concepts = keywords.slice(0, 12);
  }
  if (keywords.length === 0 && concepts.length > 0) {
    keywords = concepts.slice(0, 12);
  }

  if (!hasTitle && summary.length === 0 && concepts.length === 0) {
    return null;
  }

  if (concepts.length < 2 && keywords.length < 2) {
    console.log("[reviewerPrompt] Rejected summary-only response");
    return null;
  }

  const result: ReviewerData = {
    title: hasTitle ? data.title : "Untitled Document",
    subtitle:
      (typeof data.subtitle === "string" && data.subtitle) || "Generated Reviewer",
    summary,
    formulas: Array.isArray(data.formulas)
      ? data.formulas
          .filter(
            (f: unknown) =>
              typeof f === "object" &&
              f !== null &&
              "label" in f &&
              "formula" in f
          )
          .slice(0, 16)
          .map((f: { label: string; formula: string }) => ({
            label: String(f.label || ""),
            formula: String(f.formula || ""),
          }))
      : [],
    concepts,
    keywords,
  };

  return validateReviewerData(result);
}

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function mergeTerms(
  lists: { term: string; definition: string }[][],
  max: number
): { term: string; definition: string }[] {
  const seen = new Set<string>();
  const merged: { term: string; definition: string }[] = [];
  for (const item of lists.flat()) {
    const key = normalizeKey(item.term);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
    if (merged.length >= max) break;
  }
  return merged;
}

export function mergeReviewers(parts: ReviewerData[]): ReviewerData | null {
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0];

  const seenSummary = new Set<string>();
  const summary: string[] = [];
  for (const line of parts.flatMap((part) => part.summary)) {
    if (line.includes("Key points identified.")) continue;
    const key = normalizeKey(line);
    if (!key || seenSummary.has(key)) continue;
    seenSummary.add(key);
    summary.push(line);
    if (summary.length >= 12) break;
  }

  const seenFormulas = new Set<string>();
  const formulas: ReviewerData["formulas"] = [];
  for (const formula of parts.flatMap((part) => part.formulas)) {
    const key = normalizeKey(`${formula.label} ${formula.formula}`);
    if (!key || seenFormulas.has(key)) continue;
    seenFormulas.add(key);
    formulas.push(formula);
    if (formulas.length >= 12) break;
  }

  return validateReviewerData({
    title: parts[0].title,
    subtitle: parts[0].subtitle,
    summary,
    formulas,
    concepts: mergeTerms(
      parts.map((part) => part.concepts),
      28
    ),
    keywords: mergeTerms(
      parts.map((part) => part.keywords),
      28
    ),
  });
}

function tryParse(s: string): Record<string, unknown> | null {
  try {
    const result = JSON.parse(s);
    if (typeof result === "object" && result !== null) return result;
    return null;
  } catch {
    return null;
  }
}

function validateReviewerData(data: ReviewerData): ReviewerData {
  const validated = { ...data };

  if (validated.summary.length < 3) {
    const baseSummary =
      validated.summary.length > 0
        ? validated.summary[0]
        : validated.concepts[0]?.definition || "Document content analyzed.";
    while (validated.summary.length < 3) {
      validated.summary.push(`${baseSummary} Key points identified.`);
    }
  }

  if (validated.concepts.length < 2 && validated.keywords.length > 0) {
    validated.concepts = validated.keywords.slice(0, 12);
  }

  validated.summary = validated.summary.map((s) =>
    s.length > 300 ? s.slice(0, 297) + "..." : s
  );

  validated.concepts = validated.concepts.map((c) => ({
    term: c.term.length > 100 ? c.term.slice(0, 97) + "..." : c.term,
    definition:
      c.definition.length > 300
        ? c.definition.slice(0, 297) + "..."
        : c.definition,
  }));

  validated.keywords = validated.keywords.map((k) => ({
    term: k.term.length > 100 ? k.term.slice(0, 97) + "..." : k.term,
    definition:
      k.definition.length > 300
        ? k.definition.slice(0, 297) + "..."
        : k.definition,
  }));

  return validated;
}

function closeTruncatedJson(s: string): string {
  let fixed = s.replace(/,\s*"[^"]*$/, "");
  fixed = fixed.replace(/:\s*"[^"]*$/, ': ""');
  fixed = fixed.replace(/:\s*\{[^}]*$/, ": {}");
  fixed = fixed.replace(/:\s*\[[^\]]*$/, ": []");

  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escaped = false;

  for (const ch of fixed) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") openBraces++;
    if (ch === "}") openBraces--;
    if (ch === "[") openBrackets++;
    if (ch === "]") openBrackets--;
  }

  for (let i = 0; i < openBrackets; i++) fixed += "]";
  for (let i = 0; i < openBraces; i++) fixed += "}";

  return fixed;
}
