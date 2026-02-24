import type {
  CompetitorInsight,
  ExtractedPageContent,
  GapAnalysisOutput,
  PricingOutput,
} from "@/features/conversion-gap/types/gap.types";
import type { SaasProfileFormValues } from "@/features/saas-profile/types/profile.types";

export type ObjectionSeverity = "low" | "medium" | "high" | "critical";

export type IdentifiedObjection = {
  objection: string;
  severity: ObjectionSeverity;
  evidence: string;
};

export type MissingObjection = {
  objection: string;
  severity: ObjectionSeverity;
  impact: string;
};

export type MitigationGuidanceItem = {
  objection: string;
  recommendedStrategy: string;
};

export type ObjectionEngineOutput = {
  identifiedObjections: IdentifiedObjection[];
  missingObjections: MissingObjection[];
  objectionCoverageScore: number;
  criticalRisks: string[];
  mitigationGuidance: MitigationGuidanceItem[];
  quickWins: string[];
  enterpriseRisks: string[];
};

export type ObjectionEngineInput = {
  companyContent: ExtractedPageContent;
  pricingContent: ExtractedPageContent | null;
  competitors: CompetitorInsight[];
  profile: SaasProfileFormValues;
  gapAnalysis: GapAnalysisOutput;
  pricingContext?: PricingOutput | null;
};

type ObjectionCatalogItem = {
  key: string;
  label: string;
  keywords: string[];
  enterprise: boolean;
};

