import assert from "node:assert/strict";
import test from "node:test";
import { buildUsageTotals, validateUsageTotals } from "./usageTotals";

test("buildUsageTotals aggregates module tokens and cost", () => {
  const totals = buildUsageTotals([
    {
      name: "gapAnalysis",
      usage: {
        promptTokens: 100,
        completionTokens: 40,
        totalTokens: 140,
        model: "gpt-4o-mini",
      },
    },
    {
      name: "competitorSynthesis",
      usage: {
        promptTokens: 50,
        completionTokens: 20,
        totalTokens: 70,
        model: "gpt-4o-mini",
      },
    },
  ]);

  assert.equal(totals.promptTokens, 150);
  assert.equal(totals.completionTokens, 60);
  assert.equal(totals.totalTokens, 210);
  assert.equal(totals.modules.length, 2);
  assert.ok(totals.estimatedCostCents > 0);
});

test("validateUsageTotals fails closed for underreported totals", () => {
  const totals = buildUsageTotals([
    {
      name: "gapAnalysis",
      usage: {
        promptTokens: 80,
        completionTokens: 20,
        totalTokens: 100,
        model: "gpt-4o-mini",
      },
    },
  ]);

  const invalid = validateUsageTotals({
    ...totals,
    totalTokens: 90,
  });

  assert.equal(invalid.ok, false);
  if (!invalid.ok) {
    assert.equal(invalid.expectedTotalTokens, 100);
    assert.equal(invalid.actualTotalTokens, 90);
  }
});
