import { createSupabaseServerClient } from "@/services/supabase/server";
import type { SnapshotResult } from "@/features/conversion-gap/types/snapshot.types";

export type SnapshotReportStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed";

export type SnapshotReport = {
  id: string;
  homepageUrl: string | null;
  createdAt: string | null;
  status: SnapshotReportStatus;
  result: SnapshotResult | null;
};

export async function getLatestSnapshotReport(): Promise<SnapshotReport | null> {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return null;
  }

  const { data, error } = await supabase
    .from("conversion_gap_reports")
    .select("id, homepage_url, created_at, status, snapshot_result")
    .eq("user_id", authData.user.id)
    .eq("report_type", "snapshot")
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const status = (data.status ?? "queued") as SnapshotReportStatus;
  const result = (data.snapshot_result ?? null) as SnapshotResult | null;

  return {
    id: data.id,
    homepageUrl: data.homepage_url ?? null,
    createdAt: data.created_at ?? null,
    status,
    result: result && Object.keys(result).length ? result : null,
  };
}
