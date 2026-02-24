import { logger } from "@/lib/logger";
import { runRateLimitStartupCheck } from "@/features/usage/services/rateLimitService";
import { runReportCompletionStartupCheck } from "@/features/reports/services/reportCompletionContractService";
import { runDbContractStartupCheck } from "@/features/db/services/dbContractStartupService";
import { ENABLE_SUPABASE_STARTUP_CHECKS } from "@/lib/env";

export async function register() {
  if (!ENABLE_SUPABASE_STARTUP_CHECKS) {
    logger.warn("Supabase startup checks are disabled via environment toggle.", {
      component: "startup",
      checks_disabled: true,
    });
    return;
  }

  const [rateLimitOk, reportCompletionOk, dbContractOk] = await Promise.all([
    runRateLimitStartupCheck(),
    runReportCompletionStartupCheck(),
    runDbContractStartupCheck(),
  ]);
  if (!rateLimitOk) {
    logger.error("FATAL: rate limit startup verification failed.", undefined, {
      component: "startup",
      error_type: "rate_limit_startup_verification_failed",
    });
  }
  if (!reportCompletionOk) {
    logger.error("FATAL: report completion RPC startup verification failed.", undefined, {
      component: "startup",
      error_type: "report_completion_rpc_startup_verification_failed",
    });
  }
  if (!dbContractOk) {
    logger.error("FATAL: DB contract startup verification failed.", undefined, {
      component: "startup",
      error_type: "db_contract_startup_verification_failed",
    });
  }
}
