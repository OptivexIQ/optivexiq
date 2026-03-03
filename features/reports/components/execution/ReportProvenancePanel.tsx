import type { ConversionGapReport } from "@/features/reports/types/report.types";

type ReportProvenancePanelProps = {
  report: ConversionGapReport;
};

type EvidenceGroupKey =
  | "positioningClarity"
  | "objectionCoverage"
  | "competitiveOverlap"
  | "riskPrioritization"
  | "narrativeDiagnosis";

const EVIDENCE_LABELS: Record<EvidenceGroupKey, string> = {
  positioningClarity: "Positioning clarity",
  objectionCoverage: "Objection coverage",
  competitiveOverlap: "Competitive overlap",
  riskPrioritization: "Risk prioritization",
  narrativeDiagnosis: "Narrative diagnosis",
};

const CONFIDENCE_BY_GROUP: Record<EvidenceGroupKey, keyof ConversionGapReport["sectionConfidence"]> =
  {
    positioningClarity: "positioning",
    objectionCoverage: "objections",
    competitiveOverlap: "differentiation",
    riskPrioritization: "scoring",
    narrativeDiagnosis: "narrative",
  };

function toneForConfidence(score: number): string {
  if (score >= 75) {
    return "text-primary";
  }
  if (score >= 55) {
    return "text-foreground";
  }
  return "text-amber-500";
}

function summarizeSignalStrength(report: ConversionGapReport): {
  label: "Strong" | "Moderate" | "Reduced";
  detail: string;
} {
  const confidenceValues = [
    report.sectionConfidence.positioning,
    report.sectionConfidence.objections,
    report.sectionConfidence.differentiation,
    report.sectionConfidence.scoring,
    report.sectionConfidence.narrative,
  ];
  const averageConfidence = Math.round(
    confidenceValues.reduce((sum, value) => sum + value, 0) /
      confidenceValues.length,
  );

  const sources = new Set<string>();
  const evidenceGroups = report.diagnosticEvidence;
  for (const key of Object.keys(evidenceGroups) as EvidenceGroupKey[]) {
    for (const item of evidenceGroups[key]) {
      for (const source of item.derivedFrom) {
        const normalized = source.trim().toLowerCase();
        if (normalized.length > 0) {
          sources.add(normalized);
        }
      }
    }
  }

  const competitorSourceCount = Array.from(sources).filter(
    (source) => source !== "homepage" && source !== "pricing",
  ).length;

  if (averageConfidence < 55 || competitorSourceCount === 0) {
    return {
      label: "Reduced",
      detail: "Diagnostic depth reduced due to limited accessible content.",
    };
  }
  if (averageConfidence < 75 || competitorSourceCount < 2) {
    return {
      label: "Moderate",
      detail:
        "Diagnostic depth is usable, but additional competitor evidence would improve certainty.",
    };
  }
  return {
    label: "Strong",
    detail: "Diagnostic depth is strong with broad evidence coverage.",
  };
}

function detailTone(label: "Strong" | "Moderate" | "Reduced"): string {
  if (label === "Strong") {
    return "text-primary";
  }
  if (label === "Moderate") {
    return "text-foreground";
  }
  return "text-amber-500";
}

function formatSources(values: string[]): string {
  const unique = Array.from(
    new Set(values.map((value) => value.trim()).filter((value) => value.length > 0)),
  );
  return unique.slice(0, 3).join(" | ");
}

export function ReportProvenancePanel({ report }: ReportProvenancePanelProps) {
  const signalStrength = summarizeSignalStrength(report);
  const evidenceGroups = report.diagnosticEvidence;

  return (
    <section className="rounded-xl border border-border/60 bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Evidence & Methodology
          </p>
          <p className={`mt-1 text-sm font-medium ${detailTone(signalStrength.label)}`}>
            Signal strength: {signalStrength.label}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{signalStrength.detail}</p>
        </div>
        <div className="text-xs text-muted-foreground">
          <p>Risk model: {report.riskModelVersion}</p>
          <p>Taxonomy: {report.taxonomyVersion}</p>
          <p>Scoring weights: {report.scoringWeightsVersion}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(Object.keys(evidenceGroups) as EvidenceGroupKey[]).map((key) => {
          const entries = evidenceGroups[key];
          const lead = entries[0];
          const confidenceKey = CONFIDENCE_BY_GROUP[key];
          const confidence = report.sectionConfidence[confidenceKey];

          return (
            <article key={key} className="rounded-lg border border-border/60 bg-secondary/40 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{EVIDENCE_LABELS[key]}</p>
                <span className={`text-xs font-semibold ${toneForConfidence(confidence)}`}>
                  {confidence}%
                </span>
              </div>
              <p className="mt-2 text-sm text-foreground/90">{lead?.claim ?? "No claim"}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Derived from: {lead ? formatSources(lead.derivedFrom) : "N/A"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Evidence: {lead?.evidence.slice(0, 2).join(" | ") ?? "N/A"}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
