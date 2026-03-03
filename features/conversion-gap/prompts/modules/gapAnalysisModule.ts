import type {
  CompetitorInsight,
  ExtractedPageContent,
  GapAnalysisOutput,
} from "@/features/conversion-gap/types/gap.types";
import type { SaaSProfileContext } from "@/features/conversion-gap/prompts/saasProfileContext";

export function gapAnalysisModule(
  profile: SaaSProfileContext,
  competitors: CompetitorInsight[],
  companyContent: ExtractedPageContent,
  pricingContent: ExtractedPageContent | null,
) {
  const schema: GapAnalysisOutput = {
    gaps: [""],
    opportunities: [""],
    risks: [""],
    messagingOverlap: [""],
    missingObjections: [""],
    differentiationGaps: [""],
    pricingClarityIssues: [""],
    positioningDiagnostics: {
      icp_clarity_score: 0,
      outcome_vs_feature_ratio: 0,
      ambiguity_flags: [""],
      ambiguity_flag_evidence: [{ flag: "", evidence: "" }],
      value_prop_specificity_score: 0,
      detected_icp_statements: [""],
      missing_icp_dimensions: [""],
    },
  };

  return {
    name: "gap-analysis",
    system: [
      "You are a conversion strategist.",
      "Return ONLY valid JSON matching the schema.",
      "For positioningDiagnostics, every ambiguity flag must include a supporting evidence snippet from the provided content.",
      "outcome_vs_feature_ratio must be numeric and grounded in extracted statements.",
    ].join(" "),
    user: JSON.stringify({
      profile,
      companyContent,
      pricingContent,
      competitors,
      schema,
    }),
    schema,
  };
}
