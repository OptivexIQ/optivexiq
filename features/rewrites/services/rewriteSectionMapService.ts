import { runChatCompletion } from "@/features/ai/client/openaiClient";
import { logger } from "@/lib/logger";
import {
  extractJsonObject,
  parseJsonStrict,
} from "@/features/ai/streaming/structuredOutputParser";
import { createSupabaseAdminClient } from "@/services/supabase/admin";
import type { RewriteOutputSection } from "@/features/rewrites/services/rewriteOutputViewModel";
import type { RewriteType } from "@/features/rewrites/types/rewrites.types";
import {
  rewriteSectionMapResponseSchema,
  type RewriteSectionMapResponse,
} from "@/features/rewrites/validators/rewriteSectionMapSchema";
import {
  SECTION_LABELS,
  REWRITE_SECTION_CONFIDENCE_THRESHOLD,
  REWRITE_SECTION_PROMPT_VERSION,
  REWRITE_SECTION_TAXONOMY_VERSION,
  buildClassifierPrompt,
  parseDeterministicMappedSections,
} from "@/features/rewrites/services/rewriteSectionParsing";

const SECTION_MAP_PARSER_VERSION = "deterministic-v1";

type SectionMapMetric =
  | "source_deterministic"
  | "source_ai"
  | "low_confidence"
  | "failure";

const sectionMapMetricCounters: Record<SectionMapMetric, number> = {
  source_deterministic: 0,
  source_ai: 0,
  low_confidence: 0,
  failure: 0,
};

function recordSectionMapMetric(
  metric: SectionMapMetric,
  context?: Record<string, unknown>,
) {
  sectionMapMetricCounters[metric] += 1;
  const payload = {
    metric,
    count: sectionMapMetricCounters[metric],
    ...context,
  };
  if (metric === "failure" || metric === "low_confidence") {
    logger.warn("Rewrite section map metric.", payload);
    return;
  }
  logger.info("Rewrite section map metric.", payload);
}

function toSectionsFromMapped(payload: RewriteSectionMapResponse) {
  return payload.sections.map((section) => ({
    title: section.label,
    body: section.content.trim(),
  }));
}

type PersistedMapRow = {
  sections: unknown;
  warnings: unknown;
  source: unknown;
  model: unknown;
};

async function readPersistedSectionMap(params: {
  userId: string;
  requestRef?: string;
}): Promise<RewriteSectionMapResponse | null> {
  if (!params.requestRef) {
    return null;
  }

  const supabase = createSupabaseAdminClient("worker");
  const { data, error } = await supabase
    .from("rewrite_section_maps")
    .select(
      "sections, warnings, source, model, taxonomy_version, prompt_version, parser_version",
    )
    .eq("user_id", params.userId)
    .eq("request_ref", params.requestRef)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const parsed = rewriteSectionMapResponseSchema.safeParse({
    source: (data as PersistedMapRow).source,
    sections: (data as PersistedMapRow).sections,
    warnings: (data as PersistedMapRow).warnings ?? [],
    model: (data as PersistedMapRow).model ?? null,
  });
  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}

