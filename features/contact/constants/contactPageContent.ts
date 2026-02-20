export const CONTACT_QUICK_LINKS = [
  { href: "/docs", label: "Help Center" },
  { href: "/status", label: "System Status" },
  { href: "/dashboard/billing", label: "Billing (signed-in users)" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

export const CONTACT_OPTIONS = [
  {
    title: "Support",
    body: "Choose this for product issues, report access, or guidance on how to use OptivexIQ effectively.",
  },
  {
    title: "Sales / Pricing",
    body: "Choose this for plan selection, pricing questions, procurement scoping, or commercial evaluation.",
  },
  {
    title: "Billing & Account",
    body: "Choose this for subscriptions, invoices, account ownership changes, or billing access issues.",
  },
  {
    title: "Legal & Privacy",
    body: "Choose this for terms, privacy rights, data handling questions, or legal documentation requests.",
  },
  {
    title: "Security Disclosure",
    body: "Choose this to report potential vulnerabilities or security concerns requiring confidential handling.",
  },
  {
    title: "General Inquiry",
    body: "Choose this for partnership, media, or other requests that do not fit the categories above.",
  },
] as const;

export const CONTACT_RESPONSE_EXPECTATIONS = [
  "Support and billing: typically within 1 business day",
  "Sales and pricing: typically within 1 business day",
  "Legal and privacy: typically several business days",
  "Security reports: rapid acknowledgement with structured follow-up",
] as const;

export const CONTACT_CHANNELS = [
  "support@optivexiq.com",
  "sales@optivexiq.com",
  "legal@optivexiq.com",
  "privacy@optivexiq.com",
  "security@optivexiq.com",
] as const;

export const CONTACT_TRUST_SIGNALS = [
  "Every inquiry is reviewed by a person.",
  "Security disclosures are handled confidentially.",
  "Communications are tracked for continuity and follow-up.",
  "Support requests do not trigger automated sales outreach.",
] as const;
