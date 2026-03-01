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
    "Rewrite only what the user explicitly provided in source content.",
    "Do not invent new page sections, new offers, new guarantees, new proof blocks, or new CTAs that are not present in source content.",
    "If something important is missing from source content, do not add it to the rewrite.",
    "The rewrite body must remain faithful to source structure and intent while improving clarity and conversion quality.",
    "Formatting requirements:",
    "- The rationale must be a single narrative paragraph.",
    "- Rationale length must be 2-4 sentences and roughly 50-110 words.",
    "- Do not use bullet points or numbering inside the rationale.",
    "- In the Proposed rewrite section, include explicit labeled lines for 'Primary CTA' and 'Final CTA'.",
    "- If source content contains an end-of-page CTA/final CTA, rewrite and include it explicitly under 'Final CTA'.",
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
  const strategicContext = input.strategicContext
    ? [
        "Strategic context:",
        `- Target: ${input.strategicContext.target === "pricing" ? "Pricing" : "Homepage"}`,
        `- Goal: ${input.strategicContext.goal}`,
        `- ICP: ${input.strategicContext.icp}`,
        `- Differentiation focus: ${input.strategicContext.focus.differentiation ? "On" : "Off"}`,
        `- Objection focus: ${input.strategicContext.focus.objection ? "On" : "Off"}`,
      ].join("\n")
    : "";
  const rewriteStrategy = input.rewriteStrategy
    ? [
        "Rewrite strategy:",
        `- Tone: ${input.rewriteStrategy.tone}`,
        `- Length: ${input.rewriteStrategy.length}`,
        `- Emphasis: ${
          input.rewriteStrategy.emphasis.length > 0
            ? input.rewriteStrategy.emphasis.join(", ")
            : "none"
        }`,
        `- Constraints: ${input.rewriteStrategy.constraints?.trim() || "none"}`,
        `- Audience: ${input.rewriteStrategy.audience?.trim() || "not specified"}`,
      ].join("\n")
    : "";
  const content = input.content ? `Content:\n${input.content}` : "";

  return [url, sourceType, notes, strategicContext, rewriteStrategy, context, content]
    .filter(Boolean)
    .join("\n\n");
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
