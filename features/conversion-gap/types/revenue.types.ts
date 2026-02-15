export type RevenueModelInput = {
  winRateDelta: number;
  funnelRisk: number;
  trafficBaseline: number;
  averageDealSize: number;
};

export type RevenueProjection = {
  estimatedLiftPercent: number;
  modeledWinRateDelta: number;
  projectedPipelineRecovery: number;
};

export type RevenueModelOutput = {
  pipelineAtRisk: number;
  revenueProjection: RevenueProjection;
};
