import { httpClient } from "@/lib/api/httpClient";
import type { GapReportExecutionPayload } from "@/features/reports/types/reportExecution.types";

export type ReportExecutionResponse = {
  report: GapReportExecutionPayload;
};

export async function getReportExecution(
  reportId: string,
): Promise<ReportExecutionResponse> {
  return httpClient<ReportExecutionResponse>(`/api/reports/${reportId}`, {
    method: "GET",
    cache: "no-store",
  });
}
