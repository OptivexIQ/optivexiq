type InsightsPanelProps = {
  insights: string[];
};

export function InsightsPanel({ insights }: InsightsPanelProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Positioning insights
      </p>
      <ul className="mt-4 grid gap-3 text-sm text-foreground">
        {insights.map((insight) => (
          <li key={insight} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
            <span>{insight}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
