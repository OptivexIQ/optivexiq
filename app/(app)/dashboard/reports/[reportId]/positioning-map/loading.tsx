export default function PositioningMapLoading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-3">
          <div className="h-3 w-32 rounded-full bg-muted/70" />
          <div className="h-7 w-72 rounded-full bg-muted/70" />
          <div className="h-4 w-80 rounded-full bg-muted/70" />
        </div>
        <div className="h-9 w-40 rounded-full bg-muted/70" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="relative h-105 overflow-hidden rounded-2xl border border-border/60 bg-card/80">
          <div className="absolute inset-0 blur-[1px]">
            <div className="h-full w-full bg-[linear-gradient(to_right,rgba(148,163,184,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.2)_1px,transparent_1px)] bg-size-[48px_48px]" />
          </div>
          <div className="absolute inset-0 animate-pulse bg-muted/20" />
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <div className="h-3 w-40 rounded-full bg-muted/70" />
          <div className="mt-4 space-y-3">
            <div className="h-4 w-full rounded-full bg-muted/50" />
            <div className="h-4 w-5/6 rounded-full bg-muted/50" />
            <div className="h-4 w-4/6 rounded-full bg-muted/50" />
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Loading positioning intelligence...
          </p>
        </div>
      </div>
    </div>
  );
}
