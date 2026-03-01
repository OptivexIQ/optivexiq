"use client";

import ReactMarkdown from "react-markdown";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildRewriteOutputViewModel } from "@/features/rewrites/services/rewriteOutputViewModel";

type RewriteComparisonPanelProps = {
  currentOutput: string;
  baselineOutput: string;
  compareBaselineOptions: Array<{
    requestRef: string;
    label: string;
  }>;
  selectedBaselineRef: string | null;
  onSelectBaseline: (requestRef: string) => void;
  onExitCompare: () => void;
};

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

export function RewriteComparisonPanel({
  currentOutput,
  baselineOutput,
  compareBaselineOptions,
  selectedBaselineRef,
  onSelectBaseline,
  onExitCompare,
}: RewriteComparisonPanelProps) {
  const currentViewModel = buildRewriteOutputViewModel(currentOutput);
  const baselineViewModel = buildRewriteOutputViewModel(baselineOutput);
  const hasBaselineOptions = compareBaselineOptions.length > 0;
  const baselineSections =
    baselineViewModel.copySections.length > 0
      ? baselineViewModel.copySections
      : [{ title: "Rewrite", body: baselineOutput }];
  const currentSections =
    currentViewModel.copySections.length > 0
      ? currentViewModel.copySections
      : [{ title: "Rewrite", body: currentOutput }];

  return (
    <section className="rounded-xl border border-border/60 bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground/85">Rewrite comparison</p>
          <p className="text-xs text-muted-foreground">
            Review baseline against current rewrite side by side.
          </p>
        </div>
        <Button variant="outline" onClick={onExitCompare}>
          <ArrowLeftRight className="h-4 w-4" />
          Exit compare
        </Button>
      </div>

      {hasBaselineOptions ? (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Select baseline
          </p>
          <Select
            value={selectedBaselineRef ?? undefined}
            onValueChange={onSelectBaseline}
          >
            <SelectTrigger className="w-full sm:w-105">
              <SelectValue placeholder="Select previous version" />
            </SelectTrigger>
            <SelectContent>
              {compareBaselineOptions.map((option) => (
                <SelectItem key={option.requestRef} value={option.requestRef}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Previous
          </p>
          {baselineSections.map((section) => (
            <section
              key={`previous-${section.title}`}
              className="rounded-lg border border-border/60 bg-card p-3"
            >
              <p className="text-sm font-semibold text-foreground">{section.title}</p>
              <div className="mt-2 text-sm text-foreground/90">
                <ReactMarkdown
                  skipHtml
                  allowedElements={ALLOWED_MARKDOWN_ELEMENTS as unknown as string[]}
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
              </div>
            </section>
          ))}
        </div>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Current
          </p>
          {currentSections.map((section) => (
            <section
              key={`current-${section.title}`}
              className="rounded-lg border border-border/60 bg-card p-3"
            >
              <p className="text-sm font-semibold text-foreground">{section.title}</p>
              <div className="mt-2 text-sm text-foreground/90">
                <ReactMarkdown
                  skipHtml
                  allowedElements={ALLOWED_MARKDOWN_ELEMENTS as unknown as string[]}
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
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}

