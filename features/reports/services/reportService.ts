import type { ReportFetchResult } from "@/features/reports/types/report.types";
import {
  getCanonicalGapReportForUser,
  parseStoredReportData,
  validateGapReport,
} from "@/features/reports/services/canonicalReportReadService";
import { createSupabaseServerClient } from "@/services/supabase/server";

async function fetchGapReport(reportId: string): Promise<ReportFetchResult> {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return { status: "forbidden" };
  }

  return getCanonicalGapReportForUser(reportId, authData.user.id);
}

export async function getGapReport(
  reportId: string,
): Promise<ReportFetchResult> {
  return fetchGapReport(reportId);
}

export { parseStoredReportData, validateGapReport };
