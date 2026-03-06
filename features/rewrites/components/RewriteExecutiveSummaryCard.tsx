"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { Scale } from "lucide-react";
import { buildRewriteOutputViewModel } from "@/features/rewrites/services/rewriteOutputViewModel";

type RewriteExecutiveSummaryCardProps = {
  output: string;
  compareMode: boolean;
  confidenceOverride?: string | null;
};

export function RewriteExecutiveSummaryCard({
  output,
  compareMode,
  confidenceOverride,
}: RewriteExecutiveSummaryCardProps) {
  const model = useMemo(() => buildRewriteOutputViewModel(output), [output]);
  const bullets = model.summaryBullets;
  const confidence = confidenceOverride;
  const summaryParagraph = bullets.join(" ");
  const summaryLead =
    bullets.length >= 2
      ? "Primary changes and expected impact"
      : "Highest-signal change from this rewrite";
  const sanitizeUrl = (url: string) => {
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
  };

  if (compareMode || output.trim().length === 0 || bullets.length === 0) {
    return null;
  }

  return (
      <section className="rounded-xl border border-border/60 bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-base font-semibold text-foreground">
              Executive Rewrite Summary
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{summaryLead}</p>
          </div>
          {confidence ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Scale className="h-3.5 w-3.5" />
              Confidence: {confidence}
            </span>
        ) : null}
      </div>
      <div className="mt-3 text-[15px] leading-relaxed text-foreground/90">
        <ReactMarkdown
          skipHtml
          allowedElements={
            ["strong", "em", "code", "a", "p"] as unknown as string[]
          }
          urlTransform={(url) => sanitizeUrl(url)}
          components={{
            p: ({ node, ...props }) => <span {...props} />,
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
          {summaryParagraph}
        </ReactMarkdown>
      </div>
    </section>
  );
}
