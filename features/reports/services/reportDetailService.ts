import { getReportDetailData } from "@/data/reportDetail";
import type { ReportDetailData } from "@/data/reportDetail";

export async function getReportDetail(
  reportId: string,
): Promise<ReportDetailData | null> {
  return getReportDetailData(reportId);
}
