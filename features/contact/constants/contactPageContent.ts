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
    body: "Use for product issues, report access, or workflow questions. Requests are routed to customer support for follow-up.",
  },
  {
    title: "Sales / Pricing",
    body: "Use for plan selection, commercial evaluation, and purchasing discussions. We reply with practical next steps.",
  },
  {
    title: "Billing & Account",
    body: "Use for subscriptions, invoices, and account ownership updates. We validate context before responding.",
  },
  {
    title: "Legal & Privacy",
    body: "Use for terms, privacy, and data rights requests. Communications are routed to the appropriate owners.",
  },
  {
    title: "Security Disclosure",
    body: "Use to report potential security concerns. Reports are handled confidentially and acknowledged quickly.",
  },
  {
    title: "General Inquiry",
    body: "Use for partnerships, media, and non-product requests. We route your message to the right contact.",
  },
] as const;

export const CONTACT_RESPONSE_EXPECTATIONS = [
  "Support and billing: typically within 1 business day",
  "Sales and pricing: typically within 1 business day",
  "Legal and privacy: typically within several business days",
  "Security disclosure: rapid acknowledgement",
] as const;

export const CONTACT_CHANNELS = [
  "support@optivexiq.com",
  "sales@optivexiq.com",
  "legal@optivexiq.com",
  "privacy@optivexiq.com",
  "security@optivexiq.com",
] as const;

export const CONTACT_TRUST_SIGNALS = [
  "Requests are handled by humans.",
  "Security reports are treated confidentially.",
  "Communications are logged for continuity.",
  "No automated sales spam after support inquiries.",
] as const;
