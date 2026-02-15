export default function ProfileEditLoading() {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="h-3 w-20 rounded-full bg-muted/70" />
          <div className="h-7 w-64 rounded-full bg-muted/50" />
          <div className="h-3 w-80 rounded-full bg-muted/40" />
        </div>
        <div className="h-10 w-36 rounded-md bg-muted/50" />
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-6">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="h-3 w-16 rounded-full bg-muted/60" />
              <div className="h-10 w-full rounded-md bg-muted/40" />
            </div>
            <div className="space-y-3">
              <div className="h-3 w-20 rounded-full bg-muted/60" />
              <div className="h-10 w-full rounded-md bg-muted/40" />
            </div>
            <div className="space-y-3">
              <div className="h-3 w-20 rounded-full bg-muted/60" />
              <div className="h-10 w-full rounded-md bg-muted/40" />
            </div>
            <div className="space-y-3">
              <div className="h-3 w-24 rounded-full bg-muted/60" />
              <div className="h-10 w-full rounded-md bg-muted/40" />
            </div>
          </div>

          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 w-full rounded-md bg-muted/40" />
            ))}
          </div>

          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 w-full rounded-md bg-muted/40" />
            ))}
          </div>

          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="grid gap-3 rounded-lg border border-border/60 bg-secondary/40 p-4 md:grid-cols-3"
              >
                <div className="h-10 w-full rounded-md bg-muted/40" />
                <div className="h-10 w-full rounded-md bg-muted/40" />
                <div className="h-10 w-full rounded-md bg-muted/40" />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <div className="h-10 w-32 rounded-md bg-muted/50" />
          </div>
        </div>
      </div>
    </div>
  );
}
