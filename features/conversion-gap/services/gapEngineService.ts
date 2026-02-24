import type {
  CompetitorInsight,
  ExtractedPageContent,
  GapAnalysisOutput,
  HeroOutput,
  PricingOutput,
  ObjectionOutput,
  DifferentiationOutput,
  CompetitiveCounterOutput,
} from "@/features/conversion-gap/types/gap.types";
import type { SaasProfileFormValues } from "@/features/saas-profile/types/profile.types";
import type { BillingCurrency } from "@/features/billing/types/billing.types";
import { gapAnalysisModule } from "@/features/conversion-gap/prompts/modules/gapAnalysisModule";
import { heroModule } from "@/features/conversion-gap/prompts/modules/heroModule";
import { pricingModule } from "@/features/conversion-gap/prompts/modules/pricingModule";
import { objectionModule } from "@/features/conversion-gap/prompts/modules/objectionModule";
import { differentiationModule } from "@/features/conversion-gap/prompts/modules/differentiationModule";
import { competitiveCounterModule } from "@/features/conversion-gap/prompts/modules/competitiveCounterModule";
import { buildPromptProfileContext } from "@/features/conversion-gap/prompts/saasProfileContext";
import {
  competitiveCounterOutputSchema,
  differentiationOutputSchema,
  gapAnalysisOutputSchema,
  heroOutputSchema,
  objectionOutputSchema,
  pricingOutputSchema,
} from "@/features/conversion-gap/validators/gapModuleOutputSchemas";
import {
  runValidatedModule,
  type ModuleUsage,
} from "@/features/conversion-gap/services/moduleRuntimeService";
import { synthesizeCompetitorIntelligence } from "@/features/conversion-gap/services/competitorSynthesisService";
import { scrapePage } from "@/features/conversion-gap/scraping/scraper";
import { extractContent } from "@/features/conversion-gap/scraping/contentExtractor";
import {
  buildUsageTotals,
  type UsageTotals,
} from "@/features/usage/services/usageTotals";
import { logger } from "@/lib/logger";
import {
  runObjectionAnalysisModule,
  type ObjectionAnalysisOutput,
} from "@/features/objection-engine/ai/objectionAnalysisModule";
import { runDifferentiationBuilder } from "@/features/differentiation-builder/services/differentiationBuilderService";
import {
  AI_INPUT_TOKEN_RATE_CENTS,
  AI_OUTPUT_TOKEN_RATE_CENTS,
} from "@/lib/constants/limits";

export type UsageSummary = ModuleUsage & {
  costCents: number;
  usageTotals: UsageTotals;
};

export function estimateCostCents(inputTokens: number, outputTokens: number) {
  return Math.round(
    inputTokens * AI_INPUT_TOKEN_RATE_CENTS +
      outputTokens * AI_OUTPUT_TOKEN_RATE_CENTS,
  );
}

export type GapEngineContext = {
  profile: SaasProfileFormValues;
  currency?: BillingCurrency;
  companyContent: ExtractedPageContent;
  pricingContent: ExtractedPageContent | null;
  competitors: CompetitorInsight[];
  includeAdvancedIntelligence?: boolean;
};

export type GapEngineResults = {
  gapAnalysis: GapAnalysisOutput;
  hero: HeroOutput;
  pricing: PricingOutput;
  objections: ObjectionOutput;
  differentiation: DifferentiationOutput;
  competitiveCounter: CompetitiveCounterOutput;
  competitorSynthesis: Awaited<
    ReturnType<typeof synthesizeCompetitorIntelligence>
  >["data"];
  objectionAnalysis: ObjectionAnalysisOutput | null;
  differentiationInsights: Awaited<
    ReturnType<typeof runDifferentiationBuilder>
  >["data"] | null;
};

export function deriveCompetitorUrls(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item : String(item)))
    .filter((item) => item.length > 0);
}

export async function scrapeAndExtract(
  url: string,
): Promise<ExtractedPageContent> {
  const html = await scrapePage(url);
  const extracted = extractContent(html, url);

  return {
    url,
    headline: extracted.headline,
    subheadline: extracted.subheadline,
    pricingTableText: extracted.pricingTableText,
    faqBlocks: extracted.faqBlocks,
    rawText: extracted.rawText,
  };
}

