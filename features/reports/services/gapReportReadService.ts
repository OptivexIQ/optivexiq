import { getCanonicalGapReportExecutionForUser } from "@/features/reports/services/canonicalReportReadService";
import type { GapReportExecutionPayload } from "@/features/reports/types/reportExecution.types";
import { logger } from "@/lib/logger";

export class ReportReadQueryError extends Error {
  readonly reportId: string;
  readonly userId: string;

  constructor(reportId: string, userId: string) {
    super("report_read_query_failed");
    this.name = "ReportReadQueryError";
    this.reportId = reportId;
    this.userId = userId;
  }
}

export async function getGapReportForUser(
  reportId: string,
  userId: string,
): Promise<GapReportExecutionPayload | null> {
  const result = await getCanonicalGapReportExecutionForUser(reportId, userId);
  if (result.status === "ok") {
    return result.execution;
  }
  if (result.status === "not-found" || result.status === "forbidden") {
    return null;
  }

  logger.error(
    "Gap report read query failed.",
    undefined,
    {
      report_id: reportId,
      user_id: userId,
      reason: result.message,
    },
  );
  throw new ReportReadQueryError(reportId, userId);
}
