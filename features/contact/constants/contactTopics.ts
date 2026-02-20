export const CONTACT_TOPICS = [
  { value: "support", label: "Support" },
  { value: "sales", label: "Sales / Pricing" },
  { value: "billing", label: "Billing & Account" },
  { value: "security", label: "Security Disclosure" },
  { value: "legal", label: "Legal and Privacy" },
  { value: "other", label: "General Inquiry" },
] as const;

export type ContactTopicValue = (typeof CONTACT_TOPICS)[number]["value"];

export const CONTACT_TOPIC_HELPERS: Record<ContactTopicValue, string> = {
  support: "For product issues, report access, or workflow guidance.",
  sales: "For plan selection, pricing, and commercial evaluation questions.",
  billing: "For invoices, subscriptions, and account ownership updates.",
  legal: "For legal requests, policy questions, or privacy rights inquiries.",
  security: "For confidential security reports and vulnerability disclosures.",
  other: "For partnership, media, or general business inquiries.",
};
