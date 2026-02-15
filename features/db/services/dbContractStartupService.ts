import { createSupabaseAdminClient } from "@/services/supabase/admin";
import { logger } from "@/lib/logger";

type SnapshotReadyRow = {
  is_ready: boolean;
  mismatch_count: number;
  mismatch_keys: string[] | null;
};

let startupCheckPromise: Promise<boolean> | null = null;

async function verifyCanonicalMigrationSnapshot(): Promise<boolean> {
  const admin = createSupabaseAdminClient("worker");
  const { data, error } = await admin.rpc(
    "verify_canonical_migration_snapshot_ready",
  );

  if (error) {
    logger.error("FATAL: canonical migration snapshot startup check failed.", error, {
      component: "db_contract_startup",
      error_type: error.code ?? "rpc_error",
    });
    return false;
  }

  const row = (Array.isArray(data) ? data[0] : data) as SnapshotReadyRow | null;
  if (!row) {
    logger.error("FATAL: canonical migration snapshot check returned no data.", undefined, {
      component: "db_contract_startup",
      error_type: "no_data",
    });
    return false;
  }

  if (!row.is_ready) {
    logger.error("FATAL: canonical migration snapshot mismatch detected.", undefined, {
      component: "db_contract_startup",
      error_type: "snapshot_mismatch",
      mismatch_count: row.mismatch_count,
      mismatch_keys: row.mismatch_keys ?? [],
    });
    return false;
  }

  return true;
}

export async function runDbContractStartupCheck(): Promise<boolean> {
  if (!startupCheckPromise) {
    startupCheckPromise = verifyCanonicalMigrationSnapshot();
  }
  return startupCheckPromise;
}
