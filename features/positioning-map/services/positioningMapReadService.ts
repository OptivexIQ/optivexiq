import { createSupabaseServerClient } from "@/services/supabase/server";
import type { PositioningMapData } from "@/features/positioning-map/types/positioningMap.types";
import { parseStoredReportData } from "@/features/reports/services/canonicalReportReadService";

type PositioningMapRow = {
  id: string;
  user_id: string;
  report_data: unknown;
  status: string;
};

export type ReadPositioningMapResult =
  | { status: "not-found" }
  | { status: "forbidden" }
  | {
      status: "ok";
      payload: {
        reportId: string;
        status: string;
        positioning: PositioningMapData | null;
      };
    };

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizePositioningMap(value: unknown): PositioningMapData | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const axes = record.axes as Record<string, unknown> | undefined;
  const points = Array.isArray(record.points) ? record.points : [];
  const insights = Array.isArray(record.insights) ? record.insights : [];

  if (!axes) {
    return null;
  }

  const xLabel = typeof axes.xLabel === "string" ? axes.xLabel : "";
  const yLabel = typeof axes.yLabel === "string" ? axes.yLabel : "";
  const xMin = isNumber(axes.xMin) ? axes.xMin : 0;
  const xMax = isNumber(axes.xMax) ? axes.xMax : 100;
  const yMin = isNumber(axes.yMin) ? axes.yMin : 0;
  const yMax = isNumber(axes.yMax) ? axes.yMax : 100;

  if (!xLabel || !yLabel) {
    return null;
  }

  const normalizedPoints = points
    .map((point) => {
      if (!point || typeof point !== "object") {
        return null;
      }

      const item = point as Record<string, unknown>;
      const label = typeof item.label === "string" ? item.label : "";
      const x = isNumber(item.x) ? item.x : null;
      const y = isNumber(item.y) ? item.y : null;
      const summary =
        typeof item.summary === "string" ? item.summary : undefined;

      if (!label || x === null || y === null) {
        return null;
      }

      const mappedPoint: PositioningMapData["points"][number] = { label, x, y };
      if (summary) {
        mappedPoint.summary = summary;
      }

      return mappedPoint;
    })
    .filter(
      (point): point is PositioningMapData["points"][number] => point !== null,
    );

  const normalizedInsights = insights
    .map((item) => (typeof item === "string" ? item : String(item)))
    .filter((item) => item.length > 0);

  if (normalizedPoints.length === 0 && normalizedInsights.length === 0) {
    return null;
  }

  return {
    axes: { xLabel, yLabel, xMin, xMax, yMin, yMax },
    points: normalizedPoints,
    insights: normalizedInsights,
  };
}

export async function readPositioningMapForUser(
  reportId: string,
  userId: string,
): Promise<ReadPositioningMapResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("conversion_gap_reports")
    .select("id, user_id, report_data, status")
    .eq("id", reportId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return { status: "not-found" };
  }

  const row = data as PositioningMapRow;
  if (row.user_id !== userId) {
    return { status: "forbidden" };
  }

  const canonical = parseStoredReportData(row.report_data);
  const positioning = canonical
    ? normalizePositioningMap(canonical.positioningMap)
    : null;

  return {
    status: "ok",
    payload: {
      reportId: row.id,
      status: row.status,
      positioning,
    },
  };
}
