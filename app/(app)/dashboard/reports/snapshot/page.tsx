import Link from "next/link";
import { requireUser } from "@/lib/auth/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLatestSnapshotReport } from "@/features/reports/services/snapshotService";

export default async function SnapshotPage() {
  await requireUser();
  const snapshot = await getLatestSnapshotReport();

  if (!snapshot) {
    return (
      <div className="flex w-full flex-col gap-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Snapshot
          </p>
          <h1 className="text-2xl font-semibold text-foreground">
            Snapshot not available
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            We could not find a snapshot for your account yet.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/onboarding">Return to onboarding</Link>
        </Button>
      </div>
    );
  }

  if (snapshot.status === "queued" || snapshot.status === "running") {
    return (
      <div className="flex w-full flex-col gap-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Snapshot
          </p>
          <h1 className="text-2xl font-semibold text-foreground">
            Generating your snapshot
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Your first conversion snapshot is in progress. This usually takes a
            minute.
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Refresh this page to see the results.
          </p>
        </div>
      </div>
    );
  }

  if (snapshot.status === "failed") {
    return (
      <div className="flex w-full flex-col gap-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Snapshot
          </p>
          <h1 className="text-2xl font-semibold text-foreground">
            Snapshot failed
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            We were unable to generate your snapshot. Please try again.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/onboarding">Return to onboarding</Link>
        </Button>
      </div>
    );
  }

  const weaknesses = snapshot.result?.weaknesses ?? [];
  const hero = snapshot.result?.hero ?? null;
  const uncoveredObjection = snapshot.result?.uncoveredObjection ?? "";

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Snapshot
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-foreground">
            Conversion Snapshot
          </h1>
          <Badge variant="secondary">Partial</Badge>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          A quick read of your current homepage and positioning. Unlock the full
          report to access the complete conversion breakdown.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="rounded-xl border border-border/60 bg-card p-6">
            <h2 className="text-base font-semibold text-foreground">
              Top weaknesses
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The most urgent conversion risks detected.
            </p>
            <ul className="mt-4 space-y-3">
              {weaknesses.length ? (
                weaknesses.map((item, index) => (
                  <li
                    key={index}
                    className="rounded-lg border border-border/60 bg-secondary/40 p-3 text-sm text-foreground"
                  >
                    {item}
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground">
                  No weaknesses available yet.
                </li>
              )}
            </ul>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-6">
            <h2 className="text-base font-semibold text-foreground">
              Hero rewrite
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A single hero rewrite to test immediate clarity gains.
            </p>
            {hero ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-lg border border-border/60 bg-secondary/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Headline
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    {hero.headline}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-secondary/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Subheadline
                  </p>
                  <p className="mt-2 text-sm text-foreground">
                    {hero.subheadline}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="outline">{hero.primaryCta}</Badge>
                  {hero.secondaryCta ? (
                    <Badge variant="outline">{hero.secondaryCta}</Badge>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Hero rewrite pending.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-6">
            <h2 className="text-base font-semibold text-foreground">
              Uncovered objection
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A buyer concern currently missing from your page.
            </p>
            <p className="mt-4 text-sm text-foreground">
              {uncoveredObjection || "No objection detected yet."}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border/60 bg-card p-6">
            <h2 className="text-base font-semibold text-foreground">
              Full conversion report
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Unlock the complete report with detailed diagnostics, rewrites,
              and export-ready insights.
            </p>
            <div className="mt-4 space-y-3">
              <div className="h-16 rounded-lg border border-border/60 bg-secondary/40 blur-sm" />
              <div className="h-16 rounded-lg border border-border/60 bg-secondary/40 blur-sm" />
              <div className="h-16 rounded-lg border border-border/60 bg-secondary/40 blur-sm" />
            </div>
            <Button asChild className="mt-5 w-full">
              <Link href="/dashboard/gap-engine">
                Unlock Full Conversion Report
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
