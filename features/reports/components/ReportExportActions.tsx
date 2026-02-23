import Link from "next/link";
import { Button } from "@/components/ui/button";

type ReportExportActionsProps = {
  reportId: string;
  reportStatus?: "queued" | "running" | "retrying" | "completed" | "failed";
  exportRestricted?: boolean;
};

export function ReportExportActions({
  reportId,
  reportStatus = "completed",
  exportRestricted = false,
}: ReportExportActionsProps) {
  const isInProgress =
    reportStatus === "queued" ||
    reportStatus === "running" ||
    reportStatus === "retrying";
  const exportDisabled = exportRestricted || isInProgress || reportStatus === "failed";
  const helperText = exportRestricted
    ? "Exports are restricted for this workspace."
    : isInProgress
      ? "Export is available after report completion."
      : reportStatus === "failed"
        ? "Failed reports are not exportable."
        : "Available formats: PDF, HTML, TXT, and JSON. Exports are available for completed reports only.";

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground/85">
            Export actions
          </p>
          <p className="mt-2 text-sm text-foreground">
            Deliver this report to your revenue and product teams.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {helperText}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {exportDisabled ? (
            <>
              <Button disabled>Export PDF</Button>
              <Button variant="outline" disabled>
                Export HTML
              </Button>
              <Button variant="outline" disabled>
                Export JSON
              </Button>
              <Button variant="outline" disabled>
                Copy sections
              </Button>
            </>
          ) : (
            <>
              <Button asChild>
                <Link href={`/api/reports/${reportId}/export?format=pdf`}>
                  Export PDF
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/api/reports/${reportId}/export?format=html`}>
                  Export HTML
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/api/reports/${reportId}/export?format=json`}>
                  Export JSON
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/api/reports/${reportId}/export?format=txt`}>
                  Copy sections
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
