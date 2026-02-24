import { logger } from "@/lib/logger";
import {
  renderSnapshotHtml,
} from "@/features/free-snapshot/pdf/renderSnapshotHtml";
import type { SnapshotPdfProps } from "@/features/free-snapshot/pdf/SnapshotPdfTemplate";
import type { ConversionGapReport } from "@/features/reports/types/report.types";
import { CANONICAL_SCORING_MODEL_VERSION } from "@/features/conversion-gap/services/scoringModelRegistry";
import { CANONICAL_REPORT_SCHEMA_VERSION } from "@/features/reports/contracts/canonicalReportContract";

type PuppeteerBrowser = {
  newPage: () => Promise<{
    setContent: (
      html: string,
      options?: { waitUntil?: "networkidle0" | "load" | "domcontentloaded" },
    ) => Promise<void>;
    pdf: (options: {
      format: "A4";
      printBackground: boolean;
      margin: { top: string; right: string; bottom: string; left: string };
    }) => Promise<Uint8Array | Buffer>;
  }>;
  close: () => Promise<void>;
};

type PuppeteerModule = {
  launch: (options: {
    headless: boolean | "new";
    args: string[];
  }) => Promise<PuppeteerBrowser>;
};

const MAX_CONCURRENT_PDF_GENERATIONS = 2;
const MAX_WAITING_PDF_REQUESTS = 20;
let activePdfGenerations = 0;
const waitQueue: Array<() => void> = [];

async function loadPuppeteer(): Promise<PuppeteerModule> {
  try {
    const loaded = (await (
      Function(
        "return import('puppeteer')",
      )() as Promise<{ default?: PuppeteerModule } & PuppeteerModule>
    )) as { default?: PuppeteerModule } & PuppeteerModule;

    return loaded.default ?? loaded;
  } catch (error) {
    logger.error("Free snapshot PDF failed to load puppeteer.", error, {
      component: "free_snapshot_pdf",
      error_type: "puppeteer_import_failed",
    });
    throw new Error("free_snapshot_pdf_provider_unavailable");
  }
}

async function acquirePdfSlot() {
  if (activePdfGenerations < MAX_CONCURRENT_PDF_GENERATIONS) {
    activePdfGenerations += 1;
    return;
  }

  if (waitQueue.length >= MAX_WAITING_PDF_REQUESTS) {
    throw new Error("free_snapshot_pdf_capacity_exceeded");
  }

  await new Promise<void>((resolve) => {
    waitQueue.push(() => {
      activePdfGenerations += 1;
      resolve();
    });
  });
}

function releasePdfSlot() {
  activePdfGenerations = Math.max(0, activePdfGenerations - 1);
  const next = waitQueue.shift();
  if (next) {
    next();
  }
}

export async function generateSnapshotPdf(
  props: SnapshotPdfProps,
): Promise<Buffer> {
  await acquirePdfSlot();
  const puppeteer = await loadPuppeteer();
  const html = renderSnapshotHtml(props);
  let browser: PuppeteerBrowser | null = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "20mm",
        bottom: "20mm",
        left: "20mm",
      },
    });

    return Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);
  } catch (error) {
    logger.error("Free snapshot PDF generation failed.", error, {
      component: "free_snapshot_pdf",
      error_type: "pdf_generation_failed",
      report_id: props.report.id,
    });
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
    releasePdfSlot();
  }
}

