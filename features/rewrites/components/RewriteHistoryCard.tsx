"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RewriteStudioInitialData } from "@/features/rewrites/types/rewrites.types";

type RewriteHistoryItem = NonNullable<
  RewriteStudioInitialData["historyVersions"]
>[number];

type RewriteHistoryCardProps = {
  item: RewriteHistoryItem;
  timestampLabel: string;
  busyAction?: "open" | "restore" | null;
  actionsDisabled?: boolean;
  onOpen: () => void;
  onRestore: () => void;
};

export function RewriteHistoryCard({
  item,
  timestampLabel,
  busyAction = null,
  actionsDisabled = false,
  onOpen,
  onRestore,
}: RewriteHistoryCardProps) {
  const hypothesisType = item.hypothesis?.type
    ? item.hypothesis.type.replaceAll("_", " ")
    : null;

  return (
    <div className="rounded-lg border border-border/60 bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">
          {item.rewriteType === "pricing" ? "Pricing" : "Homepage"}
        </Badge>
        <Badge variant="secondary">
          {item.isControl ? "Control" : "Treatment"}
        </Badge>
        <Badge variant="secondary">Saved</Badge>
        {item.tone ? <Badge variant="secondary">{item.tone}</Badge> : null}
        {item.isWinner ? <Badge variant="secondary">Winner</Badge> : null}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {timestampLabel} | {item.requestRef}
      </p>
      {item.experimentGroupId ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Experiment: {item.experimentGroupId}
        </p>
      ) : null}
      {hypothesisType ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Hypothesis: {hypothesisType}
          {item.hypothesis?.minimumDeltaLevel
            ? ` | Delta ${item.hypothesis.minimumDeltaLevel}`
            : ""}
        </p>
      ) : null}
      {item.emphasis && item.emphasis.length > 0 ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Emphasis: {item.emphasis.join(", ")}
        </p>
      ) : null}
      <p className="mt-3 line-clamp-2 text-sm text-foreground/90">
        {item.outputMarkdown}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpen}
          disabled={actionsDisabled}
        >
          {busyAction === "open" ? "Opening..." : "Open"}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onRestore}
          disabled={actionsDisabled}
        >
          {busyAction === "restore" ? "Restoring..." : "Restore"}
        </Button>
      </div>
    </div>
  );
}
