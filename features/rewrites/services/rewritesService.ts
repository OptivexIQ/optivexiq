import type { OpenAIRequest } from "@/features/ai/client/openaiClient";
import { getProfile } from "@/features/saas-profile/services/profileService";
import type { RewriteGenerateRequestValues } from "@/features/rewrites/validators/rewritesSchema";

function formatGoal(goal: string) {
  if (goal === "trial") {
    return "Drive more high-intent trials.";
  }

  if (goal === "paid") {
    return "Increase direct paid conversions.";
  }

  if (goal === "educate") {
    return "Improve comprehension for complex buying journeys.";
  }

  return "Increase qualified demo requests.";
}

function formatProfileContext() {
  return getProfile().then((result) => {
    if (!result.ok) {
      return "";
    }

    const profile = result.data;
    const objections = profile.keyObjections
      .map((item) => item.value.trim())
      .filter((item) => item.length > 0)
      .slice(0, 6)
      .join(", ");

    const lines = [
      profile.icpRole.trim() ? `ICP role: ${profile.icpRole.trim()}` : "",
      profile.pricingModel.trim()
        ? `Pricing model: ${profile.pricingModel.trim()}`
        : "",
      `Primary goal: ${formatGoal(profile.conversionGoal)}`,
      objections ? `Key objections: ${objections}` : "",
      profile.primaryPain.trim()
        ? `Primary pain: ${profile.primaryPain.trim()}`
        : "",
    ].filter((line) => line.length > 0);

    if (lines.length === 0) {
      return "";
    }

    return `Business context:\n${lines.map((line) => `- ${line}`).join("\n")}`;
  });
}

function buildSystemPrompt(type: RewriteGenerateRequestValues["rewriteType"]) {
  const scope =
    type === "homepage"
      ? "homepage messaging and structure"
      : "pricing page messaging and plan framing";

  return [
    "You are a senior SaaS conversion copy strategist.",
    `Task scope: ${scope}.`,
    "Return markdown only.",
    "Be concrete, specific, and actionable.",
    "Output sections:",
    "1) Strategy summary",
    "2) Proposed rewrite",
    "3) Rationale linked to conversion outcomes",
    "4) Implementation checklist",
  ].join("\n");
}

function buildUserPrompt(input: RewriteGenerateRequestValues, context: string) {
  const sourceType = input.content ? "Pasted content provided." : "No pasted content.";
  const url = input.websiteUrl ? `Website URL: ${input.websiteUrl}` : "Website URL: not provided";
  const notes = input.notes ? `Notes: ${input.notes}` : "Notes: none";
  const content = input.content ? `Content:\n${input.content}` : "";

  return [url, sourceType, notes, context, content].filter(Boolean).join("\n\n");
}

export async function buildRewriteOpenAIRequest(
  input: RewriteGenerateRequestValues,
): Promise<OpenAIRequest> {
  const context = await formatProfileContext();

  return {
    model: "gpt-4o-mini",
    temperature: 0.35,
    maxTokens: 1800,
    messages: [
      { role: "system", content: buildSystemPrompt(input.rewriteType) },
      { role: "user", content: buildUserPrompt(input, context) },
    ],
  };
}

