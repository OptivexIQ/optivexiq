import type { ConversionGapReport as CanonicalConversionGapReport } from "@/features/conversion-gap/types/conversionGapReport.types";

export type ConversionGapReport = CanonicalConversionGapReport;
export type ThreatLevel = ConversionGapReport["threatLevel"];

export type ReportFetchResult =
  | {
      status: "ok";
      report: ConversionGapReport;
      metadata?: {
        legacy_migrated: boolean;
        report_schema_version: number | null;
      };
    }
  | { status: "forbidden" }
  | { status: "not-found" }
  | { status: "error"; message: string };
