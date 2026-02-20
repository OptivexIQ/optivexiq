type AxisGridProps = {
  xLabel: string;
  yLabel: string;
  showAxisLabels?: boolean;
  labelClassName?: string;
  cornerLabels?: {
    topLeft?: string;
    topRight?: string;
    bottomLeft?: string;
    bottomRight?: string;
  };
  cornerLabelClassName?: string;
  showCrosshair?: boolean;
  crosshairClassName?: string;
  crosshairSize?: "sm" | "md" | "lg";
};

export function AxisGrid({
  xLabel,
  yLabel,
  showAxisLabels = true,
  labelClassName,
  cornerLabels,
  cornerLabelClassName,
  showCrosshair = false,
  crosshairClassName,
  crosshairSize = "md",
}: AxisGridProps) {
  const axisLabelClassName = labelClassName ?? "text-xs";
  const cornerClassName = cornerLabelClassName ?? axisLabelClassName;
  const crosshairClass = crosshairClassName ?? "bg-foreground/20";
  const crosshairThickness =
    crosshairSize === "sm"
      ? "w-0.5 h-0.5"
      : crosshairSize === "lg"
        ? "w-[3px] h-[3px]"
        : "w-0.75 h-0.75";

  return (
    <div className="relative h-full w-full rounded-2xl border border-border/60 bg-card/80">
      <div className="absolute inset-0 rounded-2xl bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-size-[48px_48px]" />
      {showAxisLabels ? (
        <div
          className={`absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 font-medium text-foreground/80 ${axisLabelClassName}`}
        >
          {yLabel}
        </div>
      ) : null}
      {showAxisLabels ? (
        <div
          className={`absolute bottom-1 left-1/2 -translate-x-1/2 font-medium text-foreground/80 ${axisLabelClassName}`}
        >
          {xLabel}
        </div>
      ) : null}
      {cornerLabels?.topLeft ? (
        <div
          className={`absolute left-4 top-4 font-medium text-foreground/80 ${cornerClassName}`}
        >
          {cornerLabels.topLeft}
        </div>
      ) : null}
      {cornerLabels?.topRight ? (
        <div
          className={`absolute right-4 top-4 font-medium text-foreground/80 ${cornerClassName}`}
        >
          {cornerLabels.topRight}
        </div>
      ) : null}
      {cornerLabels?.bottomLeft ? (
        <div
          className={`absolute bottom-4 left-4 font-medium text-foreground/80 ${cornerClassName}`}
        >
          {cornerLabels.bottomLeft}
        </div>
      ) : null}
      {cornerLabels?.bottomRight ? (
        <div
          className={`absolute bottom-4 right-4 font-medium text-foreground/80 ${cornerClassName}`}
        >
          {cornerLabels.bottomRight}
        </div>
      ) : null}
      {showCrosshair ? (
        <div className="pointer-events-none absolute inset-0">
          <div
            className={`absolute inset-y-0 left-1/2 -translate-x-1/2 ${crosshairClass} ${crosshairThickness.split(" ")[0]}`}
          />
          <div
            className={`absolute left-0 top-1/2 w-full -translate-y-1/2 ${crosshairClass} ${crosshairThickness.split(" ")[1]}`}
          />
        </div>
      ) : null}
    </div>
  );
}
