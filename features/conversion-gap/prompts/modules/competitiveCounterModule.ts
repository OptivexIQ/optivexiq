import type {
  CompetitorInsight,
  ExtractedPageContent,
  CompetitiveCounterOutput,
} from "@/features/conversion-gap/types/gap.types";
import type { SaaSProfileContext } from "@/features/conversion-gap/prompts/saasProfileContext";

export function competitiveCounterModule(
  profile: SaaSProfileContext,
  competitors: CompetitorInsight[],
  companyContent: ExtractedPageContent,
) {
  const outputContract: CompetitiveCounterOutput = {
    counters: [
      {
        competitor: "Competitor name",
        counter: "Counter-positioning statement",
      },
    ],
  };

  return {
    name: "competitive-counter",
    system:
      "You are a competitive analyst. Return one JSON object with key counters: Array<{ competitor: string, counter: string }>. No extra keys.",
    user: JSON.stringify(
      { profile, companyContent, competitors, output_contract: outputContract },
      null,
      2,
    ),
    schema: outputContract,
  };
}
