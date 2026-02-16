import type {
  FreeConversionSnapshot,
  FreeSnapshotExecutionStage,
  FreeSnapshotRow,
  FreeSnapshotStatus,
} from "@/features/free-snapshot/types/freeSnapshot.types";
import { createSupabaseAdminClient } from "@/services/supabase/admin";

const FREE_SNAPSHOT_SELECT =
  "id, email, website_url, competitor_urls, analysis_context, snapshot_data, status, execution_stage, created_at, updated_at, ip_address, user_agent, error_message, unlocked_at, conversion_from_snapshot, snapshot_user_id";

export async function createQueuedFreeSnapshot(input: {
  websiteUrl: string;
  competitorUrls: string[];
  email?: string;
  context?: string;
  ipAddress: string | null;
  userAgent: string | null;
}) {
  const admin = createSupabaseAdminClient("worker");
  const { data, error } = await admin
    .from("free_conversion_snapshots")
    .insert({
      website_url: input.websiteUrl,
      competitor_urls: input.competitorUrls,
      email: input.email ?? null,
      analysis_context: input.context ?? null,
      status: "queued",
      execution_stage: null,
      ip_address: input.ipAddress,
      user_agent: input.userAgent,
    })
    .select("id, status, created_at")
    .maybeSingle();

  if (error || !data?.id) {
    return { ok: false as const, error: "free_snapshot_insert_failed" };
  }

  return {
    ok: true as const,
    snapshotId: data.id as string,
    status: data.status as FreeSnapshotStatus,
    createdAt: data.created_at as string,
  };
}

export async function getFreeSnapshotById(snapshotId: string) {
  const admin = createSupabaseAdminClient("worker");
  const { data, error } = await admin
    .from("free_conversion_snapshots")
    .select(FREE_SNAPSHOT_SELECT)
    .eq("id", snapshotId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as FreeSnapshotRow;
}

export async function updateFreeSnapshotStatus(input: {
  snapshotId: string;
  status: FreeSnapshotStatus;
  executionStage?: FreeSnapshotExecutionStage | null;
  snapshotData?: FreeConversionSnapshot | null;
  errorMessage?: string | null;
}) {
  const admin = createSupabaseAdminClient("worker");
  const payload: Record<string, unknown> = {
    status: input.status,
    execution_stage:
      input.executionStage === undefined ? null : input.executionStage,
    error_message: input.errorMessage ?? null,
    updated_at: new Date().toISOString(),
  };

  if (input.snapshotData) {
    payload.snapshot_data = input.snapshotData;
  }

  const { error } = await admin
    .from("free_conversion_snapshots")
    .update(payload)
    .eq("id", input.snapshotId);

  return !error;
}

export async function markFreeSnapshotUnlocked(input: {
  snapshotId: string;
  email: string;
  consent: boolean;
}) {
  const admin = createSupabaseAdminClient("worker");
  const { error } = await admin
    .from("free_conversion_snapshots")
    .update({
      email: input.email,
      consent: input.consent,
      unlocked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.snapshotId);

  return !error;
}

export async function findRecentSnapshotByEmailAndWebsite(input: {
  email: string;
  websiteUrl: string;
}) {
  const admin = createSupabaseAdminClient("worker");
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await admin
    .from("free_conversion_snapshots")
    .select(FREE_SNAPSHOT_SELECT)
    .eq("email", input.email)
    .eq("website_url", input.websiteUrl)
    .gte("created_at", since)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as FreeSnapshotRow;
}

export async function findRecentReusableSnapshotByEmailAndWebsite(input: {
  email: string;
  websiteUrl: string;
}) {
  const admin = createSupabaseAdminClient("worker");
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await admin
    .from("free_conversion_snapshots")
    .select(FREE_SNAPSHOT_SELECT)
    .eq("email", input.email)
    .eq("website_url", input.websiteUrl)
    .gte("created_at", since)
    .neq("status", "failed")
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as FreeSnapshotRow;
}

export async function setFreeSnapshotFailure(input: {
  snapshotId: string;
  message: string;
}) {
  return updateFreeSnapshotStatus({
    snapshotId: input.snapshotId,
    status: "failed",
    executionStage: null,
    errorMessage: input.message,
  });
}

export async function attributeSnapshotConversionByEmail(input: {
  userId: string;
  email: string;
}) {
  const admin = createSupabaseAdminClient("worker");
  const { data, error } = await admin
    .from("free_conversion_snapshots")
    .select("id")
    .eq("email", input.email)
    .not("unlocked_at", "is", null)
    .eq("conversion_from_snapshot", false)
    .order("unlocked_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data?.id) {
    return null;
  }

  const { error: updateError } = await admin
    .from("free_conversion_snapshots")
    .update({
      conversion_from_snapshot: true,
      snapshot_user_id: input.userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  if (updateError) {
    return null;
  }

  return data.id as string;
}
