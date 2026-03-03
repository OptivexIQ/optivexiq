import { runEmbeddings } from "@/features/ai/client/openaiClient";
import type { CompetitorInsight } from "@/features/conversion-gap/types/gap.types";
import type { HeroOutput, PricingOutput, GapAnalysisOutput } from "@/features/conversion-gap/types/gap.types";
import type { SaasProfileFormValues } from "@/features/saas-profile/types/profile.types";

export const CANONICAL_TAXONOMY_VERSION = "v1.0";
const WHITE_SPACE_EMBEDDING_DISTANCE_MIN = Number.parseFloat(
  process.env.WHITE_SPACE_EMBEDDING_DISTANCE_MIN ?? "0.25",
);

export type CompetitiveTaxonomy = {
  competitor: string;
  valuePropositions: string[];
  targetSegments: string[];
  primaryClaims: string[];
  differentiationSignals: string[];
  pricingSignals: string[];
};

export type OverlapByCompetitor = {
  competitor: string;
  messaging_overlap: number;
  positioning_overlap: number;
  pricing_overlap: number;
  aggregate_overlap: number;
  signal_density: number;
};

export type DimensionalOverlap = {
  messaging_overlap: number;
  positioning_overlap: number;
  pricing_overlap: number;
  aggregate_overlap: number;
};

export type WhiteSpaceOpportunity = {
  claim: string;
  dimension: "messaging" | "positioning" | "pricing";
  missingAcross: number;
  evidence: string[];
  whitespaceConfidenceScore: number;
  supportingCompetitorIds: string[];
  embeddingDistance: number;
  claimSpecificityScore: number;
};

export type TaxonomyOverlapResult = {
  companyTaxonomy: CompetitiveTaxonomy;
  competitorTaxonomies: CompetitiveTaxonomy[];
  overlapByCompetitor: OverlapByCompetitor[];
  dimensionalOverlap: DimensionalOverlap;
  overlapDensity: number;
  whiteSpaceOpportunities: WhiteSpaceOpportunity[];
  referencedTaxonomyIds: string[];
  referencedOverlapDimensionIds: Array<
    "messaging_overlap" | "positioning_overlap" | "pricing_overlap" | "aggregate_overlap"
  >;
  whiteSpaceRulesApplied: string[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    model: string;
  };
};

function normalizeItems(values: string[], maxItems = 8): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const value = raw.trim().replace(/\s+/g, " ");
    if (value.length < 3) {
      continue;
    }
    const key = value.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(value.slice(0, 220));
    if (out.length >= maxItems) {
      break;
    }
  }
  return out;
}

function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length && i < b.length; i += 1) {
    sum += a[i] * b[i];
  }
  return sum;
}

function magnitude(v: number[]): number {
  return Math.sqrt(dot(v, v));
}

function cosineSimilarity(a: number[], b: number[]): number {
  const denom = magnitude(a) * magnitude(b);
  if (!Number.isFinite(denom) || denom <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(1, dot(a, b) / denom));
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

function computeClaimSpecificityScore(claim: string): number {
  const words = claim.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return 0;
  }
  const longWords = words.filter((word) => word.length >= 7).length;
  const numericTokens = words.filter((word) => /\d/.test(word)).length;
  const ratio = longWords / words.length;
  return clampScore(Math.min(100, ratio * 85 + numericTokens * 8));
}

function buildCompanyTaxonomy(input: {
  profile: SaasProfileFormValues;
  homepageAnalysis: HeroOutput;
  pricingAnalysis: PricingOutput;
  gapAnalysis: GapAnalysisOutput;
}): CompetitiveTaxonomy {
  const profile = input.profile;
  const matrixDifferentiators = profile.differentiationMatrix
    .map((item) => item.ourAdvantage.trim())
    .filter((value) => value.length > 0);

  return {
    competitor: "you",
    valuePropositions: normalizeItems([
      input.homepageAnalysis.headline,
      input.homepageAnalysis.subheadline,
      ...input.gapAnalysis.opportunities,
    ]),
    targetSegments: normalizeItems([
      profile.icpRole,
      profile.salesMotion,
      profile.revenueStage,
      profile.pricingModel,
    ]),
    primaryClaims: normalizeItems([
      input.homepageAnalysis.headline,
      input.homepageAnalysis.primaryCta,
      ...input.gapAnalysis.gaps,
    ]),
    differentiationSignals: normalizeItems([
      ...matrixDifferentiators,
      ...profile.proofPoints.map((item: { value: string }) => item.value),
      ...input.gapAnalysis.differentiationGaps,
    ]),
    pricingSignals: normalizeItems([
      input.pricingAnalysis.valueMetric,
      input.pricingAnalysis.anchor,
      ...input.pricingAnalysis.packagingNotes,
    ]),
  };
}

