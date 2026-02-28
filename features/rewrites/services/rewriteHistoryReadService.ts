import { createSupabaseServerReadOnlyClient } from "@/services/supabase/server";
import type { RewriteGenerateRequest } from "@/features/rewrites/types/rewrites.types";

export type RewriteHistoryRecord = {
  id: string;
  requestRef: string;
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
  rewrite_type: RewriteGenerateRequest["rewriteType"];
  website_url: string | null;
  notes: string | null;
  source_content: string | null;
  output_markdown: string;
  created_at: string;
};

function mapHistoryRow(row: RewriteHistoryRow): RewriteHistoryRecord {
  return {
    id: row.id,
    requestRef: row.request_ref,
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
      "id, request_ref, rewrite_type, website_url, notes, source_content, output_markdown, created_at",
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
      "id, request_ref, rewrite_type, website_url, notes, source_content, output_markdown, created_at",
    )
    .eq("user_id", userId)
    .eq("request_ref", requestRef)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapHistoryRow(data as RewriteHistoryRow);
}
