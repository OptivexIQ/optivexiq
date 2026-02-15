export default function ProfileLoading() {
  return (
    <div className="flex w-full flex-col gap-6">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="h-3 w-24 rounded-full bg-muted/70" />
        <div className="h-7 w-40 rounded-full bg-muted/50" />
        <div className="h-4 w-full max-w-2xl rounded-full bg-muted/40" />
      </div>

      <div className="space-y-6">
        {/* Profile Status & Actions */}
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="rounded-xl border border-border/60 bg-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-32 rounded-full bg-muted/60" />
                  <div className="h-5 w-16 rounded-full bg-muted/50" />
                </div>
                <div className="mt-3 flex items-end gap-2">
                  <div className="h-9 w-16 rounded-full bg-muted/60" />
                  <div className="mb-1 h-3 w-24 rounded-full bg-muted/40" />
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-muted/50" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:min-w-50">
            <div className="h-11 w-full rounded-md bg-muted/50" />
            <div className="rounded-lg border border-border/60 bg-secondary/40 p-3">
              <div className="h-3 w-20 rounded-full bg-muted/60" />
              <div className="mt-1 h-4 w-24 rounded-full bg-muted/50" />
            </div>
          </div>
        </div>

        {/* Market & Revenue Foundation */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-muted/60" />
            <div className="h-3 w-48 rounded-full bg-muted/60" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-border/60 bg-card p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted/50" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-16 rounded-full bg-muted/60" />
                    <div className="h-4 w-32 rounded-full bg-muted/50" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion Intelligence */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-muted/60" />
            <div className="h-3 w-40 rounded-full bg-muted/60" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-border/60 bg-card p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-muted/50" />
                    <div className="space-y-2">
                      <div className="h-3 w-24 rounded-full bg-muted/60" />
                      <div className="h-3 w-32 rounded-full bg-muted/40" />
                    </div>
                  </div>
                  <div className="h-5 w-8 rounded-full bg-muted/50" />
                </div>
                <div className="mt-4 space-y-2.5">
                  {[0, 1, 2].map((j) => (
                    <div
                      key={j}
                      className="rounded-lg border border-border/40 bg-secondary/20 p-3"
                    >
                      <div className="h-4 w-full rounded-full bg-muted/40" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Competitive Positioning */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-muted/60" />
            <div className="h-3 w-44 rounded-full bg-muted/60" />
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="h-3 w-36 rounded-full bg-muted/60" />
                <div className="h-3 w-52 rounded-full bg-muted/40" />
              </div>
              <div className="h-5 w-24 rounded-full bg-muted/50" />
            </div>
            <div className="mt-5 space-y-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border/60 bg-linear-to-br from-secondary/40 to-secondary/20 p-5"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-muted/50" />
                    <div className="h-4 w-32 rounded-full bg-muted/60" />
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {[0, 1].map((j) => (
                      <div
                        key={j}
                        className="rounded-lg border border-border/40 bg-muted/10 p-4"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded bg-muted/50" />
                          <div className="h-3 w-24 rounded-full bg-muted/60" />
                        </div>
                        <div className="mt-2 h-4 w-full rounded-full bg-muted/40" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
