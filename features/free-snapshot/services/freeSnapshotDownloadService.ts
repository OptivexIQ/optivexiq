import type { ConversionGapReport } from "@/features/reports/types/report.types";
import type { FreeConversionSnapshot } from "@/features/free-snapshot/types/freeSnapshot.types";
import { getFreeSnapshotById } from "@/features/free-snapshot/services/freeSnapshotRepository";
import { freeConversionSnapshotSchema } from "@/features/free-snapshot/validators/freeSnapshotSchema";
import { generateSnapshotPdf } from "@/features/free-snapshot/pdf/generateSnapshotPdf";

function toCanonicalReport(
  snapshotId: string,
  websiteUrl: string,
  snapshot: FreeConversionSnapshot,
): ConversionGapReport {
  const createdAt = new Date().toISOString();
  const gapA = snapshot.topMessagingGap;
  const gapB = snapshot.topObjectionGap;
  const score = Math.round((snapshot.clarityScore + snapshot.positioningScore) / 2);

  return {
    id: snapshotId,
    company: websiteUrl,
    segment: "SaaS",
    status: "completed",
    createdAt,
    conversionScore: score,
    funnelRisk: Math.max(0, 100 - score),
    winRateDelta: Math.round(snapshot.positioningScore * 0.12),
    pipelineAtRisk: 0,
    differentiationScore: snapshot.positioningScore,
    pricingScore: score,
    clarityScore: snapshot.clarityScore,
    confidenceScore: score,
    threatLevel: score >= 70 ? "low" : score >= 45 ? "medium" : "high",
    executiveNarrative: snapshot.executiveSummary,
    executiveSummary: snapshot.executiveSummary,
    messagingOverlap: {
      items: [],
      insight: snapshot.topMessagingGap,
      ctaLabel: "Upgrade for full overlap analysis",
    },
    objectionCoverage: {
      "primary-objection": Math.max(0, 100 - Math.round((snapshot.positioningScore + snapshot.clarityScore) / 2)),
    },
    competitiveMatrix: {},
    positioningMap: {},
    rewrites: {},
    rewriteRecommendations: snapshot.quickWins.map((win, index) => ({
      title: `Quick Win ${index + 1}`,
      slug: `quick-win-${index + 1}`,
      category: "Free Snapshot",
      metric: "Estimated conversion lift",
      copy: win,
      iconName: "default",
    })),
    revenueImpact: {
      pipelineAtRisk: 0,
      estimatedLiftPercent: Math.max(5, Math.round(snapshot.clarityScore * 0.15)),
      modeledWinRateDelta: Math.max(2, Math.round(snapshot.positioningScore * 0.08)),
      projectedPipelineRecovery: 0,
    },
    revenueProjection: {
      estimatedLiftPercent: Math.max(5, Math.round(snapshot.clarityScore * 0.15)),
      modeledWinRateDelta: Math.max(2, Math.round(snapshot.positioningScore * 0.08)),
      projectedPipelineRecovery: 0,
    },
    priorityIssues: [
      {
        issue: gapA,
        impactScore: 90,
        effortEstimate: 35,
        priorityScore: 78,
        tier: "Critical",
      },
      {
        issue: gapB,
        impactScore: 80,
        effortEstimate: 40,
        priorityScore: 70,
        tier: "High",
      },
      {
        issue: snapshot.riskEstimate,
        impactScore: 68,
        effortEstimate: 34,
        priorityScore: 62,
        tier: "Medium",
      },
    ],
    priorityIndex: [],
  };
}

export async function generateFreeSnapshotDownload(input: {
  snapshotId: string;
  email: string;
}) {
  const row = await getFreeSnapshotById(input.snapshotId);
  if (!row) {
    return { ok: false as const, status: 404, error: "Snapshot not found." };
  }

  if (row.status !== "completed") {
    return {
      ok: false as const,
      status: 409,
      error: "Snapshot is not completed yet.",
    };
  }

  const parsed = freeConversionSnapshotSchema.safeParse(row.snapshot_data);
  if (!parsed.success) {
    return {
      ok: false as const,
      status: 500,
      error: "Stored snapshot data is invalid.",
    };
  }

  const report = toCanonicalReport(row.id, row.website_url, parsed.data);
  const pdf = await generateSnapshotPdf({
    report,
    brand: {
      logoUrl: "https://optivexiq.com/logo.png",
      primaryColor: "#0f172a",
      accentColor: "#0ea5e9",
    },
    generatedAt: new Date().toISOString(),
  });

  return {
    ok: true as const,
    pdf,
    filename: "OptivexIQ-Snapshot.pdf",
    website: row.website_url,
    snapshotId: row.id,
  };
}
