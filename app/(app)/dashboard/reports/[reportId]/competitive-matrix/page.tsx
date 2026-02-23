import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { Button } from "@/components/ui/button";
import { CompetitiveMatrix } from "@/features/conversion-gap/components/CompetitiveMatrix";
import { getGapReportForUser } from "@/features/reports/services/gapReportReadService";

type CompetitiveMatrixPageProps = {
  params: Promise<{ reportId: string }>;
};

export default async function CompetitiveMatrixPage({
  params,
}: CompetitiveMatrixPageProps) {
  const { reportId } = await params;
  const user = await requireUser();
  const reportExecution = await getGapReportForUser(reportId, user.id);

  if (!reportExecution) {
    notFound();
  }

  if (!reportExecution.report) {
    if (reportExecution.status === "completed") {
      return (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <h1 className="text-2xl font-semibold text-foreground">
            Competitive matrix unavailable
          </h1>
          <p className="text-sm text-muted-foreground">
            Report completed but the matrix payload could not be loaded.
          </p>
          <Button asChild variant="secondary">
            <Link href={`/dashboard/reports/${reportId}`}>Back to report</Link>
          </Button>
        </div>
      );
    }

    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Competitive matrix not ready
        </h1>
        <p className="text-sm text-muted-foreground">
          The matrix will be available after analysis completes.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboard/gap-engine">Run new analysis</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/dashboard/reports/${reportId}`}>Back to report</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Competitive matrix
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">
            Full competitive matrix
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Detailed competitor strength, weakness, and counter-positioning analysis.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href={`/dashboard/reports/${reportId}`}>Back to report</Link>
        </Button>
      </div>

      <CompetitiveMatrix report={reportExecution.report} />
    </div>
  );
}
