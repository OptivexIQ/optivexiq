import type { RewriteType } from "@/features/rewrites/types/rewrites.types";

export const REWRITE_SECTION_TAXONOMY_VERSION = "v1.2";
export const REWRITE_SECTION_PROMPT_VERSION = "section-map-v1.2";
export const REWRITE_SECTION_CONFIDENCE_THRESHOLD = 0.75;

export type SectionKey =
  | "hero"
  | "final_cta"
  | "problem_solution"
  | "features"
  | "how_it_works"
  | "product_showcase"
  | "benefits_results"
  | "testimonials_case_studies"
  | "use_cases"
  | "integrations"
  | "pricing"
  | "social_proof"
  | "faq"
  | "other";

export const SECTION_LABELS: Record<SectionKey, string> = {
  hero: "Hero",
  final_cta: "Final CTA",
  problem_solution: "Problem / Solution",
  features: "Features",
  how_it_works: "How It Works",
  product_showcase: "Product Showcase",
  benefits_results: "Benefits / Results",
  testimonials_case_studies: "Testimonials / Case Studies",
  use_cases: "Use Cases",
  integrations: "Integrations",
  pricing: "Pricing",
  social_proof: "Social Proof",
  faq: "FAQ",
  other: "Other",
};

type DeterministicMappedSection = {
  key: SectionKey;
  label: string;
  content: string;
  confidence: number;
};

function normalizeLabelKey(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]+/g, "")
    .replace(/\s+/g, " ");
}

export function fromLabelToKey(value: string): SectionKey | null {
  const key = normalizeLabelKey(value);
  if (key === "hero" || key === "hero section") return "hero";
  if (key === "headline" || key === "subheadline") return "hero";
  if (key === "value proposition") return "problem_solution";
  if (key === "primary cta" || key === "secondary cta") return "hero";
  if (key === "final cta") return "final_cta";
  if (
    key === "problem solution" ||
    key === "problem and solution" ||
    key === "pain points" ||
    key === "pain point"
  ) {
    return "problem_solution";
  }
  if (key === "features") return "features";
  if (key === "how it works") return "how_it_works";
  if (key === "product showcase" || key === "demo" || key === "product demo") {
    return "product_showcase";
  }
  if (
    key === "benefits" ||
    key === "results" ||
    key === "benefits results" ||
    key === "before after"
  ) {
    return "benefits_results";
  }
  if (
    key === "testimonials" ||
    key === "testimonial" ||
    key === "case studies" ||
    key === "case study" ||
    key === "testimonials case studies"
  ) {
    return "testimonials_case_studies";
  }
  if (key === "use cases" || key === "use case") return "use_cases";
  if (key === "integrations" || key === "ecosystem") return "integrations";
  if (key === "pricing") return "pricing";
  if (key === "social proof") return "social_proof";
  if (key === "proof") return "social_proof";
  if (key === "trusted by" || key === "trust badges") return "social_proof";
  if (key === "objections") return "faq";
  if (key === "faq") return "faq";
  if (key === "other") return "other";
  return null;
}

export function parseDeterministicMappedSections(
  content: string,
): DeterministicMappedSection[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  let activeKey: SectionKey | null = null;
  let activeBody: string[] = [];
  const sections: Array<{ key: SectionKey; body: string }> = [];

  const flush = () => {
    if (!activeKey) {
      activeBody = [];
      return;
    }
    const body = activeBody.join("\n").trim();
    if (body.length > 0) {
      sections.push({ key: activeKey, body });
    }
    activeBody = [];
  };

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,6}\s+(.+?)\s*$/);
    if (headingMatch?.[1]) {
      const key = fromLabelToKey(headingMatch[1]);
      if (key) {
        flush();
        activeKey = key;
        continue;
      }
    }

    const labeledMatch = line.match(/^([^:]+):\s*(.*)$/);
    if (labeledMatch?.[1]) {
      const key = fromLabelToKey(labeledMatch[1]);
      if (key) {
        flush();
        activeKey = key;
        const firstLine = labeledMatch[2]?.trim();
        if (firstLine) {
          activeBody.push(firstLine);
        }
        continue;
      }
    }

    if (activeKey) {
      activeBody.push(line);
    }
  }

  flush();

  const merged = new Map<SectionKey, string[]>();
  for (const section of sections) {
    const values = merged.get(section.key) ?? [];
    values.push(section.body);
    merged.set(section.key, values);
  }

  return Array.from(merged.entries()).map(([key, values]) => ({
    key,
    label: SECTION_LABELS[key],
    content: values.join("\n\n").trim(),
    confidence: 1,
  }));
}

export function buildClassifierPrompt(params: {
  rewriteType: RewriteType;
  content: string;
}) {
  return [
    "You are a strict section mapper for SaaS marketing copy.",
    "Map source text into this taxonomy only:",
    "- hero",
    "- final_cta",
    "- problem_solution",
    "- features",
    "- how_it_works",
    "- product_showcase",
    "- benefits_results",
    "- testimonials_case_studies",
    "- use_cases",
    "- integrations",
    "- pricing",
    "- social_proof",
    "- faq",
    "- other",
    "Rules:",
    "- Use only exact source text snippets; do not paraphrase.",
    "- Do not invent sections.",
    "- Preserve contiguous blocks from source; do not fragment one coherent block into multiple sections without explicit cues.",
    "- For unlabeled homepage source, map the opening block (headline + supporting sentence(s) + immediate CTA line) as Hero.",
    "- Treat CTA copy within above-the-fold content as part of Hero unless it is explicitly a dedicated final CTA section near page bottom.",
    "- If classification is ambiguous between Hero and another section, prefer Hero for the opening block.",
    "- If a section cannot be mapped with confidence >= 0.75, use key 'other' when it is still decision-relevant content; otherwise omit it.",
    "- Return JSON only with shape:",
    '{"sections":[{"key":"hero","label":"Hero","content":"...","confidence":0.91}]}',
    `Target: ${params.rewriteType}`,
    "",
    "Source content:",
    params.content,
  ].join("\n");
}