export async function runGapEngine(
  context: GapEngineContext,
): Promise<{ results: GapEngineResults; usage: UsageSummary }> {
  const startedAt = Date.now();
  const promptProfile = buildPromptProfileContext(
    context.profile,
    context.currency ?? "USD",
  );
  const gapAnalysisPrompt = gapAnalysisModule(
    promptProfile,
    context.competitors,
    context.companyContent,
    context.pricingContent,
  );
  const gapAnalysis = await runValidatedModule<GapAnalysisOutput>({
    moduleName: "gapAnalysis",
    schema: gapAnalysisOutputSchema,
    schemaExample: {
      gaps: ["string"],
      opportunities: ["string"],
      risks: ["string"],
      messagingOverlap: ["string"],
      missingObjections: ["string"],
      differentiationGaps: ["string"],
      pricingClarityIssues: ["string"],
    },
    system: gapAnalysisPrompt.system,
    user: gapAnalysisPrompt.user,
  });
  const heroPrompt = heroModule(
    promptProfile,
    context.competitors,
    context.companyContent,
  );
  const hero = await runValidatedModule<HeroOutput>({
    moduleName: "hero",
    schema: heroOutputSchema,
    schemaExample: {
      headline: "string",
      subheadline: "string",
      primaryCta: "string",
      secondaryCta: "string",
    },
    system: heroPrompt.system,
    user: heroPrompt.user,
  });
  const pricingPrompt = pricingModule(
    promptProfile,
    context.competitors,
    context.pricingContent,
  );
  const pricing = await runValidatedModule<PricingOutput>({
    moduleName: "pricing",
    schema: pricingOutputSchema,
    schemaExample: {
      valueMetric: "string",
      anchor: "string",
      packagingNotes: ["string"],
    },
    system: pricingPrompt.system,
    user: pricingPrompt.user,
  });
  const objectionPrompt = objectionModule(
    promptProfile,
    context.competitors,
    context.companyContent,
  );
  const objections = await runValidatedModule<ObjectionOutput>({
    moduleName: "objections",
    schema: objectionOutputSchema,
    schemaExample: {
      objections: [{ objection: "string", response: "string" }],
    },
    system: objectionPrompt.system,
    user: objectionPrompt.user,
  });
  const differentiationPrompt = differentiationModule(
    promptProfile,
    context.competitors,
    context.companyContent,
  );
  const differentiation = await runValidatedModule<DifferentiationOutput>({
    moduleName: "differentiation",
    schema: differentiationOutputSchema,
    schemaExample: {
      differentiators: [{ claim: "string", proof: "string" }],
    },
    system: differentiationPrompt.system,
    user: differentiationPrompt.user,
  });
  const competitiveCounterPrompt = competitiveCounterModule(
    promptProfile,
    context.competitors,
    context.companyContent,
  );
  const competitiveCounter = await runValidatedModule<CompetitiveCounterOutput>(
    {
      moduleName: "competitiveCounter",
      schema: competitiveCounterOutputSchema,
      schemaExample: {
        counters: [{ competitor: "string", counter: "string" }],
      },
      system: competitiveCounterPrompt.system,
      user: competitiveCounterPrompt.user,
    },
  );
  const competitorSynthesis = await synthesizeCompetitorIntelligence({
    profile: context.profile,
    homepageContent: context.companyContent,
    pricingContent: context.pricingContent,
    competitorContents: context.competitors
      .map((item) => item.extracted)
      .filter((item): item is ExtractedPageContent =>
        Boolean(item && typeof item === "object"),
      ),
    gapAnalysis: gapAnalysis.data,
    homepageAnalysis: hero.data,
    pricingAnalysis: pricing.data,
  });
  const includeAdvancedIntelligence = context.includeAdvancedIntelligence === true;
  const advancedIntelligence = includeAdvancedIntelligence
    ? await Promise.all([
        runObjectionAnalysisModule({
          profile: context.profile,
          companyContent: context.companyContent,
          pricingContent: context.pricingContent,
          competitors: context.competitors,
          gapAnalysis: gapAnalysis.data,
          pricingContext: pricing.data,
        }),
        runDifferentiationBuilder({
          profile: context.profile,
          companyContent: context.companyContent,
          pricingContent: context.pricingContent,
          competitors: context.competitors,
          gapAnalysis: gapAnalysis.data,
        }),
      ])
    : null;

  const usageTotals = buildUsageTotals([
    { name: "gapAnalysis", usage: gapAnalysis.usage },
    { name: "hero", usage: hero.usage },
    { name: "pricing", usage: pricing.usage },
    { name: "objections", usage: objections.usage },
    { name: "differentiation", usage: differentiation.usage },
    { name: "competitiveCounter", usage: competitiveCounter.usage },
    { name: "competitorSynthesis", usage: competitorSynthesis.usage },
    ...(advancedIntelligence
      ? [
          { name: "objectionAnalysis", usage: advancedIntelligence[0].usage },
          { name: "differentiationBuilder", usage: advancedIntelligence[1].usage },
        ]
      : []),
  ]);

  const promptTokens = usageTotals.promptTokens;
  const completionTokens = usageTotals.completionTokens;
  const totalTokens = usageTotals.totalTokens;

  logger.info("Gap engine usage totals computed.", {
    module: "gapEngine",
    total_tokens: totalTokens,
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    estimated_cost_cents: usageTotals.estimatedCostCents,
    execution_ms: Date.now() - startedAt,
    modules: usageTotals.modules.map((item) => ({
      name: item.name,
      model: item.model,
      tokens: item.totalTokens,
      prompt_tokens: item.promptTokens,
      completion_tokens: item.completionTokens,
      estimated_cost_cents: item.estimatedCostCents,
    })),
  });

  return {
    results: {
      gapAnalysis: gapAnalysis.data,
      hero: hero.data,
      pricing: pricing.data,
      objections: objections.data,
      differentiation: differentiation.data,
      competitiveCounter: competitiveCounter.data,
      competitorSynthesis: competitorSynthesis.data,
      objectionAnalysis: advancedIntelligence ? advancedIntelligence[0].data : null,
      differentiationInsights: advancedIntelligence ? advancedIntelligence[1].data : null,
    },
    usage: {
      promptTokens,
      completionTokens,
      totalTokens,
      model: "gpt-4o-mini",
      costCents: usageTotals.estimatedCostCents,
      usageTotals,
    },
  };
}
