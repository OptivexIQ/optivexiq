"use client";

import { Button } from "@/components/ui/button";

type RewriteFailurePanelProps = {
  title: string;
  detail: string;
  recovery?: string | null;
  copied: boolean;
  onRetry: () => void;
  onCopyError: () => void;
};

export function RewriteFailurePanel({
  title,
  detail,
  recovery,
  copied,
  onRetry,
  onCopyError,
}: RewriteFailurePanelProps) {
  return (
    <div className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 p-3">
      <p className="text-sm font-medium text-destructive">{title}</p>
      <p className="mt-1 text-sm text-foreground/90">{detail}</p>
      {recovery ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Recommended action: {recovery}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="destructive" onClick={onRetry}>
          Retry
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCopyError}>
          {copied ? "Copied" : "Copy error details"}
        </Button>
      </div>
    </div>
  );
}
