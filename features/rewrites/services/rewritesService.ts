import type { OpenAIRequest } from "@/features/ai/client/openaiClient";
import { getProfile } from "@/features/saas-profile/services/profileService";
import type { RewriteGenerateRequestValues } from "@/features/rewrites/validators/rewritesSchema";

export const REWRITE_PROMPT_VERSION = 2;
export const REWRITE_SYSTEM_TEMPLATE_VERSION = 2;

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
    "Be concrete, specific, and actionable. Keep reasoning concise and user-facing.",
    "Preserve factual truth and business meaning from source content.",
    "Do not fabricate claims, proof, guarantees, legal/compliance statements, or pricing facts.",
    "Apply treatment variables explicitly and keep controlled variables stable.",
    "Avoid close paraphrase. Do not reuse source sentences verbatim. Prefer new framing.",
    "For moderate/strong delta, you may improve CTA wording and section ordering within the same page type.",
    "Do not switch page type (homepage stays homepage, pricing stays pricing).",
    "Do not include hidden chain-of-thought or private reasoning.",
    "Formatting requirements:",
    "- Every required section heading below must be present exactly once.",
    "- Use concise bullet points where requested and plain markdown for rewrite content.",
    "- Include these exact shift lines in Confidence & Risk using strict formats:",
    "  - Clarity Shift: signed percentage (example: +42%)",
    "  - Objection Shift: signed percentage (example: -18%)",
    "  - Positioning Shift: one of Strong | Moderate | Weak | Improving | Needs Work",
    "  - Confidence: percentage between 0% and 100% (example: 84%)",
    "- In Proposed Rewrite, include explicit labeled lines for 'Primary CTA' and 'Final CTA' when present in source content.",
    "- Change Summary must contain section-level changes with what changed and why.",
    "- For minimum_delta_level=moderate or strong, Change Summary must include at least 5 bullets.",
    "- For minimum_delta_level=strong, Change Summary should include 8-10 bullets where feasible.",
    "Output sections:",
    "1) ## Experiment Setup",
    "2) ## Control Summary",
    "3) ## Treatment Plan",
    "4) ## Proposed Rewrite",
    "5) ## Change Summary",
    "6) ## Confidence & Risk",
  ].join("\n");
}

function minimumDeltaInstruction(
  level: RewriteGenerateRequestValues["hypothesis"]["minimumDeltaLevel"],
) {
  if (level === "light") {
    return "Minimum delta enforcement: light. Improve clarity and precision without major structural change.";
  }
  if (level === "strong") {
    return "Minimum delta enforcement: strong. Apply significant reframing and reorder sections as needed while preserving factual truth and page type.";
  }
  return "Minimum delta enforcement: moderate. Rewrite headlines/CTAs and reframe objections/differentiation with meaningful wording changes.";
}

function temperatureForDelta(
  level: RewriteGenerateRequestValues["hypothesis"]["minimumDeltaLevel"],
) {
  if (level === "strong") {
    return 0.65;
  }
  if (level === "moderate") {
    return 0.5;
  }
  return 0.35;
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
  const hypothesis = [
    "Experiment contract:",
    `- Hypothesis type: ${input.hypothesis.type}`,
    `- Controlled variables (must remain stable): ${input.hypothesis.controlledVariables.join(", ")}`,
    `- Treatment variables (must change): ${input.hypothesis.treatmentVariables.join(", ")}`,
    `- Success criteria: ${input.hypothesis.successCriteria}`,
    `- Minimum delta level: ${input.hypothesis.minimumDeltaLevel}`,
    `- ${minimumDeltaInstruction(input.hypothesis.minimumDeltaLevel)}`,
  ].join("\n");
  const content = input.content ? `Content:\n${input.content}` : "";

  return [
    url,
    sourceType,
    notes,
    strategicContext,
    rewriteStrategy,
    hypothesis,
    context,
    content,
    [
      "Execution instructions:",
      "- First output Experiment Setup reflecting the contract above.",
      "- Then output Control Summary (exactly 3 bullets) describing current messaging weaknesses relevant to hypothesis.",
      "- Then output Treatment Plan (exactly 3 bullets) describing what will change and why.",
      "- Then output Proposed Rewrite.",
      "- Then output Change Summary with per-section changes and why.",
      "- Then output Confidence & Risk with confidence and key residual risks.",
    ].join("\n"),
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function buildRewriteOpenAIRequest(
  input: RewriteGenerateRequestValues,
): Promise<OpenAIRequest> {
  const context = await formatProfileContext();
  const temperature = temperatureForDelta(input.hypothesis.minimumDeltaLevel);

  return {
    model: "gpt-4o-mini",
    temperature,
    maxTokens: 1800,
    messages: [
      { role: "system", content: buildSystemPrompt(input.rewriteType) },
      { role: "user", content: buildUserPrompt(input, context) },
    ],
  };
}

export function buildRewriteShiftStatsRepairRequest(params: {
  rewriteType: RewriteGenerateRequestValues["rewriteType"];
  sourceContent?: string | null;
  outputMarkdown: string;
}): OpenAIRequest {
  return {
    model: "gpt-4o-mini",
    temperature: 0.1,
    maxTokens: 180,
    messages: [
      {
        role: "system",
        content: [
          "You validate rewrite output metrics for SaaS copy analysis.",
          "Return ONLY four lines with no markdown heading and no extra text.",
          "Line 1: Clarity Shift: signed percentage (e.g., +42%)",
          "Line 2: Objection Shift: signed percentage (e.g., -18%)",
          "Line 3: Positioning Shift: one of Strong | Moderate | Weak | Improving | Needs Work",
          "Line 4: Confidence: percentage between 0% and 100% (e.g., 84%)",
          "Do not output bullet points, numbering, prose, or explanations.",
        ].join("\n"),
      },
      {
        role: "user",
        content: [
          `Rewrite type: ${params.rewriteType}`,
          params.sourceContent?.trim()
            ? `Source content:\n${params.sourceContent.trim()}`
            : "Source content: not provided",
          `Generated rewrite markdown:\n${params.outputMarkdown}`,
        ].join("\n\n"),
      },
    ],
  };
}
