"use client";

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
import {
  CheckCircle2,
  ChevronDown,
  GitCompareArrows,
  Info,
  Upload,
} from "lucide-react";
import { useRef } from "react";

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

function formatStatusLabel(status: ConversionGapReport["status"]) {
  if (!status) {
    return "";
  }
  return status.charAt(0).toUpperCase() + status.slice(1);
}

type ReportHeaderProps = {
  report: ConversionGapReport;
  exportRestricted?: boolean;
};

export function ReportHeader({
  report,
  exportRestricted = false,
}: ReportHeaderProps) {
  const exportClosedByPointerRef = useRef(false);
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
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Report detail
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-foreground">
              {report.company}
            </h1>
            <Badge variant="chart-3">{formatStatusLabel(report.status)}</Badge>
          </div>
          <div className="grid gap-3 pt-1 text-sm sm:grid-cols-[minmax(0,0.75fr)_minmax(0,1.5fr)_minmax(0,0.75fr)]">
            <div className="sm:pr-4 sm:border-r sm:border-border/60">
              <p className="text-sm font-medium text-muted-foreground">
                ICP Role
              </p>
              <p className="mt-1 text-foreground">{report.segment}</p>
            </div>
            <div className="sm:px-4 sm:border-r sm:border-border/60">
              <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                <span>Confidence</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5" />
                    </TooltipTrigger>
                    <TooltipContent className="font-normal">
                      Confidence reflects data completeness and model certainty.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="mt-1 flex items-center gap-2 text-foreground">
                <Badge variant="chart-3" className="px-1.5 py-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="sr-only">Confidence verified</span>
                </Badge>
                <span>{report.confidenceScore}%</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                <span>Positioning {report.sectionConfidence.positioning}%</span>
                <span>Objections {report.sectionConfidence.objections}%</span>
                <span>Differentiation {report.sectionConfidence.differentiation}%</span>
                <span>Scoring {report.sectionConfidence.scoring}%</span>
              </div>
            </div>
            <div className="sm:pl-4">
              <p className="text-sm font-medium text-muted-foreground">
                Last updated
              </p>
              <p className="mt-1 text-foreground">
                {formatDate(report.createdAt)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/dashboard/reports">Back to reports</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/reports/${report.id}/compare`}>
              <GitCompareArrows className="h-4 w-4" />
              Compare runs
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={exportUnavailable}>
                <Upload className="h-4 w-4" />
                Export
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48"
              onPointerDownCapture={() => {
                exportClosedByPointerRef.current = true;
              }}
              onPointerDownOutside={() => {
                exportClosedByPointerRef.current = true;
              }}
              onInteractOutside={() => {
                exportClosedByPointerRef.current = true;
              }}
              onCloseAutoFocus={(event) => {
                if (exportClosedByPointerRef.current) {
                  event.preventDefault();
                }
                exportClosedByPointerRef.current = false;
              }}
            >
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
