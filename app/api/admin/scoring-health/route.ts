import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/requireApiRole";
import { createSupabaseAdminClient } from "@/services/supabase/admin";

type Rag = "green" | "amber" | "red";

function toRag(sampleSize: number, daysSinceCalibration: number): Rag {
  if (sampleSize < 25 || daysSinceCalibration > 90) {
    return "red";
  }
  if (sampleSize < 100 || daysSinceCalibration > 45) {
    return "amber";
  }
  return "green";
}

export async function GET() {
  const { response } = await requireApiRole(["admin", "super_admin"]);
  if (response) {
    return response;
  }

  const admin = createSupabaseAdminClient("worker");
  const { data, error } = await admin
    .from("scoring_model_versions")
    .select(
      "version, last_calibrated_at, training_sample_size, drift_threshold, taxonomy_version, scoring_weights_version, metadata",
    )
    .order("last_calibrated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      {
        status: "red",
        error: "scoring_model_version_unavailable",
      },
      { status: 503 },
    );
  }

  const lastCalibratedAt = new Date(data.last_calibrated_at);
  const daysSinceCalibration = Number.isFinite(lastCalibratedAt.getTime())
    ? Math.floor((Date.now() - lastCalibratedAt.getTime()) / (24 * 60 * 60 * 1000))
    : 999;
  const rag = toRag(data.training_sample_size, daysSinceCalibration);

  return NextResponse.json({
    status: rag,
    model_version: data.version,
    taxonomy_version: data.taxonomy_version,
    scoring_weights_version: data.scoring_weights_version,
    calibration_metadata: {
      last_calibrated_at: data.last_calibrated_at,
      training_sample_size: data.training_sample_size,
      drift_threshold: Number(data.drift_threshold),
      days_since_calibration: daysSinceCalibration,
      metadata: data.metadata ?? {},
    },
  });
}
