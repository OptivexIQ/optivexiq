import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmailCapturePanel } from "@/features/free-snapshot/components/EmailCapturePanel";
import type { FreeConversionSnapshot } from "@/features/free-snapshot/types/freeSnapshot.types";

function getStructuralRiskCount(snapshot: FreeConversionSnapshot): number {
  const issues = [
    snapshot.topMessagingGap,
    snapshot.topObjectionGap,
    ...snapshot.quickWins,
  ].filter((item) => item.trim().length > 0);
  return Math.max(1, Math.min(issues.length, 5));
}

export function CompletionState(props: {
  domain: string;
  snapshot: FreeConversionSnapshot;
  initialEmail: string;
  onDownload: (input: { email: string; consent: boolean }) => Promise<void>;
}) {
  const risks = getStructuralRiskCount(props.snapshot);
  const keyInsight =
    props.snapshot.quickWins[0] ?? props.snapshot.topMessagingGap;

  return (
    <div className="space-y-5 rounded-2xl border border-border/60 bg-card/80 p-8 shadow-xl shadow-black/10">
      <div>
        <h3 className="text-2xl font-semibold text-foreground">
          We found {risks} structural conversion risks.
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Your AI Snapshot for {props.domain} is ready.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-border/60 bg-secondary/30 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Executive summary
          </p>
          <p className="mt-2 text-sm text-foreground">
            {props.snapshot.executiveSummary}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border/60 bg-card/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Gap score
            </p>
            <p className="mt-2 text-xl font-semibold text-foreground">
              {Math.round(
                (props.snapshot.clarityScore +
                  props.snapshot.positioningScore) /
                  2,
              )}{" "}
              / 100
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-card/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Key insight
            </p>
            <p className="mt-2 text-sm text-foreground">{keyInsight}</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/60 bg-card/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Detected objection
          </p>
          <p className="mt-2 text-sm text-foreground">
            {props.snapshot.topObjectionGap}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-lg border border-border/60 bg-card/80 p-4">
          <div className="blur-[2px]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Additional findings
            </p>
            <ul className="mt-2 space-y-2 text-sm text-foreground">
              {props.snapshot.quickWins.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Risk estimate: {props.snapshot.riskEstimate}
            </p>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-card via-card/80 to-transparent" />
        </div>
      </div>

      <EmailCapturePanel
        initialEmail={props.initialEmail}
        onSubmit={props.onDownload}
      />

      <div className="pt-1">
        <Link href="/dashboard/gap-engine">
          <Button variant="ghost" className="text-xs text-muted-foreground">
            Unlock Full Competitive Audit
          </Button>
        </Link>
      </div>
    </div>
  );
}