function buildCompetitorTaxonomies(competitors: CompetitorInsight[]): CompetitiveTaxonomy[] {
  return competitors.map((competitor) => {
    const extraction = competitor.extraction;
    return {
      competitor: competitor.name,
      valuePropositions: normalizeItems(extraction?.coreValuePropositions ?? []),
      targetSegments: normalizeItems(extraction?.targetAudienceCues ?? []),
      primaryClaims: normalizeItems(extraction?.positioningClaims ?? []),
      differentiationSignals: normalizeItems([
        ...(extraction?.differentiators ?? []),
        ...(extraction?.proofElements ?? []),
      ]),
      pricingSignals: normalizeItems(extraction?.pricingSignals ?? []),
    };
  });
}

function directionalSimilarity(
  left: string[],
  right: string[],
  vectors: Map<string, number[]>,
): number {
  if (left.length === 0 || right.length === 0) {
    return 0;
  }
  const scores = left.map((item) => {
    const a = vectors.get(item);
    if (!a) {
      return 0;
    }
    let best = 0;
    for (const candidate of right) {
      const b = vectors.get(candidate);
      if (!b) {
        continue;
      }
      const score = cosineSimilarity(a, b);
      if (score > best) {
        best = score;
      }
    }
    return best;
  });
  return scores.length > 0
    ? scores.reduce((sum, value) => sum + value, 0) / scores.length
    : 0;
}

function dimensionScore(
  left: string[],
  right: string[],
  vectors: Map<string, number[]>,
): { score: number; density: number } {
  if (left.length === 0 || right.length === 0) {
    return { score: 0, density: 0 };
  }
  const l2r = directionalSimilarity(left, right, vectors);
  const r2l = directionalSimilarity(right, left, vectors);
  const semantic = (l2r + r2l) / 2;
  const density = Math.min(1, (left.length + right.length) / 12);
  const score = clampScore(semantic * (0.7 + 0.3 * density) * 100);
  return { score, density };
}

