import { logger } from "@/lib/logger";
import { runRateLimitStartupCheck } from "@/features/usage/services/rateLimitService";
import { runReportCompletionStartupCheck } from "@/features/reports/services/reportCompletionContractService";

export async function register() {
  const [rateLimitOk, reportCompletionOk] = await Promise.all([
    runRateLimitStartupCheck(),
    runReportCompletionStartupCheck(),
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
}
