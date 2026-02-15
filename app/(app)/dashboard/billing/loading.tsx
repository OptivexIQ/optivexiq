export default function BillingLoading() {
  return (
    <div className="flex w-full flex-col gap-8">
      <div className="space-y-3">
        <div className="h-3 w-16 rounded-full bg-muted/70" />
        <div className="h-7 w-48 rounded-full bg-muted/50" />
        <div className="h-4 w-full max-w-2xl rounded-full bg-muted/40" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 rounded-full bg-muted/60" />
              <div className="h-5 w-40 rounded-full bg-muted/50" />
              <div className="h-3 w-32 rounded-full bg-muted/40" />
            </div>
            <div className="h-5 w-16 rounded-full bg-muted/50" />
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border/60 bg-secondary/40 p-4">
              <div className="flex items-center justify-between">
                <div className="h-3 w-28 rounded-full bg-muted/60" />
                <div className="h-3 w-12 rounded-full bg-muted/50" />
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-muted/40" />
            </div>
            <div className="rounded-lg border border-border/60 bg-secondary/40 p-4">
              <div className="flex items-center justify-between">
                <div className="h-3 w-28 rounded-full bg-muted/60" />
                <div className="h-3 w-12 rounded-full bg-muted/50" />
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-muted/40" />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="h-10 w-36 rounded-md bg-muted/50" />
            <div className="h-10 w-36 rounded-md bg-muted/40" />
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-5 w-5 rounded bg-muted/60" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded-full bg-muted/60" />
              <div className="h-3 w-full rounded-full bg-muted/40" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-muted/50" />
                <div className="h-3 w-32 rounded-full bg-muted/40" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-card p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-1">
                <div className="h-4 w-32 rounded-full bg-muted/60" />
                <div className="h-3 w-full rounded-full bg-muted/40" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <div className="h-7 w-16 rounded-full bg-muted/60" />
              <div className="h-3 w-16 rounded-full bg-muted/40" />
            </div>
            <div className="mt-4 h-10 w-full rounded-md bg-muted/50" />
            <div className="mt-5 space-y-2">
              {[0, 1, 2, 3].map((j) => (
                <div key={j} className="flex items-start gap-2">
                  <div className="mt-0.5 h-4 w-4 rounded-full bg-muted/50" />
                  <div className="h-3 w-full rounded-full bg-muted/40" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
