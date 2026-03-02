import { createSupabaseServerReadOnlyClient } from "@/services/supabase/server";
import type { RewriteGenerateRequest } from "@/features/rewrites/types/rewrites.types";

export type RewriteHistoryRecord = {
  id: string;
  requestRef: string;
  experimentGroupId: string | null;
  parentRequestRef: string | null;
  versionNumber: number;
  isWinner: boolean;
  winnerLabel: string | null;
  winnerMarkedAt: string | null;
  idempotencyKey: string;
  strategyContext: {
    target: RewriteGenerateRequest["rewriteType"];
    goal: "conversion" | "clarity" | "differentiation";
    icp: string;
    tone: string;
    length: string;
    emphasis: string[];
    constraints: string;
    audience: string;
    focus: {
      differentiation: boolean;
      objection: boolean;
    };
    schemaVersion: number;
  };
  rewriteType: RewriteGenerateRequest["rewriteType"];
  websiteUrl: string | null;
  notes: string | null;
  sourceContent: string | null;
  outputMarkdown: string;
  createdAt: string;
};

type RewriteHistoryRow = {
  id: string;
  request_ref: string;
  experiment_group_id: string | null;
  parent_request_ref: string | null;
  version_number: number;
  is_winner: boolean;
  winner_label: string | null;
  winner_marked_at: string | null;
  idempotency_key: string;
  strategy_context: unknown;
  rewrite_type: RewriteGenerateRequest["rewriteType"];
  website_url: string | null;
  notes: string | null;
  source_content: string | null;
  output_markdown: string;
  created_at: string;
};

function mapHistoryRow(row: RewriteHistoryRow): RewriteHistoryRecord {
  const strategy =
    row.strategy_context && typeof row.strategy_context === "object"
      ? (row.strategy_context as {
          target?: unknown;
          goal?: unknown;
          icp?: unknown;
          tone?: unknown;
          length?: unknown;
          emphasis?: unknown;
          constraints?: unknown;
          audience?: unknown;
          focus?: { differentiation?: unknown; objection?: unknown };
          schema_version?: unknown;
        })
      : {};

  return {
    id: row.id,
    requestRef: row.request_ref,
    experimentGroupId: row.experiment_group_id,
    parentRequestRef: row.parent_request_ref,
    versionNumber: row.version_number,
    isWinner: row.is_winner,
    winnerLabel: row.winner_label,
    winnerMarkedAt: row.winner_marked_at,
    idempotencyKey: row.idempotency_key,
    strategyContext: {
      target:
        strategy.target === "pricing" || strategy.target === "homepage"
          ? strategy.target
          : row.rewrite_type,
      goal:
        strategy.goal === "clarity" || strategy.goal === "differentiation"
          ? strategy.goal
          : "conversion",
      icp: typeof strategy.icp === "string" ? strategy.icp : "",
      tone: typeof strategy.tone === "string" ? strategy.tone : "neutral",
      length: typeof strategy.length === "string" ? strategy.length : "standard",
      emphasis: Array.isArray(strategy.emphasis)
        ? strategy.emphasis.filter((item): item is string => typeof item === "string")
        : [],
      constraints:
        typeof strategy.constraints === "string" ? strategy.constraints : "",
      audience: typeof strategy.audience === "string" ? strategy.audience : "",
      focus: {
        differentiation:
          typeof strategy.focus?.differentiation === "boolean"
            ? strategy.focus.differentiation
            : true,
        objection:
          typeof strategy.focus?.objection === "boolean"
            ? strategy.focus.objection
            : false,
      },
      schemaVersion:
        typeof strategy.schema_version === "number"
          ? strategy.schema_version
          : 1,
    },
    rewriteType: row.rewrite_type,
    websiteUrl: row.website_url,
    notes: row.notes,
    sourceContent: row.source_content,
    outputMarkdown: row.output_markdown,
    createdAt: row.created_at,
  };
}

export async function listRewriteHistoryForUser(
  userId: string,
  limit = 50,
): Promise<RewriteHistoryRecord[]> {
  const supabase = await createSupabaseServerReadOnlyClient();
  const { data, error } = await supabase
    .from("rewrite_generations")
    .select(
      "id, request_ref, experiment_group_id, parent_request_ref, version_number, is_winner, winner_label, winner_marked_at, idempotency_key, strategy_context, rewrite_type, website_url, notes, source_content, output_markdown, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return (data as RewriteHistoryRow[]).map(mapHistoryRow);
}

export async function getRewriteHistoryByRequestRefForUser(
  userId: string,
  requestRef: string,
): Promise<RewriteHistoryRecord | null> {
  const supabase = await createSupabaseServerReadOnlyClient();
  const { data, error } = await supabase
    .from("rewrite_generations")
    .select(
      "id, request_ref, experiment_group_id, parent_request_ref, version_number, is_winner, winner_label, winner_marked_at, idempotency_key, strategy_context, rewrite_type, website_url, notes, source_content, output_markdown, created_at",
    )
    .eq("user_id", userId)
    .eq("request_ref", requestRef)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapHistoryRow(data as RewriteHistoryRow);
}

export async function getRewriteHistoryByIdempotencyKeyForUser(
  userId: string,
  idempotencyKey: string,
): Promise<RewriteHistoryRecord | null> {
  const key = idempotencyKey.trim();
  if (!key) {
    return null;
  }

  const supabase = await createSupabaseServerReadOnlyClient();
  const { data, error } = await supabase
    .from("rewrite_generations")
    .select(
      "id, request_ref, experiment_group_id, parent_request_ref, version_number, is_winner, winner_label, winner_marked_at, idempotency_key, strategy_context, rewrite_type, website_url, notes, source_content, output_markdown, created_at",
    )
    .eq("user_id", userId)
    .eq("idempotency_key", key)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapHistoryRow(data as RewriteHistoryRow);
}
