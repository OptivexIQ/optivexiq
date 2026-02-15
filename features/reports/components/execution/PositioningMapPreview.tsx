import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { ConversionGapReport } from "@/features/reports/types/report.types";
import type { PositioningMapData } from "@/features/positioning-map/types/positioningMap.types";
import { AxisGrid } from "@/features/positioning-map/components/AxisGrid";

type PositioningMapPreviewProps = {
  report: ConversionGapReport;
};

function toPercent(value: number, min: number, max: number) {
  if (max === min) {
    return 50;
  }

  const clamped = Math.max(min, Math.min(max, value));
  return ((clamped - min) / (max - min)) * 100;
}

export function PositioningMapPreview({ report }: PositioningMapPreviewProps) {
  const positioning = report.positioningMap as PositioningMapData | null;
  const axes = positioning?.axes;
  const points = positioning?.points ?? [];
  const primaryPoint =
    points.find(
      (point) => point.label.toLowerCase() === report.company.toLowerCase(),
    ) ?? points[0];
  const secondaryPoints = points.filter((point) => point !== primaryPoint);

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Positioning map preview
          </p>
          <p className="mt-2 text-sm text-foreground">
            Strategic positioning intelligence across competitive terrain.
          </p>
        </div>
      </div>

      <div className="mt-2">
        <div className="relative h-48 overflow-hidden rounded-xl border border-border/60 bg-secondary/30">
          <AxisGrid
            xLabel={axes?.xLabel ?? "Messaging clarity"}
            yLabel={axes?.yLabel ?? "Differentiation strength"}
            showAxisLabels={false}
            labelClassName="text-[9px]"
            cornerLabelClassName="text-[8px]"
            cornerLabels={{
              topLeft: "Differentiated but unclear",
              topRight: "Clear and differentiated",
              bottomLeft: "Unclear and commoditized",
              bottomRight: "Clear but commoditized",
            }}
            showCrosshair
            crosshairClassName="bg-foreground/20"
            crosshairSize="sm"
          />

          {secondaryPoints.map((point) => {
            const left = toPercent(
              point.x,
              axes?.xMin ?? 0,
              axes?.xMax ?? 100,
            );
            const top =
              100 -
              toPercent(
                point.y,
                axes?.yMin ?? 0,
                axes?.yMax ?? 100,
              );

            return (
              <div
                key={`${point.label}-${point.x}-${point.y}`}
                className="absolute text-xs text-muted-foreground"
                style={{ left: `${left}%`, top: `${top}%` }}
              >
                <div className="h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted-foreground/60" />
                <span className="mt-2 block -translate-x-1/2 text-[10px]">
                  {point.label}
                </span>
              </div>
            );
          })}

          {primaryPoint ? (
            <div
              className="absolute"
              style={{
                left: `${toPercent(
                  primaryPoint.x,
                  axes?.xMin ?? 0,
                  axes?.xMax ?? 100,
                )}%`,
                top: `${
                  100 -
                  toPercent(
                    primaryPoint.y,
                    axes?.yMin ?? 0,
                    axes?.yMax ?? 100,
                  )
                }%`,
              }}
            >
              <div className="flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
                <div className="flex items-center gap-2 rounded-full border border-border/60 bg-secondary/80 px-2.5 py-1 text-[10px] font-semibold text-foreground">
                  {primaryPoint.label}
                </div>
                <div className="flex h-4 w-4 items-center justify-center rounded-full border border-primary/60 bg-primary/30 ring-4 ring-primary/20">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <Button asChild variant="secondary" className="mt-4 w-full">
        <Link href={`/dashboard/reports/${report.id}/positioning-map`}>
          View Strategic Positioning
        </Link>
      </Button>
    </div>
  );
}