const OBJECTION_CATALOG: ObjectionCatalogItem[] = [
  {
    key: "trust-risk",
    label: "Trust risk",
    keywords: ["trust", "proof", "credibility", "testimonial", "case study"],
    enterprise: false,
  },
  {
    key: "cost-concerns",
    label: "Cost concerns",
    keywords: ["price", "pricing", "cost", "budget", "expensive", "roi"],
    enterprise: false,
  },
  {
    key: "implementation-effort",
    label: "Implementation effort",
    keywords: ["setup", "onboarding", "time to value", "migration", "deploy"],
    enterprise: false,
  },
  {
    key: "switching-risk",
    label: "Switching risk",
    keywords: ["switch", "replace", "migration", "downtime", "change management"],
    enterprise: false,
  },
  {
    key: "roi-uncertainty",
    label: "ROI uncertainty",
    keywords: ["roi", "payback", "outcome", "lift", "conversion gain"],
    enterprise: false,
  },
  {
    key: "security-compliance",
    label: "Security and compliance",
    keywords: ["security", "compliance", "soc 2", "iso", "gdpr", "privacy"],
    enterprise: true,
  },
  {
    key: "integration-complexity",
    label: "Integration complexity",
    keywords: ["integration", "api", "sync", "webhook", "crm"],
    enterprise: true,
  },
  {
    key: "vendor-lock-in",
    label: "Vendor lock-in",
    keywords: ["export", "portability", "ownership", "lock-in", "exit"],
    enterprise: true,
  },
  {
    key: "internal-buy-in",
    label: "Internal buy-in difficulty",
    keywords: ["stakeholder", "buy-in", "approval", "procurement", "legal"],
    enterprise: true,
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function severityFromScore(score: number): ObjectionSeverity {
  if (score >= 85) {
    return "critical";
  }
  if (score >= 65) {
    return "high";
  }
  if (score >= 40) {
    return "medium";
  }
  return "low";
}

function normalizedText(value: string) {
  return value.toLowerCase();
}

function firstMatchingEvidence(
  keywords: string[],
  sources: Array<{ label: string; value: string }>,
): string {
  for (const source of sources) {
    const content = normalizedText(source.value);
    for (const keyword of keywords) {
      const idx = content.indexOf(keyword);
      if (idx === -1) {
        continue;
      }

      const start = Math.max(0, idx - 48);
      const end = Math.min(source.value.length, idx + keyword.length + 64);
      const snippet = source.value.slice(start, end).replace(/\s+/g, " ").trim();
      if (snippet.length > 0) {
        return `${source.label}: ${snippet}`;
      }
    }
  }
  return "";
}

function buildContentSources(input: ObjectionEngineInput) {
  const competitorText = input.competitors
    .map((competitor) => {
      const parts: string[] = [];
      if (typeof competitor.summary === "string") {
        parts.push(competitor.summary);
      }
      if (Array.isArray(competitor.strengths)) {
        parts.push(...competitor.strengths);
      }
      if (Array.isArray(competitor.weaknesses)) {
        parts.push(...competitor.weaknesses);
      }
      if (Array.isArray(competitor.positioning)) {
        parts.push(...competitor.positioning);
      }
      return parts.join(" ");
    })
    .join(" ");

  return [
    { label: "homepage", value: input.companyContent.rawText || "" },
    { label: "homepage_faq", value: (input.companyContent.faqBlocks || []).join(" ") },
    { label: "pricing_page", value: input.pricingContent?.rawText || "" },
    { label: "pricing_table", value: input.pricingContent?.pricingTableText || "" },
    { label: "competitor_signals", value: competitorText },
    {
      label: "profile_objections",
      value: input.profile.keyObjections.map((item) => item.value).join(" "),
    },
    {
      label: "gap_signals",
      value: [
        ...input.gapAnalysis.risks,
        ...input.gapAnalysis.missingObjections,
        ...input.gapAnalysis.pricingClarityIssues,
      ].join(" "),
    },
  ];
}

function computeRiskScore(input: {
  item: ObjectionCatalogItem;
  hasEvidence: boolean;
  flaggedMissing: boolean;
  hasRelatedRiskSignal: boolean;
  hasPricingIssue: boolean;
  enterpriseContext: boolean;
}) {
  let score = 20;
  if (!input.hasEvidence) {
    score += 22;
  }
  if (input.flaggedMissing) {
    score += 32;
  }
  if (input.hasRelatedRiskSignal) {
    score += 16;
  }
  if (input.hasPricingIssue && input.item.key === "cost-concerns") {
    score += 14;
  }
  if (input.enterpriseContext && input.item.enterprise) {
    score += 12;
  }
  return clamp(score, 0, 100);
}

function buildMitigation(item: ObjectionCatalogItem): string {
  switch (item.key) {
    case "trust-risk":
      return "Add quantifiable proof near CTA paths: buyer logo strip, 1-2 outcome metrics, and objection-specific testimonial snippets.";
    case "cost-concerns":
      return "Anchor pricing to measurable outcomes with a clear value metric, ROI example, and transparent package boundaries.";
    case "implementation-effort":
      return "Publish implementation path with timeline, onboarding scope, and first-win milestone inside 14 days.";
    case "switching-risk":
      return "Reduce switching anxiety with migration plan, rollback safety, and support coverage language.";
    case "roi-uncertainty":
      return "Use before/after scenarios and payback framing tied to current funnel conversion baselines.";
    case "security-compliance":
      return "Provide security trust center references, compliance posture, and data handling controls in buyer-visible messaging.";
    case "integration-complexity":
      return "List core integrations, API coverage, and realistic deployment patterns by stack.";
    case "vendor-lock-in":
      return "Clarify data portability, export paths, and termination transition support.";
    case "internal-buy-in":
      return "Package internal business case assets: procurement FAQ, stakeholder one-pager, and approval checklist.";
    default:
      return "Address this objection directly with specific proof and risk-reducing detail in primary decision surfaces.";
  }
}

function normalizeMissingSet(input: ObjectionEngineInput) {
  return new Set(
    input.gapAnalysis.missingObjections
      .map((value) => normalizedText(value.trim()))
      .filter((value) => value.length > 0),
  );
}

function hasRelatedRiskSignal(input: ObjectionEngineInput, item: ObjectionCatalogItem) {
  const riskCorpus = normalizedText(
    [...input.gapAnalysis.risks, ...input.gapAnalysis.gaps, ...input.gapAnalysis.opportunities].join(
      " ",
    ),
  );
  return item.keywords.some((keyword) => riskCorpus.includes(normalizedText(keyword)));
}

function isEnterpriseContext(profile: SaasProfileFormValues) {
  const acv = normalizedText(profile.acvRange || "");
  const motion = normalizedText(profile.salesMotion || "");
  const stage = normalizedText(profile.revenueStage || "");
  return (
    acv.includes("enterprise") ||
    acv.includes("50k") ||
    motion.includes("sales-led") ||
    motion.includes("enterprise") ||
    stage.includes("growth") ||
    stage.includes("scale")
  );
}

function hasPricingIssue(input: ObjectionEngineInput) {
  return input.gapAnalysis.pricingClarityIssues.length > 0;
}

export function runObjectionEngine(input: ObjectionEngineInput): ObjectionEngineOutput {
  const sources = buildContentSources(input);
  const missingSet = normalizeMissingSet(input);
  const enterpriseContext = isEnterpriseContext(input.profile);
  const pricingIssue = hasPricingIssue(input);

  const identified: IdentifiedObjection[] = [];
  const missing: MissingObjection[] = [];
  const mitigationGuidance: MitigationGuidanceItem[] = [];

  for (const item of OBJECTION_CATALOG) {
    const evidence = firstMatchingEvidence(item.keywords, sources);
    const hasEvidence = evidence.length > 0;
    const flaggedMissing =
      missingSet.has(item.key) ||
      missingSet.has(normalizedText(item.label)) ||
      item.keywords.some((keyword) => missingSet.has(normalizedText(keyword)));
    const relatedRiskSignal = hasRelatedRiskSignal(input, item);
    const score = computeRiskScore({
      item,
      hasEvidence,
      flaggedMissing,
      hasRelatedRiskSignal: relatedRiskSignal,
      hasPricingIssue: pricingIssue,
      enterpriseContext,
    });
    const severity = severityFromScore(score);

    mitigationGuidance.push({
      objection: item.label,
      recommendedStrategy: buildMitigation(item),
    });

    if (hasEvidence) {
      identified.push({
        objection: item.label,
        severity,
        evidence,
      });
    }

    if (!hasEvidence || flaggedMissing) {
      missing.push({
        objection: item.label,
        severity,
        impact:
          severity === "critical" || severity === "high"
            ? "High late-funnel conversion loss risk if this concern remains unresolved."
            : "Moderate conversion drag expected without stronger objection handling coverage.",
      });
    }
  }

  const missingSeveritySum = missing.reduce((sum, item) => {
    if (item.severity === "critical") {
      return sum + 100;
    }
    if (item.severity === "high") {
      return sum + 75;
    }
    if (item.severity === "medium") {
      return sum + 45;
    }
    return sum + 20;
  }, 0);
  const normalizedPenalty =
    missing.length > 0 ? Math.round(missingSeveritySum / missing.length) : 0;
  const coverageScore = clamp(100 - normalizedPenalty, 0, 100);

  const criticalRisks = missing
    .filter((item) => item.severity === "critical")
    .map((item) => `${item.objection}: ${item.impact}`);

  const quickWins = missing
    .filter((item) => item.severity === "high" || item.severity === "critical")
    .slice(0, 3)
    .map((item) => `Address ${item.objection.toLowerCase()} in homepage and pricing FAQ decision surfaces.`);

  const enterpriseRisks = missing
    .filter((item) => {
      const catalogItem = OBJECTION_CATALOG.find((entry) => entry.label === item.objection);
      return Boolean(catalogItem?.enterprise) && (item.severity === "high" || item.severity === "critical");
    })
    .map((item) => `${item.objection} remains under-addressed for enterprise procurement workflows.`);

  return {
    identifiedObjections: identified,
    missingObjections: missing,
    objectionCoverageScore: coverageScore,
    criticalRisks,
    mitigationGuidance,
    quickWins,
    enterpriseRisks,
  };
}
