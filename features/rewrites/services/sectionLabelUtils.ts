const ALLOWED_SECTION_LABELS = [
  "Hero",
  "Headline",
  "Subheadline",
  "Value Proposition",
  "Primary CTA",
  "Secondary CTA",
  "Final CTA",
  "Problem / Solution",
  "Problem Solution",
  "Pain Point",
  "Pain Points",
  "Features",
  "How It Works",
  "Product Showcase",
  "Demo",
  "Product Demo",
  "Benefits / Results",
  "Benefits",
  "Results",
  "Before / After",
  "Testimonials / Case Studies",
  "Testimonials",
  "Testimonial",
  "Case Studies",
  "Case Study",
  "Use Cases",
  "Use Case",
  "Integrations",
  "Ecosystem",
  "Pricing",
  "Social Proof",
  "Proof",
  "Objections",
  "Trusted By",
  "Trust Badges",
  "FAQ",
] as const;

export function getAllowedSectionLabels() {
  return [...ALLOWED_SECTION_LABELS];
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function hasAnyAllowedSectionLabel(content: string) {
  const normalized = content.replace(/\r\n/g, "\n");
  return ALLOWED_SECTION_LABELS.some((label) => {
    const escaped = escapeRegex(label);
    const headingPattern = new RegExp(`^\\s*#{1,6}\\s+${escaped}\\s*$`, "im");
    const labeledPattern = new RegExp(`^\\s*${escaped}\\s*:\\s*.+$`, "im");
    return headingPattern.test(normalized) || labeledPattern.test(normalized);
  });
}

export function buildSectionTemplate() {
  return [
    "Hero Section:",
    "",
    "Problem / Solution:",
    "",
    "Features:",
    "",
    "How It Works:",
    "",
    "Testimonials / Case Studies:",
    "",
    "Pricing:",
    "",
    "FAQ:",
    "",
    "Final CTA:",
    "",
  ].join("\n");
}
