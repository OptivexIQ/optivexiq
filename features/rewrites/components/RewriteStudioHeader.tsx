"use client";

import Link from "next/link";
import { History, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type RewriteStudioHeaderProps = {
  disableActions?: boolean;
  onNewRewrite: () => void;
};

export function RewriteStudioHeader({
  disableActions,
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
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" disabled={disableActions}>
          <Link href="/dashboard/rewrites/history">
            <History className="h-4 w-4" />
            Version History
          </Link>
        </Button>
        <Button
          type="button"
          disabled={disableActions}
          onClick={onNewRewrite}
        >
          <Plus className="h-4 w-4" />
          New Rewrite
        </Button>
      </div>
    </div>
  );
}
