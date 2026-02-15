import type {
  RevenueModelInput,
  RevenueModelOutput,
} from "@/features/conversion-gap/types/revenue.types";

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function modelRevenueImpact(
  input: RevenueModelInput,
): RevenueModelOutput {
  const funnelRisk = clampPercent(input.funnelRisk);
  const basePipeline = input.trafficBaseline * input.averageDealSize;
  const pipelineAtRisk = Math.round(basePipeline * (funnelRisk / 100));
  const modeledWinRateDelta = input.winRateDelta;
  const liftFromClarity = Math.max(0, modeledWinRateDelta) * 0.6;
  const estimatedLiftPercent = Math.round(liftFromClarity + funnelRisk * 0.1);
  const projectedPipelineRecovery = Math.round(
    pipelineAtRisk * (estimatedLiftPercent / 100),
  );

  return {
    pipelineAtRisk,
    revenueProjection: {
      estimatedLiftPercent,
      modeledWinRateDelta,
      projectedPipelineRecovery,
    },
  };
}
