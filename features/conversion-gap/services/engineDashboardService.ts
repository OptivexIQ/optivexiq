import type { EngineData, EngineStatus } from "@/data/engineDashboard";
import { createSupabaseServerClient } from "@/services/supabase/server";
import { logger } from "@/lib/logger";

type GapReportRow = {
  id: string;
  status: string | null;
  execution_stage: string | null;
  execution_progress: number | null;
  homepage_url: string | null;
  pricing_url: string | null;
  competitor_data: Record<string, unknown> | null;
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item : String(item)))
    .filter((item) => item.length > 0);
}

function mapEngineStatus(status: string | null): EngineStatus {
  switch (status) {
    case "completed":
      return "complete";
    case "queued":
    case "running":
      return "running";
    case "failed":
    default:
      return "idle";
  }
}

function normalizeReportStatus(
  status: string | null,
): EngineData["latestReport"]["status"] {
  if (
    status === "queued" ||
    status === "running" ||
    status === "completed" ||
    status === "failed"
  ) {
    return status;
  }

  return null;
}

function normalizeExecutionProgress(value: number | null): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

const emptyEngineData: EngineData = {
  headline: "Conversion Gap Engine",
  status: "idle",
  latestReport: {
    id: null,
    status: null,
    executionStage: null,
    executionProgress: null,
  },
  formDefaults: {
    homepageUrl: "",
    pricingUrl: "",
    competitorUrls: [],
  },
  explainer: [
    {
      title: "What the engine analyzes",
      description:
        "Homepage positioning, pricing clarity, CTA hierarchy, and competitor overlap.",
    },
    {
      title: "What you get",
      description:
        "A prioritized gap report, rewrite recommendations, and benchmark scores.",
    },
    {
      title: "Estimated time to results",
      description: "6 to 8 minutes for a full multi-page analysis.",
    },
  ],
  output: {
    headline: "Current output preview",
    bullets: [
      "Gap score, pricing overlap, and proof coverage",
      "Homepage rewrite summary with clarity lift",
      "Competitive differentiation statements",
    ],
    etaMinutes: 7,
  },
};

export type EngineDataResult =
  | { ok: true; data: EngineData }
  | { ok: false; error: string };

async function fetchEngineDashboard(): Promise<EngineDataResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return { ok: true, data: emptyEngineData };
    }

    const { data, error } = await supabase
      .from("conversion_gap_reports")
      .select(
        "id, status, execution_stage, execution_progress, homepage_url, pricing_url, competitor_data",
      )
      .eq("user_id", authData.user.id)
      .eq("report_type", "full")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error("Failed to load engine dashboard.", error);
      return { ok: false, error: "Unable to load engine dashboard." };
    }

    const report = data as GapReportRow | null;
    if (!report) {
      return { ok: true, data: emptyEngineData };
    }

    const competitorUrls = toStringArray(
      (report.competitor_data as Record<string, unknown> | null)
        ?.competitor_urls,
    );

    return {
      ok: true,
      data: {
        ...emptyEngineData,
        status: mapEngineStatus(report.status),
        latestReport: {
          id: report.id,
          status: normalizeReportStatus(report.status),
          executionStage: report.execution_stage,
          executionProgress: normalizeExecutionProgress(
            report.execution_progress,
          ),
        },
        formDefaults: {
          homepageUrl:
            report.homepage_url ?? emptyEngineData.formDefaults.homepageUrl,
          pricingUrl:
            report.pricing_url ?? emptyEngineData.formDefaults.pricingUrl,
          competitorUrls:
            competitorUrls.length > 0
              ? competitorUrls
              : emptyEngineData.formDefaults.competitorUrls,
        },
      },
    };
  } catch (error) {
    logger.error("Failed to build engine dashboard.", error);
    return { ok: false, error: "Unable to load engine dashboard." };
  }
}

export async function getEngineDataResult(): Promise<EngineDataResult> {
  return fetchEngineDashboard();
}
