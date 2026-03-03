"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import {
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RewriteType } from "@/features/rewrites/types/rewrites.types";
import { buildRewriteOutputViewModel } from "@/features/rewrites/services/rewriteOutputViewModel";

type RewriteOutputPanelProps = {
  rewriteType: RewriteType;
  running: boolean;
  output: string;
  requestRef: string | null;
  error: string | null;
  onRetry: () => void;
  metadata?: {
    experimentId?: string | null;
    versionNumber?: number | null;
    parentRequestRef?: string | null;
    isWinner?: boolean;
    winnerLabel?: string | null;
    strategySnapshot?: string | null;
    deltaMetrics?: Record<string, unknown> | null;
    idempotentReplay?: boolean;
  };
};

function filenameFor(type: RewriteType) {
  return `${type}-rewrite-${new Date().toISOString().slice(0, 10)}.md`;
}

const ALLOWED_MARKDOWN_ELEMENTS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "strong",
  "em",
  "ul",
  "ol",
  "li",
  "blockquote",
  "code",
  "pre",
  "hr",
  "a",
] as const;

function sanitizeUrl(url: string) {
  if (url.startsWith("#")) {
    return url;
  }

  if (
    url.startsWith("https://") ||
    url.startsWith("http://") ||
    url.startsWith("mailto:") ||
    url.startsWith("tel:")
  ) {
    return url;
  }

  return "";
}

function resolveDeltaScore(
  deltaMetrics: Record<string, unknown> | null | undefined,
): { label: string; value: string } | null {
  if (!deltaMetrics) {
    return null;
  }
  const similarity = deltaMetrics.lexical_similarity;
  if (typeof similarity !== "number" || !Number.isFinite(similarity)) {
    return null;
  }

  const variation = Math.max(0, Math.min(1, 1 - similarity));
  const pct = Math.round(variation * 100);
  if (variation >= 0.45) {
    return { label: "Delta score", value: `${pct}% (strong)` };
  }
  if (variation >= 0.3) {
    return { label: "Delta score", value: `${pct}% (moderate)` };
  }
  return { label: "Delta score", value: `${pct}% (light)` };
}

export function RewriteOutputPanel({
  rewriteType,
  running,
  output,
  requestRef,
  error,
  onRetry,
  metadata,
}: RewriteOutputPanelProps) {
  const filename = useMemo(() => filenameFor(rewriteType), [rewriteType]);
  const outputViewModel = useMemo(
    () => buildRewriteOutputViewModel(output),
    [output],
  );
  const [copiedError, setCopiedError] = useState(false);
  const deltaScore = resolveDeltaScore(metadata?.deltaMetrics);

  const handleCopyError = async () => {
    if (!error) {
      return;
    }
    await navigator.clipboard.writeText(error);
    setCopiedError(true);
    setTimeout(() => setCopiedError(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-6 pt-3">
      <div className="mb-4 rounded-md border border-border/60 bg-secondary/20 p-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>
            Experiment ID:{" "}
            <span className="font-medium text-foreground/90">
              {metadata?.experimentId ?? "Pending"}
            </span>
          </span>
          <span>
            Version:{" "}
            <span className="font-medium text-foreground/90">
              {metadata?.versionNumber ?? "Pending"}
            </span>
          </span>
          {metadata?.parentRequestRef ? (
            <span>
              Parent:{" "}
              <span className="font-medium text-foreground/90">
                {metadata.parentRequestRef}
              </span>
            </span>
          ) : null}
          {metadata?.isWinner ? (
            <span className="font-medium text-foreground/90">
              Winner{metadata.winnerLabel ? ` (${metadata.winnerLabel})` : ""}
            </span>
          ) : null}
          {deltaScore ? (
            <span>
              {deltaScore.label}:{" "}
              <span className="font-medium text-foreground/90">
                {deltaScore.value}
              </span>
            </span>
          ) : null}
          {metadata?.idempotentReplay ? (
            <span className="font-medium text-amber-500">
              Not a new variation
            </span>
          ) : null}
        </div>
        {metadata?.strategySnapshot ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Strategy snapshot:{" "}
            <span className="text-foreground/90">{metadata.strategySnapshot}</span>
          </p>
        ) : null}
      </div>

      {running ? (
        <div className="flex flex-col flex-wrap items-start justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            Streaming in progress...
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm font-medium text-destructive">
            Rewrite generation failed
          </p>
          <p className="mt-1 text-sm text-foreground/90">{error}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={onRetry}
            >
              Retry
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void handleCopyError()}
            >
              {copiedError ? "Copied" : "Copy error details"}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-4 h-135 overflow-y-auto bg-transparent">
        {running && !output ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating rewrite...
            </div>
            <div className="animate-pulse space-y-4 rounded-lg border border-border/60 bg-card">
              <div className="h-4 w-48 rounded bg-muted/60" />
              <div className="h-3 w-full rounded bg-muted/40" />
              <div className="h-3 w-5/6 rounded bg-muted/40" />
              <div className="h-3 w-4/6 rounded bg-muted/40" />
            </div>
            <div className="animate-pulse space-y-4 rounded-lg border border-border/60 bg-card">
              <div className="h-4 w-32 rounded bg-muted/60" />
              <div className="h-3 w-full rounded bg-muted/40" />
              <div className="h-3 w-11/12 rounded bg-muted/40" />
              <div className="h-3 w-3/4 rounded bg-muted/40" />
            </div>
            <div className="animate-pulse space-y-4 rounded-lg border border-border/60 bg-card">
              <div className="h-4 w-40 rounded bg-muted/60" />
              <div className="h-3 w-full rounded bg-muted/40" />
              <div className="h-3 w-10/12 rounded bg-muted/40" />
            </div>
          </div>
        ) : output ? (
          <div className="space-y-4">
            <div className="mt-3 space-y-4">
              {outputViewModel.copySections.length === 0 ? (
                <div className="rounded-md border border-border/50 bg-secondary/20 p-3">
                  <p className="text-sm text-muted-foreground">
                    Structured rewrite sections are unavailable for this output.
                  </p>
                </div>
              ) : null}
              {outputViewModel.copySections.map((section) => (
                <div
                  key={section.title}
                  className="rounded-md border border-border/50 bg-secondary/30 p-3"
                >
                  <p className="text-sm font-semibold text-foreground">
                    {section.title}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">
                    <ReactMarkdown
                      skipHtml
                      allowedElements={
                        ALLOWED_MARKDOWN_ELEMENTS as unknown as string[]
                      }
                      urlTransform={(url) => sanitizeUrl(url)}
                      components={{
                        a: ({ node, ...props }) => (
                          <a
                            {...props}
                            target="_blank"
                            rel="noreferrer noopener nofollow"
                            className="text-primary underline-offset-4 hover:underline"
                          />
                        ),
                      }}
                    >
                      {section.body}
                    </ReactMarkdown>
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border/60 bg-card p-4">
            <p className="text-sm font-semibold text-foreground">
              Rewrite Studio creates conversion-ready copy from your current
              messaging.
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Add a website URL or paste your current copy.</li>
              <li>
                Set strategic context and rewrite strategy before generating.
              </li>
              <li>Use constraints for must-include or avoid instructions.</li>
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              Need guidance?{" "}
              <Link
                href="/docs"
                className="text-primary underline-offset-4 hover:underline"
              >
                Open docs
              </Link>
              .
            </p>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>Filename: {filename}</span>
        <span>Request: {requestRef ?? "N/A"}</span>
      </div>
    </div>
  );
}
