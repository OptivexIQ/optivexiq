import type { ConversionGapReport } from "@/features/reports/types/report.types";

function toParagraphs(value: string) {
  if (!value) {
    return [];
  }

  const blocks = value
    .split("\n\n")
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  if (blocks.length > 0) {
    return blocks;
  }

  return value
    .split(/\.(\s+|$)/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0)
    .map((sentence) => `${sentence}.`)
    .slice(0, 5);
}

type ExecutiveNarrativeSummaryProps = {
  report: ConversionGapReport;
};

export function ExecutiveNarrativeSummary({
  report,
}: ExecutiveNarrativeSummaryProps) {
  const paragraphs = toParagraphs(report.executiveSummary);

  return (
    <div className="p-6">
      <p className="text-sm font-semibold text-foreground/85">
        Narrative diagnosis
      </p>
      <div className="mt-4 space-y-4 text-base text-foreground">
        {paragraphs.length > 0 ? (
          paragraphs.map((paragraph, index) => (
            <p key={`${paragraph}-${index}`}>{paragraph}</p>
          ))
        ) : (
          <p>No executive narrative has been generated yet.</p>
        )}
      </div>
    </div>
  );
}
