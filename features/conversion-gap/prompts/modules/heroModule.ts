import type {
  CompetitorInsight,
  ExtractedPageContent,
  HeroOutput,
} from "@/features/conversion-gap/types/gap.types";
import type { SaasProfileFormValues } from "@/features/saas-profile/types/profile.types";

export function heroModule(
  profile: SaasProfileFormValues,
  competitors: CompetitorInsight[],
  companyContent: ExtractedPageContent,
) {
  const schema: HeroOutput = {
    headline: "",
    subheadline: "",
    primaryCta: "",
    secondaryCta: "",
  };

  return {
    name: "hero",
    system:
      "You are a SaaS copywriter. Return ONLY valid JSON matching the schema.",
    user: JSON.stringify({ profile, companyContent, competitors, schema }),
    schema,
  };
}
