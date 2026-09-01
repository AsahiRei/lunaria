import type { ReviewerData } from "../store/useReviewerStore";

const SYSTEM_PROMPT = `JSON only. No markdown, no explanation, no text outside the JSON object.

{"title":"doc title","subtitle":"chapter/topic","summary":["3-5 key idea sentences"],"formulas":[{"label":"name","formula":"expr"}],"concepts":[{"term":"word","definition":"concise meaning"}],"keywords":[{"term":"technical term","definition":"1-sentence explanation"}]}

Rules:
- summary: 3-5 distinct main ideas from document (fewer is fine, prioritize completing valid JSON)
- formulas: 0-3 labeled formulas (omit array entirely if none)
- concepts: 3-6 key terms with concise definitions
- keywords: up to 8 technical/defined terms
- Keep every string value under 200 characters
- Never use double-quote characters inside a string value; rephrase instead
- Do not use raw newlines inside a string value
- Use exact terminology from source
- Output ONLY the JSON object, ensure valid JSON with matching braces`;

export function buildGenerationPrompt(
  pdfText: string,
  focusTopic?: string,
  pageRange?: string
): string {
  let prompt = `Extract study reviewer from this document:\n\n${pdfText}`;

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
  pageRange?: string
) {
  return [
    { role: "system" as const, content: SYSTEM_PROMPT },
    {
      role: "user" as const,
      content: buildGenerationPrompt(pdfText, focusTopic, pageRange),
    },
  ];
}

export function parseReviewerResponse(
  raw: string
): ReviewerData | null {
  if (!raw || raw.trim().length === 0) return null;

  let cleaned = raw.trim();

  // Try to extract JSON from code fences
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    cleaned = jsonMatch[1].trim();
  }

  // Find first { and last }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  // Try parsing directly first
  let parsed = tryParse(cleaned);

  // If direct parse failed, try fixing common JSON issues
  if (!parsed) {
    // Remove trailing commas before } or ]
    const fixed = cleaned
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/}\s*,?\s*$/, "}");
    parsed = tryParse(fixed);
  }

  // If still failed, try closing truncated JSON
  if (!parsed) {
    const fixed = closeTruncatedJson(cleaned);
    parsed = tryParse(fixed);
  }

  if (!parsed) {
    console.log("[reviewerPrompt] Failed to parse JSON:", cleaned.slice(0, 300));
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = parsed as any;

  const hasTitle = typeof data.title === "string" && data.title.length > 0;
  const hasSummary = Array.isArray(data.summary) && data.summary.length > 0;

  if (!hasTitle && !hasSummary) {
    return null;
  }

  const result: ReviewerData = {
    title: hasTitle ? data.title : "Untitled Document",
    subtitle: (typeof data.subtitle === "string" && data.subtitle) || "Generated Reviewer",
    summary: Array.isArray(data.summary)
      ? data.summary
          .filter((s: unknown) => typeof s === "string" && s.length > 0)
          .slice(0, 10)
      : [],
    formulas: Array.isArray(data.formulas)
      ? data.formulas
          .filter(
            (f: unknown) =>
              typeof f === "object" &&
              f !== null &&
              "label" in f &&
              "formula" in f
          )
          .slice(0, 10)
          .map((f: { label: string; formula: string }) => ({
            label: String(f.label || ""),
            formula: String(f.formula || ""),
          }))
      : [],
    concepts: Array.isArray(data.concepts)
      ? data.concepts
          .filter(
            (c: unknown) =>
              typeof c === "object" &&
              c !== null &&
              "term" in c &&
              "definition" in c
          )
          .slice(0, 15)
          .map((c: { term: string; definition: string }) => ({
            term: String(c.term || ""),
            definition: String(c.definition || ""),
          }))
      : [],
    keywords: Array.isArray(data.keywords)
      ? data.keywords
          .filter(
            (k: unknown) =>
              typeof k === "object" &&
              k !== null &&
              "term" in k &&
              "definition" in k
          )
          .slice(0, 20)
          .map((k: { term: string; definition: string }) => ({
            term: String(k.term || ""),
            definition: String(k.definition || ""),
          }))
      : [],
  };

  return validateReviewerData(result);
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
    const baseSummary = validated.summary.length > 0
      ? validated.summary[0]
      : "Document content analyzed.";
    while (validated.summary.length < 3) {
      validated.summary.push(`${baseSummary} Key points identified.`);
    }
  }

  if (validated.concepts.length < 2 && validated.keywords.length > 0) {
    const keywordToConcept = validated.keywords[0];
    validated.concepts.push({
      term: keywordToConcept.term,
      definition: keywordToConcept.definition,
    });
  }

  validated.summary = validated.summary.map((s) => 
    s.length > 300 ? s.slice(0, 297) + "..." : s
  );

  validated.concepts = validated.concepts.map((c) => ({
    term: c.term.length > 100 ? c.term.slice(0, 97) + "..." : c.term,
    definition: c.definition.length > 300 ? c.definition.slice(0, 297) + "..." : c.definition,
  }));

  validated.keywords = validated.keywords.map((k) => ({
    term: k.term.length > 100 ? k.term.slice(0, 97) + "..." : k.term,
    definition: k.definition.length > 300 ? k.definition.slice(0, 297) + "..." : k.definition,
  }));

  return validated;
}

function closeTruncatedJson(s: string): string {
  // Count open brackets/braces and close them
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escaped = false;

  for (const ch of s) {
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") openBraces++;
    if (ch === "}") openBraces--;
    if (ch === "[") openBrackets++;
    if (ch === "]") openBrackets--;
  }

  // Remove trailing incomplete values (e.g. "key": "partial_val)
  let fixed = s.replace(/,\s*"[^"]*$/, "");
  fixed = fixed.replace(/:\s*"[^"]*$/, ': ""');
  fixed = fixed.replace(/:\s*\{[^}]*$/, "");
  fixed = fixed.replace(/:\s*\[[^\]]*$/, "");

  // Close remaining brackets
  for (let i = 0; i < openBrackets; i++) fixed += "]";
  for (let i = 0; i < openBraces; i++) fixed += "}";

  return fixed;
}