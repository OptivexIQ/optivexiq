"use client";

import { useMemo, useState } from "react";
import { Brain } from "lucide-react";
import { buildRewriteOutputViewModel } from "@/features/rewrites/services/rewriteOutputViewModel";

type RewriteStrategicRationaleCardProps = {
  output: string;
  compareMode: boolean;
};

export function RewriteStrategicRationaleCard({
  output,
  compareMode,
}: RewriteStrategicRationaleCardProps) {
  const [revealed, setRevealed] = useState(false);
  const model = useMemo(() => buildRewriteOutputViewModel(output), [output]);
  const rationaleSections = model.rationaleSections;
  const fullText = rationaleSections[0]?.body ?? "";

  if (
    compareMode ||
    output.trim().length === 0 ||
    rationaleSections.length === 0
  ) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-[hsl(216_55%_38%/.62)] bg-linear-to-br from-[hsl(218_48%_13%)] via-[hsl(0_1%_1%)] to-[hsl(210_38%_10%)] p-6 shadow-[0_14px_36px_hsl(216_62%_8%/.46)]">
      <div className="flex items-center gap-3">
        <Brain className="h-5 w-5" />
        <p className="font-semibold text-[hsl(216_38%_93%)]">
          Strategic Rationale
        </p>
      </div>

      <button
        type="button"
        onClick={() => setRevealed((previous) => !previous)}
        className="mt-4 text-sm font-medium text-[hsl(217_82%_62%)] hover:text-[hsl(217_82%_70%)] focus-visible:outline-none"
      >
        {revealed ? "Hide rationale" : "Reveal rationale"}
      </button>
      {revealed ? (
        <div className="mt-4 text-[15px] leading-relaxed text-[hsl(217_26%_72%)]">
          {fullText}
        </div>
      ) : null}
    </section>
  );
}
