export default function ReportDetailLoading() {
  return (
    <div className="flex w-full flex-col gap-8">
      <div className="rounded-xl border border-border/60 bg-card p-6">
        <div className="h-3 w-32 rounded-full bg-muted/70" />
        <div className="mt-4 h-7 w-64 rounded-full bg-muted/70" />
        <div className="mt-3 h-4 w-80 rounded-full bg-muted/70" />
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-6">
        <div className="h-3 w-40 rounded-full bg-muted/70" />
        <div className="mt-4 space-y-3">
          <div className="h-4 w-full rounded-full bg-muted/50" />
          <div className="h-4 w-5/6 rounded-full bg-muted/50" />
          <div className="h-4 w-4/6 rounded-full bg-muted/50" />
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-6">
        <div className="h-3 w-40 rounded-full bg-muted/70" />
        <div className="mt-3 h-6 w-48 rounded-full bg-muted/70" />
        <div className="mt-2 h-4 w-64 rounded-full bg-muted/50" />
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-6">
        <div className="h-3 w-40 rounded-full bg-muted/70" />
        <div className="mt-4 space-y-3">
          <div className="h-12 w-full rounded-lg bg-muted/50" />
          <div className="h-12 w-full rounded-lg bg-muted/50" />
          <div className="h-12 w-full rounded-lg bg-muted/50" />
        </div>
      </div>
    </div>
  );
}
