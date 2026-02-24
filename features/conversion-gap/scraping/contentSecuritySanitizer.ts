import { logger } from "@/lib/logger";
import { normalizeText, truncateText } from "@/features/conversion-gap/scraping/normalization";

const SUSPICIOUS_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  {
    name: "ignore_previous_instructions",
    regex: /\b(ignore|disregard|forget)\b[\s\S]{0,80}\b(previous|earlier|above)\b[\s\S]{0,80}\b(instruction|prompt|directive)s?\b/gi,
  },
  {
    name: "system_prompt_reference",
    regex: /\b(system prompt|developer message|hidden instruction|jailbreak)\b/gi,
  },
  {
    name: "model_identity_override",
    regex: /\b(you are chatgpt|you are an ai assistant|act as|roleplay as)\b/gi,
  },
  {
    name: "tool_protocol_tokens",
    regex: /<\|im_start\|>|<\|im_end\|>|BEGIN[_\s-]PROMPT|END[_\s-]PROMPT/gi,
  },
  {
    name: "credential_exfiltration_prompt",
    regex: /\b(api key|secret|password|token)\b[\s\S]{0,60}\b(reveal|print|output|expose|leak)\b/gi,
  },
];

function sanitizeLine(line: string): { value: string; removed: boolean } {
  const compact = normalizeText(line);
  if (compact.length === 0) {
    return { value: "", removed: false };
  }

  for (const pattern of SUSPICIOUS_PATTERNS) {
    pattern.regex.lastIndex = 0;
    if (pattern.regex.test(compact)) {
      return { value: "", removed: true };
    }
  }

  return { value: compact, removed: false };
}

function detectPatternHits(value: string): string[] {
  const hits: string[] = [];
  for (const pattern of SUSPICIOUS_PATTERNS) {
    pattern.regex.lastIndex = 0;
    if (pattern.regex.test(value)) {
      hits.push(pattern.name);
    }
  }
  return hits;
}

export function sanitizeScrapedText(input: {
  value: string;
  sourceUrl: string;
  field: string;
  maxLength: number;
}): string {
  const raw = input.value ?? "";
  if (raw.trim().length === 0) {
    return "";
  }

  const originalHits = detectPatternHits(raw);
  const lines = raw.split(/\r?\n/);
  const sanitizedLines: string[] = [];
  let removedLineCount = 0;

  for (const line of lines) {
    const result = sanitizeLine(line);
    if (result.removed) {
      removedLineCount += 1;
      continue;
    }
    if (result.value.length > 0) {
      sanitizedLines.push(result.value);
    }
  }

  const normalized = normalizeText(sanitizedLines.join(" "));
  const truncated = truncateText(normalized, input.maxLength);

  if (originalHits.length > 0 || removedLineCount > 0) {
    logger.warn("scraped_content_sanitizer_anomaly_detected", {
      source_url: input.sourceUrl,
      field: input.field,
      removed_line_count: removedLineCount,
      original_pattern_hits: originalHits,
      raw_length: raw.length,
      sanitized_length: truncated.length,
    });
  }

  return truncated;
}
