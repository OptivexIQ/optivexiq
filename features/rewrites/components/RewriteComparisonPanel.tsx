"use client";

import ReactMarkdown from "react-markdown";
import { ArrowLeftRight, X } from "lucide-react";
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
  sourceContent: string;
  personaRole: string;
  tone: string;
  length: string;
  emphasis: string[];
  audience?: string;
  constraints?: string;
  baselineTimestampLabel: string;
  currentTimestampLabel: string;
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

function toDisplayLabel(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function RewriteComparisonPanel({
  currentOutput,
  baselineOutput,
  sourceContent,
  personaRole,
  tone,
  length,
  emphasis,
  audience,
  constraints,
  baselineTimestampLabel,
  currentTimestampLabel,
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
    <section className="overflow-hidden rounded-xl bg-linear-to-b from-card to-secondary/20">
      <div className="grid gap-0 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <aside className="bg-background pl-1 pr-5 py-5">
          <div className="space-y-5">
            <section className="bg-transparent">
              <p className="text-sm font-semibold text-muted-foreground">
                Source Baseline
              </p>
              <p className="mt-2 text-sm text-foreground/90">
                Compare your current generation against a previously saved
                rewrite version.
              </p>
              {hasBaselineOptions ? (
                <div className="mt-3">
                  <p className="mb-2 text-sm font-medium text-muted-foreground">
                    Select baseline
                  </p>
                  <Select
                    value={selectedBaselineRef ?? undefined}
                    onValueChange={onSelectBaseline}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select previous version" />
                    </SelectTrigger>
                    <SelectContent>
                      {compareBaselineOptions.map((option) => (
                        <SelectItem
                          key={option.requestRef}
                          value={option.requestRef}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  No saved baseline is available yet. Generate and save a
                  version first.
                </p>
              )}
            </section>
            <section className="bg-transparent">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-muted-foreground">
                  Source Content
                </p>
                <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  Original
                </span>
              </div>
              {sourceContent.trim().length > 0 ? (
                <blockquote className="mt-3 rounded-md border border-border/60 bg-secondary/20 p-3 text-sm italic text-foreground/90">
                  {sourceContent}
                </blockquote>
              ) : (
                <div className="mt-3 rounded-md border border-border/60 bg-secondary/20 p-3">
                  <p className="text-sm text-muted-foreground">
                    No pasted source content was provided for this rewrite.
                  </p>
                </div>
              )}
            </section>

            <section className="bg-transparent">
              <p className="text-sm font-semibold text-muted-foreground">
                Rewrite Strategy
              </p>
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Persona Role
                  </p>
                  <div className="mt-1 rounded-md border border-border/60 bg-secondary/20 px-3 py-2">
                    <p className="text-sm text-foreground/90">
                      {personaRole.trim().length > 0 ? personaRole : "Not set"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Tone &amp; Voice
                  </p>
                  <div className="mt-1 rounded-md border border-border/60 bg-secondary/20 px-3 py-2">
                    <p className="text-sm text-foreground/90">
                      {toDisplayLabel(tone)}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Key Value Pillars
                  </p>
                  <div className="mt-1 rounded-md border border-border/60 bg-secondary/20 px-3 py-2">
                    <div className="flex flex-wrap gap-1.5">
                      {emphasis.length > 0 ? (
                        emphasis.map((item) => (
                          <span
                            key={item}
                            className="rounded bg-secondary/40 px-2 py-0.5 text-xs text-foreground/85"
                          >
                            {toDisplayLabel(item)}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          None
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Constraint: Length
                  </p>
                  <div className="mt-1 rounded-md border border-border/60 bg-secondary/20 px-3 py-2">
                    <p className="text-sm text-foreground/90">
                      {toDisplayLabel(length)}
                    </p>
                  </div>
                </div>
                {audience && audience.trim().length > 0 ? (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Audience
                    </p>
                    <div className="mt-1 rounded-md border border-border/60 bg-secondary/20 px-3 py-2">
                      <p className="text-sm text-foreground/90">{audience}</p>
                    </div>
                  </div>
                ) : null}
                {constraints && constraints.trim().length > 0 ? (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Constraints
                    </p>
                    <div className="mt-1 rounded-md border border-border/60 bg-secondary/20 px-3 py-2">
                      <p className="whitespace-pre-wrap text-sm text-foreground/90">
                        {constraints}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        </aside>

        <div className="border-l border-border/60 bg-secondary/20">
          <div className="flex flex-wrap items-start justify-between gap-3 bg-secondary/20 px-6 py-4">
            <div className="flex items-center justify-between gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              <p className="text-base font-semibold text-foreground">
                Compare Versions
              </p>
            </div>
            <Button variant="outline" onClick={onExitCompare}>
              <X className="h-4 w-4" />
              Exit compare
            </Button>
          </div>
          <div className="grid lg:grid-cols-2">
            <div className="bg-card px-4 py-3">
              <p className="text-xs font-semibold text-muted-foreground">
                Version 1
              </p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">
                  Previous Draft
                </p>
                <p className="text-sm text-muted-foreground">
                  {baselineTimestampLabel}
                </p>
              </div>
            </div>
            <div className="bg-secondary/20 px-4 py-3">
              <p className="text-xs font-semibold text-muted-foreground">
                Version 2
              </p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">
                  Current Generation
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentTimestampLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-2">
            <div className="space-y-3 bg-card/30 p-4">
              {baselineSections.map((section) => (
                <section
                  key={`previous-${section.title}`}
                  className="rounded-lg bg-card p-3"
                >
                  <p className="text-sm font-semibold text-foreground">
                    {section.title}
                  </p>
                  <div className="mt-2 text-sm text-foreground/90">
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
                  </div>
                </section>
              ))}
            </div>
            <div className="space-y-3 bg-secondary/30 p-4">
              {currentSections.map((section) => (
                <section
                  key={`current-${section.title}`}
                  className="rounded-lg bg-card/80 p-3"
                >
                  <p className="text-sm font-semibold text-foreground">
                    {section.title}
                  </p>
                  <div className="mt-2 text-sm text-foreground/90">
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
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
