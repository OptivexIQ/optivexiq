import type {
  PriorityInput,
  PriorityItem,
  PriorityTier,
} from "@/features/conversion-gap/types/priority.types";

const impactWeight = 1;
const effortWeight = 1;

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const sum = values.reduce((total, value) => total + value, 0);
  return sum / values.length;
}

function scoreImpact(input: PriorityInput) {
  return average([
    input.impact.revenueExposure,
    input.impact.funnelStageImpact,
    input.impact.competitiveOverlap,
    input.impact.objectionWeakness,
  ]);
}

function scoreEffort(input: PriorityInput) {
  return average([input.effort.scopeComplexity, input.effort.structuralChange]);
}

function toTier(score: number): PriorityTier {
  if (score >= 60) {
    return "Critical";
  }

  if (score >= 35) {
    return "High";
  }

  return "Medium";
}

export function rankPriorityIssues(inputs: PriorityInput[]): PriorityItem[] {
  const scored = inputs.map((input) => {
    const impactScore = Math.round(scoreImpact(input));
    const effortEstimate = Math.round(scoreEffort(input));
    const priorityScore = Math.round(
      impactWeight * impactScore - effortWeight * effortEstimate,
    );

    return {
      issue: input.issue,
      impactScore,
      effortEstimate,
      priorityScore,
      tier: toTier(priorityScore),
    };
  });

  return scored.sort((a, b) => b.priorityScore - a.priorityScore);
}
