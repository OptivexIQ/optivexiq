"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  Download,
  FileCode2,
  FileType2,
  FileText,
  History,
  Sparkles,
  SplitSquareHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { RewriteExportFormat } from "@/features/rewrites/types/rewrites.types";

type RewriteOutputActionBarProps = {
  canExport: boolean;
  canCompare: boolean;
  running: boolean;
  exportRunning?: boolean;
  showRunGapEngine?: boolean;
  onOpenHistory: () => void;
  onDuplicate: () => void;
  onRefine: () => void;
  onCopy: () => void | Promise<void>;
  onEnterCompare: () => void;
  onExport: (format: RewriteExportFormat) => void | Promise<void>;
};

export function RewriteOutputActionBar({
  canExport,
  canCompare,
  running,
  exportRunning = false,
  showRunGapEngine = false,
  onOpenHistory,
  onDuplicate,
  onRefine,
  onCopy,
  onEnterCompare,
  onExport,
}: RewriteOutputActionBarProps) {
  const [copied, setCopied] = useState(false);
  const actionsLocked = running || exportRunning;
  const workflowHint = running
    ? "Generation in progress. Refine, duplicate, compare, and export are temporarily locked."
    : exportRunning
      ? "Export in progress. Keep this tab open until the file is prepared."
      : !canExport
        ? "Generate and save a rewrite to unlock refine, compare, copy, and export actions."
        : !canCompare
          ? "Compare mode unlocks when a baseline version is available for this rewrite."
          : "Current output is ready for refinement, comparison, copy, or export.";

  const handleCopy = async () => {
    await onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="sticky bottom-0 z-20 -mx-6 -mb-6 mt-auto border-t border-border/60 bg-linear-to-t from-background via-background/95 to-background/75 px-6 py-3 shadow-[0_-14px_32px_hsl(var(--background)/0.78)] backdrop-blur-md supports-backdrop-filter:bg-background/70">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            onClick={onOpenHistory}
            disabled={actionsLocked}
          >
            <History className="h-4 w-4" />
            Version history
          </Button>
          <Button
            variant="secondary"
            size="xs"
            onClick={onRefine}
            disabled={!canExport || actionsLocked}
          >
            <Sparkles className="h-4 w-4" />
            Refine
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={onDuplicate}
            disabled={!canExport || actionsLocked}
          >
            <Sparkles className="h-4 w-4" />
            Duplicate
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={() => void handleCopy()}
            disabled={!canExport || actionsLocked}
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {showRunGapEngine ? (
            <Button asChild variant="outline" size="xs">
              <Link href="/dashboard/gap-engine">Run Gap Engine</Link>
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="xs"
            onClick={onEnterCompare}
            disabled={!canExport || !canCompare || actionsLocked}
          >
            <SplitSquareHorizontal className="h-4 w-4" />
            Compare versions
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="xs"
                disabled={!canExport || actionsLocked}
              >
                <Download className="h-4 w-4" />
                {exportRunning ? "Exporting..." : "Export"}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onSelect={() => onExport("markdown")}>
                <FileText className="h-4 w-4" />
                Markdown (.md)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onExport("text")}>
                <FileText className="h-4 w-4" />
                Plain text (.txt)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onExport("html")}>
                <FileCode2 className="h-4 w-4" />
                HTML (.html)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onExport("pdf")}>
                <FileType2 className="h-4 w-4" />
                PDF (.pdf)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{workflowHint}</p>
    </div>
  );
}
