import type {
  GapAnalysisOutput,
  HeroOutput,
  PricingOutput,
  CompetitorInsight,
} from "@/features/conversion-gap/types/gap.types";
import type { SaasProfileFormValues } from "@/features/saas-profile/types/profile.types";
import type { ModuleUsage } from "@/features/conversion-gap/services/moduleRuntimeService";
import {
  scoreTaxonomyOverlap,
  CANONICAL_TAXONOMY_VERSION,
  type CompetitiveTaxonomy,
  type DimensionalOverlap,
  type OverlapByCompetitor,
  type WhiteSpaceOpportunity,
} from "@/features/conversion-gap/services/taxonomyOverlapScoringService";

export type CompetitorSynthesisOutput = {
  coreDifferentiationTension: string;
  messagingOverlapRisk: {
    level: "low" | "moderate" | "high";
    explanation: string;
  };
  substitutionRiskNarrative: string;
  counterPositioningVector: string;
  pricingDefenseNarrative: string;
  taxonomyVersion: string;
  companyTaxonomy: CompetitiveTaxonomy;
  competitorTaxonomies: CompetitiveTaxonomy[];
  overlapByCompetitor: OverlapByCompetitor[];
  dimensionalOverlap: DimensionalOverlap;
  whiteSpaceOpportunities: WhiteSpaceOpportunity[];
  overlapDensity: number;
  referencedTaxonomyIds: string[];
  referencedOverlapDimensionIds: Array<
    "messaging_overlap" | "positioning_overlap" | "pricing_overlap" | "aggregate_overlap"
  >;
  whiteSpaceRulesApplied: string[];
};

type CompetitorSynthesisInput = {
  profile: SaasProfileFormValues;
  gapAnalysis: GapAnalysisOutput;
  homepageAnalysis: HeroOutput;
  pricingAnalysis: PricingOutput;
  competitors: CompetitorInsight[];
};

function toRiskLevel(score: number): "low" | "moderate" | "high" {
  if (score >= 70) {
    return "high";
  }
  if (score >= 40) {
    return "moderate";
  }
  return "low";
}

export async function synthesizeCompetitorIntelligence(
  input: CompetitorSynthesisInput,
): Promise<{ data: CompetitorSynthesisOutput; usage: ModuleUsage }> {
  const overlap = await scoreTaxonomyOverlap({
    profile: input.profile,
    homepageAnalysis: input.homepageAnalysis,
    pricingAnalysis: input.pricingAnalysis,
    gapAnalysis: input.gapAnalysis,
    competitors: input.competitors,
  });

  const overlapLevel = toRiskLevel(overlap.dimensionalOverlap.aggregate_overlap);
  const topWhitespace = overlap.whiteSpaceOpportunities[0];
  const mostExposedDimension =
    [
      { key: "messaging", score: overlap.dimensionalOverlap.messaging_overlap },
      { key: "positioning", score: overlap.dimensionalOverlap.positioning_overlap },
      { key: "pricing", score: overlap.dimensionalOverlap.pricing_overlap },
    ].sort((a, b) => b.score - a.score)[0] ?? { key: "messaging", score: 0 };

  const explanation = `overlap_density=${overlap.overlapDensity}; dims=[messaging_overlap:${overlap.dimensionalOverlap.messaging_overlap}, positioning_overlap:${overlap.dimensionalOverlap.positioning_overlap}, pricing_overlap:${overlap.dimensionalOverlap.pricing_overlap}, aggregate_overlap:${overlap.dimensionalOverlap.aggregate_overlap}]; taxonomy_refs=${overlap.referencedTaxonomyIds.slice(0, 4).join(",")}; competitor_count=${overlap.overlapByCompetitor.length}`;
  const substitutionRiskNarrative = `risk=${overlapLevel}; overlap_density=${overlap.overlapDensity}; dominant_dimension=${mostExposedDimension.key}; dominant_dimension_score=${mostExposedDimension.score}; referenced_dims=${overlap.referencedOverlapDimensionIds.join(",")}`;
  const counterPositioningVector = topWhitespace
    ? `whitespace_claim="${topWhitespace.claim}"; dimension=${topWhitespace.dimension}; missing_across=${topWhitespace.missingAcross}; specificity=${topWhitespace.claimSpecificityScore}; confidence=${topWhitespace.whitespaceConfidenceScore}; supporting_competitors=${topWhitespace.supportingCompetitorIds.join(",")}; rule_refs=${overlap.whiteSpaceRulesApplied.join(",")}`
    : "whitespace_insufficient_signal";
  const pricingDefenseNarrative =
    overlap.dimensionalOverlap.pricing_overlap >= 60
      ? `pricing_overlap=${overlap.dimensionalOverlap.pricing_overlap}; action=reinforce_pricing_proof; taxonomy_ref=companyTaxonomy.pricingSignals`
      : `pricing_overlap=${overlap.dimensionalOverlap.pricing_overlap}; action=maintain_proof_led_pricing; taxonomy_ref=companyTaxonomy.pricingSignals`;

  return {
    data: {
      coreDifferentiationTension: `Primary differentiation pressure sits in ${mostExposedDimension.key} overlap.`,
      messagingOverlapRisk: {
        level: overlapLevel,
        explanation,
      },
      substitutionRiskNarrative,
      counterPositioningVector,
      pricingDefenseNarrative,
      taxonomyVersion: CANONICAL_TAXONOMY_VERSION,
      companyTaxonomy: overlap.companyTaxonomy,
      competitorTaxonomies: overlap.competitorTaxonomies,
      overlapByCompetitor: overlap.overlapByCompetitor,
      dimensionalOverlap: overlap.dimensionalOverlap,
      whiteSpaceOpportunities: overlap.whiteSpaceOpportunities,
      overlapDensity: overlap.overlapDensity,
      referencedTaxonomyIds: overlap.referencedTaxonomyIds,
      referencedOverlapDimensionIds: overlap.referencedOverlapDimensionIds,
      whiteSpaceRulesApplied: overlap.whiteSpaceRulesApplied,
    },
    usage: overlap.usage,
  };
}
