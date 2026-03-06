"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Loader2 } from "lucide-react";
import type { RewriteType } from "@/features/rewrites/types/rewrites.types";
import { RewriteFailurePanel } from "@/features/rewrites/components/RewriteFailurePanel";
import { RewriteSectionNav } from "@/features/rewrites/components/RewriteSectionNav";
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

function classifyRewriteError(error: string | null): {
  title: string;
  detail: string;
  recovery: string;
} | null {
  if (!error) {
    return null;
  }

  if (/structured contract validation/i.test(error)) {
    return {
      title: "Structured output validation failed",
      detail:
        "The model returned content that did not satisfy the required rewrite section contract.",
      recovery:
        "Retry the run or tighten the experiment contract so the model has fewer formatting degrees of freedom.",
    };
  }

  if (
    /metrics contract validation|shift stats contract validation/i.test(error)
  ) {
    return {
      title: "Metrics validation failed",
      detail:
        "The rewrite body completed, but the required shift metrics could not be validated.",
      recovery:
        "Retry the run or simplify the rewrite instructions so metrics extraction remains stable.",
    };
  }

  if (/meaningful variation/i.test(error)) {
    return {
      title: "Variation strength below threshold",
      detail:
        "The generated treatment was too close to the baseline to qualify as a valid experiment.",
      recovery:
        "Increase the delta level or change treatment variables to create a stronger variation.",
    };
  }

  return {
    title: "Rewrite generation failed",
    detail: error,
    recovery:
      "Retry the run. If the issue persists, adjust the prompt inputs or provider settings.",
  };
}

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

function slugifySectionTitle(title: string, index: number) {
  const normalized = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `rewrite-section-${normalized || "section"}-${index}`;
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
  const errorState = classifyRewriteError(error);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sectionIds = useMemo(
    () =>
      outputViewModel.copySections.map((section, index) => ({
        id: slugifySectionTitle(section.title, index),
        label: section.title,
      })),
    [outputViewModel.copySections],
  );

  useEffect(() => {
    setActiveSectionId(sectionIds[0]?.id ?? null);
  }, [sectionIds]);

  const handleCopyError = async () => {
    if (!error) {
      return;
    }
    await navigator.clipboard.writeText(error);
    setCopiedError(true);
    setTimeout(() => setCopiedError(false), 2000);
  };

  const handleSelectSection = (id: string) => {
    setActiveSectionId(id);
    const container = scrollContainerRef.current;
    const target = container?.querySelector<HTMLElement>(`#${id}`);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="pt-3">
      <div className="mb-4 rounded-md border border-border/60 bg-secondary/20 p-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>Validated rewrite output workspace</span>
          {metadata?.versionNumber ? (
            <span>Version {metadata.versionNumber}</span>
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
            <span className="text-foreground/90">
              {metadata.strategySnapshot}
            </span>
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
        <RewriteFailurePanel
          title={errorState?.title ?? "Rewrite generation failed"}
          detail={errorState?.detail ?? error}
          recovery={errorState?.recovery}
          copied={copiedError}
          onRetry={onRetry}
          onCopyError={() => void handleCopyError()}
        />
      ) : null}

      {outputViewModel.copySections.length > 0 ? (
        <div className="mt-4">
          <RewriteSectionNav
            items={sectionIds}
            activeId={activeSectionId}
            onSelect={handleSelectSection}
          />
        </div>
      ) : null}

      <div
        ref={scrollContainerRef}
        className="mt-4 bg-transparent"
      >
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
                <div className="rounded-md bg-secondary/10 p-3">
                  <p className="text-sm text-muted-foreground">
                    Structured rewrite sections are unavailable for this output.
                  </p>
                </div>
              ) : null}
              {outputViewModel.copySections.map((section, index) => {
                const sectionId =
                  sectionIds[index]?.id ??
                  slugifySectionTitle(section.title, index);
                return (
                  <div
                    key={sectionId}
                    id={sectionId}
                    className="rounded-md bg-secondary/20 p-3"
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
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border/60 bg-card p-4">
            <p className="text-sm font-semibold text-foreground">
              Run a controlled rewrite experiment from your current messaging.
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Define the source page and target copy to rewrite.</li>
              <li>
                Set the experiment contract before generating a variation.
              </li>
              <li>
                Use constraints to preserve required proof, tone, or CTA rules.
              </li>
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
    </div>
  );
}