async function persistSectionMap(params: {
  userId: string;
  requestRef?: string;
  payload: RewriteSectionMapResponse;
}) {
  if (!params.requestRef) {
    return;
  }

  const supabase = createSupabaseAdminClient("worker");
  const recordWithMetadata = {
    user_id: params.userId,
    request_ref: params.requestRef,
    source: params.payload.source,
    model: params.payload.model,
    sections: params.payload.sections,
    warnings: params.payload.warnings,
    confidence_threshold: REWRITE_SECTION_CONFIDENCE_THRESHOLD,
    taxonomy_version: REWRITE_SECTION_TAXONOMY_VERSION,
    prompt_version: REWRITE_SECTION_PROMPT_VERSION,
    parser_version: SECTION_MAP_PARSER_VERSION,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("rewrite_section_maps")
    .upsert(recordWithMetadata, { onConflict: "user_id,request_ref" });

  if (error) {
    logger.warn("Failed to persist rewrite section map.", {
      error: error.message,
      user_id: params.userId,
      request_ref: params.requestRef,
    });
  }
}

export async function mapOriginalDraftSections(params: {
  userId: string;
  requestRef?: string;
  rewriteType: RewriteType;
  content: string;
}): Promise<{
  ok: true;
  source: "deterministic" | "ai";
  sections: RewriteOutputSection[];
  warnings: string[];
  model: string | null;
} | {
  ok: false;
  error: string;
}> {
  const cached = await readPersistedSectionMap({
    userId: params.userId,
    requestRef: params.requestRef,
  });
  if (cached) {
    recordSectionMapMetric(
      cached.source === "deterministic" ? "source_deterministic" : "source_ai",
      {
        user_id: params.userId,
        request_ref: params.requestRef ?? null,
        cache_hit: true,
      },
    );
    return {
      ok: true,
      source: cached.source,
      sections: toSectionsFromMapped(cached),
      warnings: cached.warnings,
      model: cached.model,
    };
  }

  const deterministicMapped = parseDeterministicMappedSections(params.content);
  const deterministic = deterministicMapped.map((section) => ({
    title: section.label,
    body: section.content.trim(),
  }));
  if (deterministic.length > 0) {
    const payload: RewriteSectionMapResponse = {
      source: "deterministic",
      sections: deterministicMapped,
      warnings: [],
      model: null,
    };
    await persistSectionMap({
      userId: params.userId,
      requestRef: params.requestRef,
      payload,
    });
    recordSectionMapMetric("source_deterministic", {
      user_id: params.userId,
      request_ref: params.requestRef ?? null,
      cache_hit: false,
    });
    return {
      ok: true,
      source: "deterministic",
      sections: deterministic,
      warnings: [],
      model: null,
    };
  }

  const response = await runChatCompletion({
    model: "gpt-4o-mini",
    temperature: 0,
    maxTokens: 900,
    messages: [{ role: "user", content: buildClassifierPrompt(params) }],
  });

  const json = extractJsonObject(response.content);
  const parsedJson = parseJsonStrict<unknown>(json);
  if (!parsedJson.data) {
    recordSectionMapMetric("failure", {
      stage: "parse_json",
      user_id: params.userId,
      request_ref: params.requestRef ?? null,
    });
    return { ok: false, error: "Unable to parse mapped section JSON." };
  }

  const parsed = rewriteSectionMapResponseSchema.safeParse({
    source: "ai",
    sections: (parsedJson.data as { sections?: unknown }).sections ?? [],
    warnings: [],
    model: response.model,
  });
  if (!parsed.success) {
    recordSectionMapMetric("failure", {
      stage: "schema_validation",
      user_id: params.userId,
      request_ref: params.requestRef ?? null,
    });
    return { ok: false, error: "Invalid mapped section schema." };
  }

  const lowConfidenceCount = parsed.data.sections.filter(
    (section) => section.confidence < REWRITE_SECTION_CONFIDENCE_THRESHOLD,
  ).length;
  if (lowConfidenceCount > 0) {
    recordSectionMapMetric("low_confidence", {
      count: lowConfidenceCount,
      total: parsed.data.sections.length,
      user_id: params.userId,
      request_ref: params.requestRef ?? null,
    });
  }

  const filteredSections = parsed.data.sections
    .filter((section) => section.confidence >= REWRITE_SECTION_CONFIDENCE_THRESHOLD)
    .map((section) => ({
      ...section,
      label: SECTION_LABELS[section.key],
    }));

  const payload: RewriteSectionMapResponse = {
    ...parsed.data,
    sections: filteredSections,
  };
  await persistSectionMap({
    userId: params.userId,
    requestRef: params.requestRef,
    payload,
  });
  recordSectionMapMetric("source_ai", {
    user_id: params.userId,
    request_ref: params.requestRef ?? null,
    model: response.model,
    kept_sections: filteredSections.length,
  });

  return {
    ok: true,
    source: "ai",
    sections: toSectionsFromMapped(payload),
    warnings:
      filteredSections.length === 0
        ? [
            "AI could not map labeled sections with confidence >= 0.75. Add explicit section labels to source content for deterministic mapping.",
          ]
        : [],
    model: response.model,
  };
}
