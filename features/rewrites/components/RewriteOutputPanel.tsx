"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import {
  Check,
  ChevronDown,
  Copy,
  Download,
  FileCode2,
  FileType2,
  FileText,
  Loader2,
  Save,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  RewriteExportFormat,
  RewriteType,
} from "@/features/rewrites/types/rewrites.types";
import { buildRewriteOutputViewModel } from "@/features/rewrites/services/rewriteOutputViewModel";

type RewriteOutputPanelProps = {
  rewriteType: RewriteType;
  running: boolean;
  output: string;
  previousOutput: string;
  compareMode: boolean;
  compareBaselineOptions: Array<{
    requestRef: string;
    label: string;
  }>;
  selectedBaselineRef: string | null;
  requestRef: string | null;
  error: string | null;
  onCopy: () => void | Promise<void>;
  onExport: (format: RewriteExportFormat) => void;
  onSaveVersion: () => void;
  onDuplicate: () => void;
  onRefine: () => void;
  onToggleCompare: () => void;
  onSelectBaseline: (requestRef: string) => void;
  onRetry: () => void;
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

export function RewriteOutputPanel({
  rewriteType,
  running,
  output,
  previousOutput,
  compareMode,
  compareBaselineOptions,
  selectedBaselineRef,
  requestRef,
  error,
  onCopy,
  onExport,
  onSaveVersion,
  onDuplicate,
  onRefine,
  onToggleCompare,
  onSelectBaseline,
  onRetry,
}: RewriteOutputPanelProps) {
  const canExport = output.trim().length > 0;
  const filename = useMemo(() => filenameFor(rewriteType), [rewriteType]);
  const outputViewModel = useMemo(
    () => buildRewriteOutputViewModel(output),
    [output],
  );
  const previousViewModel = useMemo(
    () => buildRewriteOutputViewModel(previousOutput),
    [previousOutput],
  );
  const [copied, setCopied] = useState(false);
  const [copiedError, setCopiedError] = useState(false);

  const hasPrevious =
    previousOutput.trim().length > 0 || compareBaselineOptions.length > 0;
  const hasComparableData =
    previousOutput.trim().length > 0 ||
    (selectedBaselineRef !== null && selectedBaselineRef.length > 0);

  const handleCopy = async () => {
    await onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyError = async () => {
    if (!error) {
      return;
    }
    await navigator.clipboard.writeText(error);
    setCopiedError(true);
    setTimeout(() => setCopiedError(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground/85">
            Rewrite output
          </p>
          <p className="text-xs text-muted-foreground">
            {running ? "Streaming in progress..." : "Markdown-ready output"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={onSaveVersion}
            disabled={!canExport}
          >
            <Save className="h-4 w-4" />
            Save version
          </Button>
          <Button variant="outline" onClick={onDuplicate} disabled={!canExport}>
            <Sparkles className="h-4 w-4" />
            Duplicate
          </Button>
          <Button variant="outline" onClick={onRefine} disabled={!canExport}>
            <Sparkles className="h-4 w-4" />
            Refine
          </Button>
          <Button
            variant="outline"
            onClick={onToggleCompare}
            disabled={!canExport || !hasPrevious}
          >
            <SplitSquareHorizontal className="h-4 w-4" />
            {compareMode ? "Exit compare" : "Compare"}
          </Button>
          <Button
            variant="secondary"
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={!canExport}>
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

      {compareMode ? (
        <div className="mt-3">
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

      <div className="mt-4 h-135 overflow-y-auto rounded-lg border border-border/60 bg-secondary/30 p-4">
        {running && !output ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating rewrite...
            </div>
            <div className="animate-pulse space-y-3 rounded-lg border border-border/60 bg-card p-4">
              <div className="h-4 w-48 rounded bg-muted/60" />
              <div className="h-3 w-full rounded bg-muted/40" />
              <div className="h-3 w-5/6 rounded bg-muted/40" />
              <div className="h-3 w-4/6 rounded bg-muted/40" />
            </div>
            <div className="animate-pulse space-y-3 rounded-lg border border-border/60 bg-card p-4">
              <div className="h-4 w-32 rounded bg-muted/60" />
              <div className="h-3 w-full rounded bg-muted/40" />
              <div className="h-3 w-11/12 rounded bg-muted/40" />
              <div className="h-3 w-3/4 rounded bg-muted/40" />
            </div>
            <div className="animate-pulse space-y-3 rounded-lg border border-border/60 bg-card p-4">
              <div className="h-4 w-40 rounded bg-muted/60" />
              <div className="h-3 w-full rounded bg-muted/40" />
              <div className="h-3 w-10/12 rounded bg-muted/40" />
            </div>
          </div>
        ) : output ? (
          compareMode ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Previous
                </p>
                {hasComparableData ? (
                  previousViewModel.copySections.map((section) => (
                    <section
                      key={`previous-${section.title}`}
                      className="rounded-lg border border-border/60 bg-card p-3"
                    >
                      <p className="text-sm font-semibold text-foreground">
                        {section.title}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">
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
                      </p>
                    </section>
                  ))
                ) : (
                  <section className="rounded-lg border border-border/60 bg-card p-3">
                    <p className="text-sm text-muted-foreground">
                      Select a baseline version to compare.
                    </p>
                  </section>
                )}
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Current
                </p>
                {outputViewModel.copySections.map((section) => (
                  <section
                    key={`current-${section.title}`}
                    className="rounded-lg border border-border/60 bg-card p-3"
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {section.title}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">
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
                    </p>
                  </section>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mt-3 space-y-3">
                {(outputViewModel.copySections.length > 0
                  ? outputViewModel.copySections
                  : [{ title: "Rewrite", body: output }]
                ).map((section) => (
                  <div
                    key={section.title}
                    className="rounded-md border border-border/50 bg-secondary/20 p-3"
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {section.title}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">
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
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )
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
