type CostParams = {
  model: string;
  inputTokens: number;
  outputTokens: number;
};

const modelRates: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  "gpt-4o": { input: 0.005, output: 0.015 },
};

export function estimateCost({ model, inputTokens, outputTokens }: CostParams) {
  const rate = modelRates[model] ?? modelRates["gpt-4o-mini"];
  const inputCost = (inputTokens / 1000) * rate.input;
  const outputCost = (outputTokens / 1000) * rate.output;
  return Number((inputCost + outputCost).toFixed(6));
}
