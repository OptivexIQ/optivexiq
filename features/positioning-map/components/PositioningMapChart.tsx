import type { PositioningMapData } from "@/features/positioning-map/types/positioningMap.types";
import { AxisGrid } from "@/features/positioning-map/components/AxisGrid";
import { TooltipCard } from "@/features/positioning-map/components/TooltipCard";

const DOT_SIZE = 14;

type PositioningMapChartProps = {
  data: PositioningMapData;
};

function toPercent(value: number, min: number, max: number) {
  if (max === min) {
    return 50;
  }

  const clamped = Math.max(min, Math.min(max, value));
  return ((clamped - min) / (max - min)) * 100;
}

export function PositioningMapChart({ data }: PositioningMapChartProps) {
  const primaryPoint = data.points[0];

  return (
    <div className="w-full">
      <div className="flex items-stretch gap-2">
        <div className="flex w-5 items-center justify-center text-xs text-muted-foreground">
          <span className="-rotate-90 origin-center whitespace-nowrap">
            {`Y-axis: ${data.axes.yLabel} (Low to High)`}
          </span>
        </div>
        <div className="relative h-136 flex-1">
          <AxisGrid
            xLabel={data.axes.xLabel}
            yLabel={data.axes.yLabel}
            showAxisLabels={false}
            cornerLabels={{
              topLeft: "Differentiated but unclear",
              topRight: "Clear and differentiated",
              bottomLeft: "Unclear and commoditized",
              bottomRight: "Clear but commoditized",
            }}
            showCrosshair
            crosshairClassName="bg-foreground/20"
            crosshairSize="lg"
          />
          <div className="pointer-events-none absolute inset-0">
            {data.points.map((point) => {
              const left = toPercent(point.x, data.axes.xMin, data.axes.xMax);
              const top =
                100 - toPercent(point.y, data.axes.yMin, data.axes.yMax);
              const isPrimary = point === primaryPoint;
              return (
                <div
                  key={`${point.label}-${point.x}-${point.y}`}
                  className="group pointer-events-auto absolute"
                  style={{ left: `${left}%`, top: `${top}%` }}
                >
                  {isPrimary ? (
                    <div className="flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
                      <div className="flex items-center gap-2 rounded-full border border-border/60 bg-secondary/80 px-2.5 py-1 text-[10px] font-semibold text-foreground">
                        {point.label}
                      </div>
                      <div className="flex h-4 w-4 items-center justify-center rounded-full border border-primary/60 bg-primary/30 ring-4 ring-primary/20">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                    </div>
                  ) : (
                    <div className="-translate-x-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      <div
                        className="h-2.5 w-2.5 rounded-full bg-muted-foreground/60"
                        style={{ width: DOT_SIZE - 4, height: DOT_SIZE - 4 }}
                      />
                      <span className="mt-2 block text-[10px]">
                        {point.label}
                      </span>
                    </div>
                  )}
                  <div className="absolute left-1/2 -top-2 hidden -translate-x-1/2 -translate-y-full group-hover:block">
                    <TooltipCard title={point.label} summary={point.summary} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-3 text-right text-xs text-muted-foreground">
        {`X-axis: ${data.axes.xLabel} (Low to High)`}
      </div>
    </div>
  );
}
