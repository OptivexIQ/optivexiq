import type {
  FreeAuditRequest,
  FreeAuditResult,
  FreeAuditRiskLevel,
} from "@/features/free-audit/types/freeAudit.types";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function riskLevelFromScore(score: number): FreeAuditRiskLevel {
  if (score >= 70) {
    return "High";
  }

  if (score >= 45) {
    return "Medium";
  }

  return "Low";
}

function buildInsights(
  request: FreeAuditRequest,
  riskLevel: FreeAuditRiskLevel,
): string[] {
  const insights: string[] = [];
  const competitorCount = request.competitor_urls?.length ?? 0;

  if (!request.pricing_url) {
    insights.push(
      "Pricing clarity is missing or difficult to locate, which increases late-stage friction.",
    );
  }

  if (competitorCount >= 2) {
    insights.push(
      "Competitive overlap is likely because multiple rivals are referenced without a clear positioning wedge.",
    );
  }

  if (riskLevel === "High") {
    insights.push(
      "Value props feel broad; tighten the hero around a single measurable outcome to reduce drop-off.",
    );
  } else if (riskLevel === "Medium") {
    insights.push(
      "Outcome framing is present but not leading; move proof and ROI anchors above the fold.",
    );
  } else {
    insights.push(
      "Core narrative is solid, but proof density and objections can still be tightened for lift.",
    );
  }

  if (insights.length < 3) {
    insights.push(
      "Add a short proof strip (logos, metrics, or case wins) near the first CTA to build trust.",
    );
  }

  return insights.slice(0, 3);
}

function estimateRevenueImpact(score: number) {
  const assumedPipeline = 250000;
  const riskMultiplier = clamp(score / 100, 0.2, 0.9);
  const pipelineAtRisk = Math.round(assumedPipeline * riskMultiplier);
  const estimatedRecovery = Math.round(pipelineAtRisk * 0.25);

  return {
    pipeline_at_risk: pipelineAtRisk,
    estimated_recovery: estimatedRecovery,
    note: "Preview-only estimate based on limited inputs. Full report refines this with live data.",
  };
}

export function runFreeAudit(request: FreeAuditRequest): FreeAuditResult {
  const competitorCount = request.competitor_urls?.length ?? 0;
  const pricingPenalty = request.pricing_url ? 0 : 15;
  const competitorPenalty =
    competitorCount >= 3 ? 20 : competitorCount >= 1 ? 10 : 0;
  const baseScore = 35;
  const riskScore = clamp(
    baseScore + pricingPenalty + competitorPenalty,
    0,
    100,
  );
  const riskLevel = riskLevelFromScore(riskScore);

  return {
    risk_level: riskLevel,
    insights: buildInsights(request, riskLevel),
    revenue_impact: estimateRevenueImpact(riskScore),
    upgrade_cta:
      "Unlock the full Conversion Gap Report with rewrites, exports, and competitive benchmarks.",
  };
}
