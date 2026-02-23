import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ConversionGapReport } from "@/features/reports/types/report.types";
import { ChevronDown, Info } from "lucide-react";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
});

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return dateFormatter.format(date);
}

type ReportHeaderProps = {
  report: ConversionGapReport;
  exportRestricted?: boolean;
};

export function ReportHeader({
  report,
  exportRestricted = false,
}: ReportHeaderProps) {
  const exportUnavailable =
    exportRestricted ||
    report.status === "queued" ||
    report.status === "running" ||
    report.status === "failed";
  const exportReason = exportRestricted
    ? "Export restricted for this workspace."
    : report.status === "failed"
      ? "Failed reports are not exportable."
      : "Export is available after report completion.";

  return (
    <div className="rounded-xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-primary">Report detail</p>
          <h1 className="text-2xl font-semibold text-foreground">
            {report.company}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>{report.segment}</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground" />
            <span>Last updated {formatDate(report.createdAt)}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="chart-3">{report.status}</Badge>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 rounded-full border border-border/60 px-3 py-1 text-sm text-muted-foreground">
                  <Info className="h-3.5 w-3.5" />
                  Confidence {report.confidenceScore}%
                </div>
              </TooltipTrigger>
              <TooltipContent>
                Confidence reflects data completeness and model certainty.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button variant="outline" asChild>
            <Link href="/dashboard/reports">Back to reports</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/reports/${report.id}/compare`}>Compare runs</Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" disabled={exportUnavailable}>
                Export
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Export report</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {exportUnavailable ? (
                <DropdownMenuItem disabled>{exportReason}</DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={`/api/reports/${report.id}/export?format=pdf`}>
                      Export PDF
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/api/reports/${report.id}/export?format=html`}>
                      Export HTML
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/api/reports/${report.id}/export?format=txt`}>
                      Export TXT
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/api/reports/${report.id}/export?format=json`}>
                      Export JSON
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
