type TooltipCardProps = {
  title: string;
  summary?: string;
};

export function TooltipCard({ title, summary }: TooltipCardProps) {
  return (
    <div className="w-56 rounded-lg border border-border/60 bg-background/95 p-3 text-xs text-foreground shadow-lg">
      <p className="font-semibold text-foreground">{title}</p>
      {summary ? <p className="mt-2 text-muted-foreground">{summary}</p> : null}
    </div>
  );
}
