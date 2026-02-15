import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { Button } from "@/components/ui/button";
import { fetchPositioningMap } from "@/features/positioning-map/services/positioningMapService";
import { PositioningMapChart } from "@/features/positioning-map/components/PositioningMapChart";
import { InsightsPanel } from "@/features/positioning-map/components/InsightsPanel";

type PositioningMapPageProps = {
  params: Promise<{ reportId: string }>;
};

export default async function PositioningMapPage({
  params,
}: PositioningMapPageProps) {
  const { reportId } = await params;
  await requireUser();

  const result = await fetchPositioningMap(reportId);

  if (result.status === "not-found") {
    notFound();
  }

  if (result.status === "forbidden") {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Access denied
        </h1>
        <p className="text-sm text-muted-foreground">
          You do not have access to this positioning analysis.
        </p>
        <Button asChild variant="secondary">
          <Link href={`/dashboard/reports/${reportId}`}>Back to report</Link>
        </Button>
      </div>
    );
  }

  if (result.status === "error") {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Positioning intelligence failed
        </h1>
        <p className="text-sm text-muted-foreground">
          We could not generate positioning insights. Try again.
        </p>
        <Button asChild variant="secondary">
          <Link href={`/dashboard/reports/${reportId}`}>Back to report</Link>
        </Button>
      </div>
    );
  }

  if (!result.data) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="rounded-2xl border border-border/60 bg-card p-8">
          <h1 className="text-2xl font-semibold text-foreground">
            Positioning analysis not generated yet.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Trigger a fresh analysis to build the strategic positioning map.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/dashboard/gap-engine">Generate Positioning Map</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={`/dashboard/reports/${reportId}`}>Back to report</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Positioning map
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">
            Strategic positioning intelligence
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Competitive clarity across differentiation and messaging overlap.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href={`/dashboard/reports/${reportId}`}>Back to report</Link>
        </Button>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <PositioningMapChart data={result.data} />
        <InsightsPanel insights={result.data.insights} />
      </div>
    </div>
  );
}
