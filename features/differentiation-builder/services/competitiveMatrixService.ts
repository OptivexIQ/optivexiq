import type { CompetitorInsight } from "@/features/conversion-gap/types/gap.types";
import type { ModuleUsage } from "@/features/conversion-gap/services/moduleRuntimeService";
import { runValidatedModule } from "@/features/conversion-gap/services/moduleRuntimeService";
import type { DifferentiationBuilderOutput } from "@/features/differentiation-builder/services/differentiationBuilderService";
import { z } from "zod";

export type CompetitiveMatrixDimension = {
  dimension: string;
  you: string;
  competitors: Array<{
    name: string;
    value: string;
    evidence: string;
  }>;
};

export type CompetitiveMatrixOutput = {
  rows: CompetitiveMatrixDimension[];
};

type CompetitiveMatrixInput = {
  competitors: CompetitorInsight[];
  differentiation: DifferentiationBuilderOutput;
};

const matrixCellSchema = z.object({
  name: z.string().trim().min(1),
  value: z.enum(["Low", "Medium", "High"]),
  evidence: z.string().trim().min(20),
});

const matrixOutputSchema = z.object({
  rows: z
    .array(
      z.object({
        dimension: z.string().trim().min(1),
        you: z.enum(["Low", "Medium", "High"]),
        competitors: z.array(matrixCellSchema),
      }),
    )
    .min(3),
});

function compactCompetitor(competitor: CompetitorInsight) {
  return {
    name: competitor.name,
    url: competitor.url ?? null,
    extraction: competitor.extraction ?? null,
    summary: competitor.summary ?? null,
  };
}

function hasEvidenceSpecificity(output: CompetitiveMatrixOutput) {
  return output.rows.every((row) =>
    row.competitors.every((cell) => cell.evidence.trim().length >= 20),
  );
}

export async function buildCompetitiveMatrixFromPositioning(
  input: CompetitiveMatrixInput,
): Promise<{ data: CompetitiveMatrixOutput; usage: ModuleUsage }> {
  const dimensions = [
    "Complexity",
    "Price positioning",
    "Time-to-value",
    "Target segment",
    "Deployment model",
    "Differentiation narrative",
    "Proof signals",
  ] as const;

  const schemaExample: CompetitiveMatrixOutput = {
    rows: [
      {
        dimension: "Time-to-value",
        you: "High",
        competitors: [
          {
            name: "example-competitor.com",
            value: "Medium",
            evidence:
              "Mentions implementation support and migration setup before value realization.",
          },
        ],
      },
      {
        dimension: "Differentiation narrative",
        you: "High",
        competitors: [
          {
            name: "example-competitor.com",
            value: "Medium",
            evidence:
              "Positions on optimization language without decision infrastructure framing.",
          },
        ],
      },
      {
        dimension: "Proof signals",
        you: "Medium",
        competitors: [
          {
            name: "example-competitor.com",
            value: "High",
            evidence:
              "Includes explicit customer evidence and quantified performance outcomes.",
          },
        ],
      },
    ],
  };

  const system = [
    "You are a SaaS competitive intelligence analyst.",
    "Build an evidence-backed competitive matrix from source-derived competitor extracts.",
    "Do not guess. If evidence is absent, lower confidence and keep evidence explicit.",
    "Return strict JSON only; no markdown or additional keys.",
  ].join("\n");

  const user = JSON.stringify(
    {
      task: "Generate a competitive matrix for decision-making.",
      dimensions,
      differentiationInsights: input.differentiation.competitiveInsights,
      competitors: input.competitors.map(compactCompetitor),
      outputContract: schemaExample,
    },
    null,
    2,
  );

  const result = await runValidatedModule<CompetitiveMatrixOutput>({
    moduleName: "competitiveMatrixSynthesis",
    schema: matrixOutputSchema,
    schemaExample,
    system,
    user,
  });

  const competitorNames = new Set(
    input.competitors.map((competitor) => competitor.name.trim().toLowerCase()),
  );
  for (const row of result.data.rows) {
    for (const cell of row.competitors) {
      if (!competitorNames.has(cell.name.trim().toLowerCase())) {
        throw new Error("competitive_matrix_unknown_competitor");
      }
    }
  }

  if (!hasEvidenceSpecificity(result.data)) {
    throw new Error("competitive_matrix_not_specific");
  }

  return { data: result.data, usage: result.usage };
}
