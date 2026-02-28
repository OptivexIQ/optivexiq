import type { ConversionGapReport } from "@/features/reports/types/report.types";
import { Sparkles } from "lucide-react";

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function wordCount(value: string) {
  if (value.trim().length === 0) {
    return 0;
  }
  return value.trim().split(/\s+/).length;
}

function truncateToWords(value: string, maxWords: number) {
  const words = value.trim().split(/\s+/);
  if (words.length <= maxWords) {
    return value.trim();
  }
  return `${words.slice(0, maxWords).join(" ")}...`;
}

function dedupeNarratives(values: string[]) {
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const value of values) {
    const normalized = normalizeText(value);
    if (normalized.length === 0) {
      continue;
    }
    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(normalized);
  }
  return deduped;
}

function buildExecutiveParagraph(report: ConversionGapReport) {
  const MIN_WORDS = 130;
  const MAX_WORDS = 190;

  const sources = dedupeNarratives([
    report.executiveNarrative,
    report.executiveSummary,
    report.diagnosis.summary,
  ]);

  if (sources.length === 0) {
    return "Executive narrative is unavailable for this report.";
  }

  let composed = sources[0];
  for (
    let i = 1;
    i < sources.length && wordCount(composed) < MIN_WORDS;
    i += 1
  ) {
    composed = `${composed} ${sources[i]}`;
  }

  return truncateToWords(normalizeText(composed), MAX_WORDS);
}

type ExecutiveNarrativeSummaryProps = {
  report: ConversionGapReport;
};

export function ExecutiveNarrativeSummary({
  report,
}: ExecutiveNarrativeSummaryProps) {
  const executiveParagraph = buildExecutiveParagraph(report);

  return (
    <section className="rounded-2xl border border-[hsl(216_55%_38%/.62)] bg-linear-to-br from-[hsl(218_48%_13%)] via-[hsl(0_1%_1%)] to-[hsl(210_38%_10%)] p-6 shadow-[0_14px_36px_hsl(216_62%_8%/.46)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[hsl(220_90%_63%)]" />
          <p className="text-sm font-semibold capitalize tracking-[0.12em] text-[hsl(220_92%_64%)]">
            Executive AI Diagnosis
          </p>
        </div>
        <span className="rounded-full border border-[hsl(221_45%_20%)] bg-[hsl(222_40%_17%/.25)] px-2.5 py-0.5 text-xs text-[hsl(216_42%_78%)]">
          Executive read: under 45 seconds
        </span>
      </div>

      <p className="mt-4 text-base leading-relaxed text-foreground/95">
        {executiveParagraph}
      </p>

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        Confidence and model boundaries: this summary is based on observed
        messaging, modeled conversion signals, and available competitive
        evidence at analysis time. Use it to prioritize action sequencing, not
        as a guarantee of commercial outcomes.
      </p>
    </section>
  );
}
