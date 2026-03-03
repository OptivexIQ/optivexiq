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
  showRunGapEngine?: boolean;
  onOpenHistory: () => void;
  onDuplicate: () => void;
  onRefine: () => void;
  onCopy: () => void | Promise<void>;
  onEnterCompare: () => void;
  onExport: (format: RewriteExportFormat) => void;
};

export function RewriteOutputActionBar({
  canExport,
  canCompare,
  running,
  showRunGapEngine = false,
  onOpenHistory,
  onDuplicate,
  onRefine,
  onCopy,
  onEnterCompare,
  onExport,
}: RewriteOutputActionBarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="sticky bottom-0 z-20 -mx-6 -mb-6 mt-auto border-t border-border/60 bg-background/95 px-6 py-3 backdrop-blur supports-backdrop-filter:bg-background/85">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="xs" onClick={onOpenHistory}>
            <History className="h-4 w-4" />
            Version history
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={onDuplicate}
            disabled={!canExport || running}
          >
            <Sparkles className="h-4 w-4" />
            Duplicate
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={onRefine}
            disabled={!canExport || running}
          >
            <Sparkles className="h-4 w-4" />
            Refine
          </Button>
          <Button
            variant="secondary"
            size="xs"
            onClick={() => void handleCopy()}
            disabled={!canExport}
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
            disabled={!canExport || !canCompare}
          >
            <SplitSquareHorizontal className="h-4 w-4" />
            Compare versions
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="xs" disabled={!canExport}>
                <Download className="h-4 w-4" />
                Export
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
    </div>
  );
}
