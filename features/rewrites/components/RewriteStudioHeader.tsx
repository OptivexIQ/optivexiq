"use client";
import { History, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type RewriteStudioHeaderProps = {
  disableActions?: boolean;
  onOpenHistory: () => void;
  onNewRewrite: () => void;
};

export function RewriteStudioHeader({
  disableActions,
  onOpenHistory,
  onNewRewrite,
}: RewriteStudioHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Rewrite Studio
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">
          On-demand homepage and pricing rewrites
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Run controlled rewrite experiments, compare saved versions, and export
          validated output without leaving the studio.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={disableActions}
          onClick={onOpenHistory}
        >
          <History className="h-4 w-4" />
          Version History
        </Button>
        <Button type="button" disabled={disableActions} onClick={onNewRewrite}>
          <Plus className="h-4 w-4" />
          New Rewrite
        </Button>
      </div>
    </div>
  );
}
