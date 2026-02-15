import type { ConversionGapReport as CanonicalConversionGapReport } from "@/features/conversion-gap/types/conversionGapReport.types";

export type ConversionGapReport = CanonicalConversionGapReport;
export type ThreatLevel = ConversionGapReport["threatLevel"];

export type ReportFetchResult =
  | { status: "ok"; report: ConversionGapReport }
  | { status: "forbidden" }
  | { status: "not-found" }
  | { status: "error"; message: string };