function buildVerificationReport(): ConversionGapReport {
  const verbose = "This snapshot verifies render and PDF generation integrity. ".repeat(
    120,
  );
  const insufficientEvidence =
    "insufficient data: legacy record missing structured evidence for this field.";
  return {
    canonicalSchemaVersion: CANONICAL_REPORT_SCHEMA_VERSION,
    id: "00000000-0000-0000-0000-000000000001",
    company: "verification.optivexiq.com",
    segment: "SaaS",
    status: "completed",
    createdAt: new Date().toISOString(),
    conversionScore: 64,
    funnelRisk: 52,
    winRateDelta: 8,
    pipelineAtRisk: 0,
    differentiationScore: 61,
    pricingScore: 58,
    clarityScore: 67,
    confidenceScore: 60,
    threatLevel: "medium",
    scoringModelVersion: CANONICAL_SCORING_MODEL_VERSION,
    scoringBreakdown: {
      clarity: 67,
      differentiation: 61,
      objectionCoverage: 42,
      competitiveOverlap: 0,
      pricingExposure: 42,
      weightedScore: 64,
      revenueRiskSignal: 36,
      competitiveThreatSignal: 39,
    },
    executiveNarrative: verbose,
    executiveSummary: verbose,
    diagnosis: {
      summary: verbose,
      primaryGap: "Message-value mismatch",
      primaryRisk: "High overlap with competitor claims compresses perceived differentiation.",
      primaryOpportunity: "Clarify ICP-specific outcomes and support each claim with proof.",
    },
    messagingOverlap: {
      items: [],
      insight: "Overlap risk requires tighter differentiation.",
      ctaLabel: "Upgrade for full overlap analysis",
    },
    objectionCoverage: {
      score: 42,
      identified: [
        {
          objection: "Trust",
          severity: "medium",
          evidence: "Social proof and validation are limited.",
        },
      ],
      missing: [],
      risks: ["Trust"],
      guidance: [
        {
          objection: "Trust",
          recommendedStrategy: "Add stronger proof points and case evidence.",
        },
      ],
      dimensionScores: { trust: 42 },
    },
    differentiationInsights: {
      similarityScore: 61,
      overlapAreas: ["insufficient data"],
      opportunities: [
        {
          theme: "insufficient data",
          rationale: "insufficient data",
          implementationDifficulty: "medium",
          expectedImpact: "low",
        },
      ],
      strategyRecommendations: ["insufficient data"],
      parityRisks: ["insufficient data"],
      strategicNarrativeDifferences: [
        {
          difference: "insufficient data",
          evidence: [{ competitor: "insufficient data", snippet: insufficientEvidence }],
          confidence: 0,
          actionPriority: "P2",
        },
      ],
      underservedPositioningTerritories: [
        {
          territory: "insufficient data",
          rationale: "insufficient data",
          evidence: [{ competitor: "insufficient data", snippet: insufficientEvidence }],
          confidence: 0,
          actionPriority: "P2",
        },
      ],
      credibleDifferentiationAxes: [
        {
          axis: "insufficient data",
          rationale: "insufficient data",
          evidence: [{ competitor: "insufficient data", snippet: insufficientEvidence }],
          confidence: 0,
          actionPriority: "P2",
        },
      ],
      marketPerceptionRisks: [
        {
          risk: "insufficient data",
          whyItMatters: "insufficient data",
          evidence: [{ competitor: "insufficient data", snippet: insufficientEvidence }],
          confidence: 0,
          actionPriority: "P2",
        },
      ],
      recommendedPositioningDirection: {
        direction: "insufficient data",
        rationale: "insufficient data",
        supportingEvidence: [{ competitor: "insufficient data", snippet: insufficientEvidence }],
        confidence: 0,
        actionPriority: "P2",
      },
    },
    competitiveInsights: [
      {
        claim: "Verification report includes evidence-backed competitive insight structure.",
        evidence: [
          {
            competitor: "verification-signal",
            snippet:
              "Overlap risk requires tighter differentiation and stronger proof-led positioning.",
          },
        ],
        reasoning:
          "Synthetic verification payload validates rendering of competitive insight evidence fields.",
        confidence: 0.5,
        actionPriority: "P2",
      },
    ],
    competitor_synthesis: {
      coreDifferentiationTension: "insufficient data",
      messagingOverlapRisk: { level: "moderate", explanation: "insufficient data" },
      substitutionRiskNarrative: "insufficient data",
      counterPositioningVector: "insufficient data",
      pricingDefenseNarrative: "insufficient data",
    },
    competitiveMatrix: { profileMatrix: [], competitorRows: [], differentiators: [], counters: [] },
    positioningMap: {},
    rewrites: {},
    rewriteRecommendations: [
      {
        title: "Clarify headline",
        slug: "clarify-headline",
        category: "Messaging",
        metric: "CTR lift",
        copy: verbose,
        iconName: "default",
      },
      {
        title: "Add objection proof",
        slug: "add-proof",
        category: "Trust",
        metric: "Conversion lift",
        copy: verbose,
        iconName: "trust",
      },
      {
        title: "Strengthen pricing anchor",
        slug: "pricing-anchor",
        category: "Pricing",
        metric: "Pipeline protection",
        copy: verbose,
        iconName: "pricing",
      },
    ],
    revenueImpact: {
      pipelineAtRisk: 120000,
      estimatedLiftPercent: 14,
      modeledWinRateDelta: 6,
      projectedPipelineRecovery: 16800,
    },
    revenueProjection: {
      estimatedLiftPercent: 14,
      modeledWinRateDelta: 6,
      projectedPipelineRecovery: 16800,
    },
    priorityIssues: [
      {
        issue: "Message-value mismatch",
        impactScore: 88,
        effortEstimate: 34,
        priorityScore: 77,
        tier: "Critical",
      },
      {
        issue: "Objection handling gap",
        impactScore: 79,
        effortEstimate: 40,
        priorityScore: 69,
        tier: "High",
      },
      {
        issue: "Pricing clarity drift",
        impactScore: 68,
        effortEstimate: 38,
        priorityScore: 61,
        tier: "Medium",
      },
    ],
    priorityIndex: [],
  };
}

export async function verifySnapshotPdfPipelineReady(): Promise<{
  isReady: boolean;
  sizeBytes: number;
  error?: string;
}> {
  try {
    const report = buildVerificationReport();
    const pdf = await generateSnapshotPdf({
      report,
      brand: {
        logoUrl: "https://optivexiq.com/logo.png",
        primaryColor: "#0f172a",
        accentColor: "#0ea5e9",
      },
      generatedAt: new Date().toISOString(),
    });

    const sizeBytes = pdf.byteLength;
    const isReady = sizeBytes > 10 * 1024;
    if (!isReady) {
      logger.error("Free snapshot PDF readiness size check failed.", undefined, {
        size_bytes: sizeBytes,
        threshold_bytes: 10 * 1024,
      });
    }

    return { isReady, sizeBytes };
  } catch (error) {
    logger.error("Free snapshot PDF readiness verification failed.", error, {
      component: "free_snapshot_pdf",
      error_type: "readiness_check_failed",
    });
    return {
      isReady: false,
      sizeBytes: 0,
      error:
        error instanceof Error ? error.message : "free_snapshot_pdf_readiness_failed",
    };
  }
}
