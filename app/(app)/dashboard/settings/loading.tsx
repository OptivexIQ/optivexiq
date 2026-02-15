export default function SettingsLoading() {
  return (
    <div className="flex w-full flex-col gap-8">
      <div className="space-y-3">
        <div className="h-3 w-24 rounded-full bg-muted/70" />
        <div className="h-6 w-64 rounded-full bg-muted/50" />
        <div className="h-4 w-96 rounded-full bg-muted/40" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <div className="space-y-4">
            {[0, 1, 2].map((index) => (
              <div key={index} className="rounded-lg bg-secondary/40 p-4">
                <div className="h-3 w-32 rounded-full bg-muted/60" />
                <div className="mt-3 h-4 w-48 rounded-full bg-muted/50" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <div className="h-4 w-32 rounded-full bg-muted/50" />
          <div className="mt-3 h-3 w-56 rounded-full bg-muted/40" />
          <div className="mt-6 h-10 w-full rounded-md bg-muted/30" />
        </div>
      </div>
    </div>
  );
}