export async function scoreTaxonomyOverlap(input: {
  profile: SaasProfileFormValues;
  homepageAnalysis: HeroOutput;
  pricingAnalysis: PricingOutput;
  gapAnalysis: GapAnalysisOutput;
  competitors: CompetitorInsight[];
}): Promise<TaxonomyOverlapResult> {
  const companyTaxonomy = buildCompanyTaxonomy(input);
  const competitorTaxonomies = buildCompetitorTaxonomies(input.competitors);

  const textPool = normalizeItems([
    ...companyTaxonomy.valuePropositions,
    ...companyTaxonomy.targetSegments,
    ...companyTaxonomy.primaryClaims,
    ...companyTaxonomy.differentiationSignals,
    ...companyTaxonomy.pricingSignals,
    ...competitorTaxonomies.flatMap((item) => [
      ...item.valuePropositions,
      ...item.targetSegments,
      ...item.primaryClaims,
      ...item.differentiationSignals,
      ...item.pricingSignals,
    ]),
  ], 400);

  const embedding = await runEmbeddings({
    model: "text-embedding-3-small",
    input: textPool,
  });
  const vectors = new Map<string, number[]>();
  textPool.forEach((text, index) => {
    const vector = embedding.embeddings[index];
    if (vector) {
      vectors.set(text, vector);
    }
  });

  const overlapByCompetitor: OverlapByCompetitor[] = competitorTaxonomies.map((competitor) => {
    const messaging = dimensionScore(
      [...companyTaxonomy.valuePropositions, ...companyTaxonomy.primaryClaims],
      [...competitor.valuePropositions, ...competitor.primaryClaims],
      vectors,
    );
    const positioning = dimensionScore(
      [...companyTaxonomy.targetSegments, ...companyTaxonomy.differentiationSignals],
      [...competitor.targetSegments, ...competitor.differentiationSignals],
      vectors,
    );
    const pricing = dimensionScore(
      companyTaxonomy.pricingSignals,
      competitor.pricingSignals,
      vectors,
    );
    const aggregate = clampScore(
      messaging.score * 0.45 + positioning.score * 0.35 + pricing.score * 0.2,
    );
    const signalDensity = clampScore(
      ((messaging.density + positioning.density + pricing.density) / 3) * 100,
    );
    return {
      competitor: competitor.competitor,
      messaging_overlap: messaging.score,
      positioning_overlap: positioning.score,
      pricing_overlap: pricing.score,
      aggregate_overlap: aggregate,
      signal_density: signalDensity,
    };
  });

  const dimensions = overlapByCompetitor.length > 0
    ? {
        messaging_overlap:
          overlapByCompetitor.reduce((sum, item) => sum + item.messaging_overlap, 0) /
          overlapByCompetitor.length,
        positioning_overlap:
          overlapByCompetitor.reduce((sum, item) => sum + item.positioning_overlap, 0) /
          overlapByCompetitor.length,
        pricing_overlap:
          overlapByCompetitor.reduce((sum, item) => sum + item.pricing_overlap, 0) /
          overlapByCompetitor.length,
        aggregate_overlap:
          overlapByCompetitor.reduce((sum, item) => sum + item.aggregate_overlap, 0) /
          overlapByCompetitor.length,
      }
    : {
        messaging_overlap: 0,
        positioning_overlap: 0,
        pricing_overlap: 0,
        aggregate_overlap: 0,
      };

  const whiteSpaceCandidates: Array<{
    claim: string;
    dimension: "messaging" | "positioning" | "pricing";
    baseline: string[];
  }> = [
    ...companyTaxonomy.valuePropositions.map((claim) => ({
      claim,
      dimension: "messaging" as const,
      baseline: companyTaxonomy.valuePropositions,
    })),
    ...companyTaxonomy.differentiationSignals.map((claim) => ({
      claim,
      dimension: "positioning" as const,
      baseline: companyTaxonomy.differentiationSignals,
    })),
    ...companyTaxonomy.pricingSignals.map((claim) => ({
      claim,
      dimension: "pricing" as const,
      baseline: companyTaxonomy.pricingSignals,
    })),
  ];

  const whiteSpaceOpportunities: WhiteSpaceOpportunity[] = [];
  for (const candidate of whiteSpaceCandidates) {
    const claimVector = vectors.get(candidate.claim);
    if (!claimVector) {
      continue;
    }
    let missingAcross = 0;
    const absentCompetitors: string[] = [];
    for (const competitor of competitorTaxonomies) {
      const pool =
        candidate.dimension === "messaging"
          ? [...competitor.valuePropositions, ...competitor.primaryClaims]
          : candidate.dimension === "positioning"
            ? [...competitor.targetSegments, ...competitor.differentiationSignals]
            : competitor.pricingSignals;

      let best = 0;
      for (const phrase of pool) {
        const vector = vectors.get(phrase);
        if (!vector) {
          continue;
        }
        const score = cosineSimilarity(claimVector, vector);
        if (score > best) {
          best = score;
        }
      }
      if (best < 0.72) {
        missingAcross += 1;
        absentCompetitors.push(competitor.competitor);
      }
    }
    const claimSpecificityScore = computeClaimSpecificityScore(candidate.claim);
    const embeddingDistance = clampScore((1 - Math.max(0, Math.min(1, 1 - missingAcross * 0.2))) * 100) / 100;
    const whitespaceConfidenceScore = clampScore(
      (missingAcross / Math.max(2, competitorTaxonomies.length)) * 55 +
        claimSpecificityScore * 0.25 +
        (1 - embeddingDistance) * 20,
    );
    if (
      missingAcross >= 2 &&
      claimSpecificityScore >= 35 &&
      embeddingDistance >=
        (Number.isFinite(WHITE_SPACE_EMBEDDING_DISTANCE_MIN)
          ? WHITE_SPACE_EMBEDDING_DISTANCE_MIN
          : 0.25)
    ) {
      whiteSpaceOpportunities.push({
        claim: candidate.claim,
        dimension: candidate.dimension,
        missingAcross,
        evidence: absentCompetitors.slice(0, 3),
        whitespaceConfidenceScore,
        supportingCompetitorIds: absentCompetitors,
        embeddingDistance,
        claimSpecificityScore,
      });
    }
  }

  const dedupedWhiteSpace = whiteSpaceOpportunities
    .sort((a, b) => b.missingAcross - a.missingAcross)
    .filter(
      (item, index, arr) =>
        arr.findIndex(
          (candidate) =>
            candidate.claim.toLowerCase() === item.claim.toLowerCase() &&
            candidate.dimension === item.dimension,
        ) === index,
    )
    .slice(0, 6);

  return {
    companyTaxonomy,
    competitorTaxonomies,
    overlapByCompetitor,
    dimensionalOverlap: {
      messaging_overlap: clampScore(dimensions.messaging_overlap),
      positioning_overlap: clampScore(dimensions.positioning_overlap),
      pricing_overlap: clampScore(dimensions.pricing_overlap),
      aggregate_overlap: clampScore(dimensions.aggregate_overlap),
    },
    overlapDensity: clampScore(
      overlapByCompetitor.length > 0
        ? overlapByCompetitor.reduce((sum, item) => sum + item.signal_density, 0) /
            overlapByCompetitor.length
        : 0,
    ),
    whiteSpaceOpportunities: dedupedWhiteSpace,
    referencedTaxonomyIds: [
      "companyTaxonomy.valuePropositions",
      "companyTaxonomy.primaryClaims",
      "companyTaxonomy.targetSegments",
      "companyTaxonomy.differentiationSignals",
      "companyTaxonomy.pricingSignals",
    ],
    referencedOverlapDimensionIds: [
      "messaging_overlap",
      "positioning_overlap",
      "pricing_overlap",
      "aggregate_overlap",
    ],
    whiteSpaceRulesApplied: [
      "missingAcross>=2",
      "embeddingSimilarity<0.72",
      `embeddingDistance>=${Number.isFinite(WHITE_SPACE_EMBEDDING_DISTANCE_MIN) ? WHITE_SPACE_EMBEDDING_DISTANCE_MIN : 0.25}`,
      "claimSpecificityScore>=35",
    ],
    usage: {
      promptTokens: embedding.promptTokens,
      completionTokens: 0,
      totalTokens: embedding.totalTokens,
      model: embedding.model,
    },
  };
}
