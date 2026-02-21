import type {
  CompetitorInsight,
  ExtractedPageContent,
  PricingOutput,
} from "@/features/conversion-gap/types/gap.types";
import type { SaaSProfileContext } from "@/features/conversion-gap/prompts/saasProfileContext";

export function pricingModule(
  profile: SaaSProfileContext,
  competitors: CompetitorInsight[],
  pricingContent: ExtractedPageContent | null,
) {
  const outputContract: PricingOutput = {
    valueMetric: "Primary value metric used in pricing communication",
    anchor: "Pricing anchor statement users should understand immediately",
    packagingNotes: ["Package note 1", "Package note 2", "Package note 3"],
  };

  return {
    name: "pricing",
    system:
      "You are a SaaS pricing strategist. Return one JSON object with keys: valueMetric (string), anchor (string), packagingNotes (string[]). No extra keys.",
    user: JSON.stringify(
      {
        profile,
        pricingContent,
        competitors,
        output_contract: outputContract,
      },
      null,
      2,
    ),
    schema: outputContract,
  };
}
