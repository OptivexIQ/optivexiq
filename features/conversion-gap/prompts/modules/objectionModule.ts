import type {
  CompetitorInsight,
  ExtractedPageContent,
  ObjectionOutput,
} from "@/features/conversion-gap/types/gap.types";
import type { SaasProfileFormValues } from "@/features/saas-profile/types/profile.types";

export function objectionModule(
  profile: SaasProfileFormValues,
  competitors: CompetitorInsight[],
  companyContent: ExtractedPageContent,
) {
  const schema: ObjectionOutput = {
    objections: [{ objection: "", response: "" }],
  };

  return {
    name: "objections",
    system:
      "You are a SaaS sales enabler. Return ONLY valid JSON matching the schema.",
    user: JSON.stringify({ profile, companyContent, competitors, schema }),
    schema,
  };
}
