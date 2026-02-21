import type { ConversionGapReport } from "@/features/reports/types/report.types";

export type ReportExecutionStatus =
  | "queued"
  | "running"
  | "retrying"
  | "completed"
  | "failed";

export type ReportExecutionStage =
  | "queued"
  | "scraping_homepage"
  | "scraping_pricing"
  | "scraping_competitors"
  | "gap_analysis"
  | "competitor_synthesis"
  | "scoring"
  | "rewrite_generation"
  | "finalizing"
  | "complete"
  | "failed";

export type GapReportExecutionPayload = {
  id: string;
  status: ReportExecutionStatus;
  executionStage: ReportExecutionStage | null;
  executionProgress: number | null;
  startedAt: string | null;
  updatedAt: string | null;
  completedAt: string | null;
  error: string | null;
  report: ConversionGapReport | null;
};
