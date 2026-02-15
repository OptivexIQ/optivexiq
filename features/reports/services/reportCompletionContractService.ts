import { createSupabaseAdminClient } from "@/services/supabase/admin";
import { logger } from "@/lib/logger";

type VerifyRow = {
  is_ready: boolean;
  matching_count: number;
};

let startupCheckPromise: Promise<boolean> | null = null;

async function verifyCanonicalCompletionRpcSignature(): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("verify_canonical_gap_completion_rpc_ready");

  if (error) {
    logger.error("FATAL: canonical completion RPC startup check failed.", error, {
      component: "report_completion_rpc_startup",
      error_type: error.code ?? "rpc_error",
    });
    return false;
  }

  const row = (Array.isArray(data) ? data[0] : data) as VerifyRow | null;
  if (!row) {
    logger.error("FATAL: canonical completion RPC check returned no data.", undefined, {
      component: "report_completion_rpc_startup",
      error_type: "no_data",
    });
    return false;
  }

  if (!row.is_ready) {
    logger.error("FATAL: canonical completion RPC signature mismatch.", undefined, {
      component: "report_completion_rpc_startup",
      error_type: "signature_mismatch",
      matching_count: row.matching_count,
    });
    return false;
  }

  return true;
}

export async function runReportCompletionStartupCheck(): Promise<boolean> {
  if (!startupCheckPromise) {
    startupCheckPromise = verifyCanonicalCompletionRpcSignature();
  }
  return startupCheckPromise;
}

