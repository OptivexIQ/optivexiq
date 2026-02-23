import type {
  CompetitiveMatrix,
  CompetitiveMatrixCompetitorRow,
  CompetitiveMatrixProfileRow,
} from "@/features/conversion-gap/types/conversionGapReport.types";

export type CompetitiveMatrixViewModel = {
  hasData: boolean;
  profileRows: CompetitiveMatrixProfileRow[];
  competitorRows: CompetitiveMatrixCompetitorRow[];
  differentiators: Array<{ claim: string; proof: string }>;
  counters: Array<{ competitor: string; counter: string }>;
  narratives: Array<{ label: string; value: string }>;
};

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => toNonEmptyString(item))
    .filter((item): item is string => item !== null);
}

function normalizeProfileRows(value: unknown): CompetitiveMatrixProfileRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((row) => {
      if (!row || typeof row !== "object") {
        return null;
      }
      const item = row as Record<string, unknown>;
      const competitor = toNonEmptyString(item.competitor) ?? "Competitor";
      const ourAdvantage = toNonEmptyString(item.ourAdvantage) ?? "";
      const theirAdvantage = toNonEmptyString(item.theirAdvantage) ?? "";
      if (!ourAdvantage && !theirAdvantage) {
        return null;
      }
      return { competitor, ourAdvantage, theirAdvantage };
    })
    .filter((row): row is CompetitiveMatrixProfileRow => row !== null);
}

function normalizeCompetitorRows(
  value: unknown,
): CompetitiveMatrixCompetitorRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((row) => {
      if (!row || typeof row !== "object") {
        return null;
      }
      const item = row as Record<string, unknown>;
      const competitor = toNonEmptyString(item.competitor) ?? "Competitor";
      const summary = toNonEmptyString(item.summary) ?? "";
      const strengths = toStringArray(item.strengths);
      const weaknesses = toStringArray(item.weaknesses);
      const positioning = toStringArray(item.positioning);
      if (!summary && strengths.length === 0 && weaknesses.length === 0 && positioning.length === 0) {
        return null;
      }
      return {
        competitor,
        summary,
        strengths,
        weaknesses,
        positioning,
      };
    })
    .filter((row): row is CompetitiveMatrixCompetitorRow => row !== null);
}

function normalizeDifferentiators(
  value: unknown,
): Array<{ claim: string; proof: string }> {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const row = item as Record<string, unknown>;
      const claim = toNonEmptyString(row.claim) ?? "";
      const proof = toNonEmptyString(row.proof) ?? "";
      if (!claim && !proof) {
        return null;
      }
      return { claim, proof };
    })
    .filter((item): item is { claim: string; proof: string } => item !== null);
}

function normalizeCounters(
  value: unknown,
): Array<{ competitor: string; counter: string }> {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const row = item as Record<string, unknown>;
      const competitor = toNonEmptyString(row.competitor) ?? "";
      const counter = toNonEmptyString(row.counter) ?? "";
      if (!competitor && !counter) {
        return null;
      }
      return { competitor, counter };
    })
    .filter(
      (item): item is { competitor: string; counter: string } => item !== null,
    );
}

export function buildCompetitiveMatrixViewModel(
  matrix: CompetitiveMatrix,
): CompetitiveMatrixViewModel {
  const profileRows = normalizeProfileRows(matrix.profileMatrix);
  const competitorRows = normalizeCompetitorRows(matrix.competitorRows);
  const differentiators = normalizeDifferentiators(matrix.differentiators);
  const counters = normalizeCounters(matrix.counters);
  const narratives = [
    {
      label: "Core differentiation tension",
      value: toNonEmptyString(matrix.coreDifferentiationTension) ?? "",
    },
    {
      label: "Substitution risk",
      value: toNonEmptyString(matrix.substitutionRiskNarrative) ?? "",
    },
    {
      label: "Counter-positioning vector",
      value: toNonEmptyString(matrix.counterPositioningVector) ?? "",
    },
    {
      label: "Pricing defense",
      value: toNonEmptyString(matrix.pricingDefenseNarrative) ?? "",
    },
  ].filter((item) => item.value.length > 0);

  const hasData =
    profileRows.length > 0 ||
    competitorRows.length > 0 ||
    differentiators.length > 0 ||
    counters.length > 0 ||
    narratives.length > 0;

  return {
    hasData,
    profileRows,
    competitorRows,
    differentiators,
    counters,
    narratives,
  };
}
