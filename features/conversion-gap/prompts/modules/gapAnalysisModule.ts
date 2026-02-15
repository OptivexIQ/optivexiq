import type {
  CompetitorInsight,
  ExtractedPageContent,
  GapAnalysisOutput,
} from "@/features/conversion-gap/types/gap.types";
import type { SaasProfileFormValues } from "@/features/saas-profile/types/profile.types";

export function gapAnalysisModule(
  profile: SaasProfileFormValues,
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
  };

  return {
    name: "gap-analysis",
    system:
      "You are a conversion strategist. Return ONLY valid JSON matching the schema.",
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
