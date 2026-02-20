"use client";

import Link from "next/link";
import { AppInfo } from "@/lib/config/appInfo";
import { Badge } from "@/components/ui/badge";
import {
  useStatusSummary,
  type StatusSummaryState,
} from "@/features/status/hooks/useStatusSummary";
import type { SystemStatusLevel } from "@/features/status/types/status.types";

function dotClass(level: SystemStatusLevel) {
  if (level === "operational") return "bg-emerald-500";
  if (level === "degraded") return "bg-amber-500";
  if (level === "partial_outage") return "bg-orange-500";
  return "bg-red-600";
}

function renderStatus(summary: StatusSummaryState) {
  if (summary.isLoading) {
    return (
      <span className="text-xs text-muted-foreground/80">
        Checking status...
      </span>
    );
  }

  if (summary.isError) {
    return (
      <Link
        href="/status"
        className="text-xs text-muted-foreground/80 underline underline-offset-4 transition-colors hover:text-foreground"
      >
        Status unavailable
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Badge variant="outline" className="h-5 px-2 text-[10px]">
        v{AppInfo.version}
      </Badge>
      <span
        className={`inline-block h-2 w-2 rounded-full ${dotClass(summary.level)}`}
      />
      <span className="whitespace-nowrap">{summary.label}</span>
      <Link
        href="/status"
        className="text-muted-foreground/80 underline underline-offset-4 transition-colors hover:text-foreground"
      >
        View status
      </Link>
    </div>
  );
}

export default function DashboardFooter() {
  const status = useStatusSummary();

  return (
    <footer className="mt-4 px-6 py-4 text-xs text-muted-foreground">
      <hr className="mb-4 border-0 border-t border-border/70" />
      <div className="flex flex-col gap-3 py-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span>
            © {new Date().getFullYear()} {AppInfo.name}
          </span>
          <span aria-hidden="true">•</span>
          <Link
            href="/docs"
            className="underline underline-offset-4 transition-colors hover:text-foreground"
          >
            Docs
          </Link>
        </div>
        {renderStatus(status)}
      </div>
    </footer>
  );
}
