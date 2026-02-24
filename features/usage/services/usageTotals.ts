import {
  AI_INPUT_TOKEN_RATE_CENTS,
  AI_OUTPUT_TOKEN_RATE_CENTS,
} from "@/lib/constants/limits";

export type UsageModuleRecord = {
  name: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostCents: number;
};

export type UsageTotals = {
  modules: UsageModuleRecord[];
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostCents: number;
};

type UsageSource = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
};

function estimateCostCents(promptTokens: number, completionTokens: number) {
  return Math.round(
    promptTokens * AI_INPUT_TOKEN_RATE_CENTS +
      completionTokens * AI_OUTPUT_TOKEN_RATE_CENTS,
  );
}

export function buildUsageTotals(
  moduleUsage: Array<{ name: string; usage: UsageSource }>,
): UsageTotals {
  const modules = moduleUsage.map((item) => {
    const promptTokens = Math.max(0, Math.floor(item.usage.promptTokens));
    const completionTokens = Math.max(0, Math.floor(item.usage.completionTokens));
    const totalTokens = Math.max(0, Math.floor(item.usage.totalTokens));
    return {
      name: item.name,
      model: item.usage.model,
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCostCents: estimateCostCents(promptTokens, completionTokens),
    };
  });

  const promptTokens = modules.reduce((sum, item) => sum + item.promptTokens, 0);
  const completionTokens = modules.reduce(
    (sum, item) => sum + item.completionTokens,
    0,
  );
  const totalTokens = modules.reduce((sum, item) => sum + item.totalTokens, 0);
  const estimatedCostCents = modules.reduce(
    (sum, item) => sum + item.estimatedCostCents,
    0,
  );

  return {
    modules,
    promptTokens,
    completionTokens,
    totalTokens,
    estimatedCostCents,
  };
}

export function validateUsageTotals(totals: UsageTotals): {
  ok: true;
} | {
  ok: false;
  reason: string;
  expectedTotalTokens: number;
  actualTotalTokens: number;
} {
  const expectedTotalTokens = totals.modules.reduce(
    (sum, item) => sum + item.totalTokens,
    0,
  );
  const actualTotalTokens = totals.totalTokens;

  if (actualTotalTokens < expectedTotalTokens) {
    return {
      ok: false,
      reason: "usage_totals_underreported_tokens",
      expectedTotalTokens,
      actualTotalTokens,
    };
  }

  return { ok: true };
}
