import type {
  CompetitorInsight,
  ExtractedPageContent,
  DifferentiationOutput,
} from "@/features/conversion-gap/types/gap.types";
import type { SaaSProfileContext } from "@/features/conversion-gap/prompts/saasProfileContext";

export function differentiationModule(
  profile: SaaSProfileContext,
  competitors: CompetitorInsight[],
  companyContent: ExtractedPageContent,
) {
  const schema: DifferentiationOutput = {
    differentiators: [{ claim: "", proof: "" }],
  };

  return {
    name: "differentiation",
    system:
      "You are a positioning strategist. Return ONLY valid JSON matching the schema.",
    user: JSON.stringify({ profile, companyContent, competitors, schema }),
    schema,
  };
}
