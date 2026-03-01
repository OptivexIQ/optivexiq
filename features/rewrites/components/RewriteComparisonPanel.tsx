"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeftRight,
  Check,
  Copy,
  Download,
  FileCode2,
  FileText,
  FileType2,
  Printer,
  X,
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
  currentRequestRef: string | null;
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

function normalizeForDiff(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeSectionKey(title: string) {
  const normalized = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (
    normalized === "faq" ||
    normalized === "faqs" ||
    normalized === "frequently-asked-question" ||
    normalized === "frequently-asked-questions"
  ) {
    return "faq";
  }

  return normalized;
}

function getSectionPriority(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("executive summary") || lower.includes("summary"))
    return 10;
  if (lower.includes("headline")) return 20;
  if (lower.includes("subheadline")) return 30;
  if (lower.includes("primary cta")) return 40;
  if (lower.includes("final cta") || lower.includes("secondary cta")) return 50;
  if (lower.includes("supporting")) return 60;
  if (lower.includes("pricing")) return 70;
  if (lower.includes("rationale")) return 80;
  if (lower.includes("implementation")) return 90;
  return 100;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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
  currentRequestRef,
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
  const baselineSections = useMemo(
    () =>
      baselineViewModel.copySections.length > 0
        ? baselineViewModel.copySections
        : [{ title: "Rewrite", body: baselineOutput }],
    [baselineViewModel.copySections, baselineOutput],
  );
  const currentSections = useMemo(
    () =>
      currentViewModel.copySections.length > 0
        ? currentViewModel.copySections
        : [{ title: "Rewrite", body: currentOutput }],
    [currentViewModel.copySections, currentOutput],
  );
  const [showUnchangedSections, setShowUnchangedSections] = useState(false);
  const [density, setDensity] = useState<"comfortable" | "compact">(
    "comfortable",
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const alignedRows = useMemo(() => {
    const previousByKey = new Map(
      baselineSections.map((section) => [
        normalizeSectionKey(section.title),
        section,
      ]),
    );
    const currentByKey = new Map(
      currentSections.map((section) => [
        normalizeSectionKey(section.title),
        section,
      ]),
    );

    const orderedKeys: string[] = [];
    const firstSeenIndex = new Map<string, number>();
    let seenCounter = 0;
    for (const section of baselineSections) {
      const key = normalizeSectionKey(section.title);
      if (!orderedKeys.includes(key)) {
        orderedKeys.push(key);
        firstSeenIndex.set(key, seenCounter++);
      }
    }
    for (const section of currentSections) {
      const key = normalizeSectionKey(section.title);
      if (!orderedKeys.includes(key)) {
        orderedKeys.push(key);
        firstSeenIndex.set(key, seenCounter++);
      }
    }

    const sortedKeys = [...orderedKeys].sort((a, b) => {
      const aTitle =
        currentByKey.get(a)?.title ?? previousByKey.get(a)?.title ?? "";
      const bTitle =
        currentByKey.get(b)?.title ?? previousByKey.get(b)?.title ?? "";
      const byPriority =
        getSectionPriority(aTitle) - getSectionPriority(bTitle);
      if (byPriority !== 0) {
        return byPriority;
      }
      return (firstSeenIndex.get(a) ?? 0) - (firstSeenIndex.get(b) ?? 0);
    });

    return sortedKeys.map((key) => {
      const previous = previousByKey.get(key);
      const current = currentByKey.get(key);
      const previousBody = previous?.body ?? "";
      const currentBody = current?.body ?? "";
      return {
        key,
        title: current?.title ?? previous?.title ?? "Rewrite",
        previousBody,
        currentBody,
        hasPrevious: previousBody.trim().length > 0,
        hasCurrent: currentBody.trim().length > 0,
        changed:
          normalizeForDiff(previousBody) !== normalizeForDiff(currentBody),
      };
    });
  }, [baselineSections, currentSections]);

  const changedRows = useMemo(
    () => alignedRows.filter((row) => row.changed),
    [alignedRows],
  );

  const changedTitles = useMemo(
    () => new Set(changedRows.map((row) => row.title.toLowerCase())),
    [changedRows],
  );

  const visibleRows = useMemo(() => {
    if (showUnchangedSections) {
      return alignedRows;
    }
    return alignedRows.filter(
      (row) => row.changed || !row.hasPrevious || !row.hasCurrent,
    );
  }, [alignedRows, showUnchangedSections]);

  const buildComparisonMarkdown = () => {
    const lines: string[] = [];
    lines.push("# Compare Versions");
    lines.push("");
    lines.push(`- Version 1: Previous Draft`);
    lines.push(`- Timestamp: ${baselineTimestampLabel}`);
    lines.push(`- Ref: ${selectedBaselineRef ?? "No ref"}`);
    lines.push(`- Version 2: Current Generation`);
    lines.push(`- Timestamp: ${currentTimestampLabel}`);
    lines.push(`- Ref: ${currentRequestRef ?? "No ref"}`);
    lines.push("");
    lines.push("## Section Comparison");
    lines.push("");

    for (const row of visibleRows) {
      lines.push(`### ${row.title}`);
      lines.push(`Changed: ${row.changed ? "Yes" : "No"}`);
      lines.push("");
      lines.push("#### Previous");
      lines.push(
        row.hasPrevious ? row.previousBody : "Not present in previous draft.",
      );
      lines.push("");
      lines.push("#### Current");
      lines.push(
        row.hasCurrent ? row.currentBody : "Not present in current generation.",
      );
      lines.push("");
    }

    return `${lines.join("\n").trimEnd()}\n`;
  };

  const toHtmlDocument = (markdown: string) => {
    const escaped = escapeHtml(markdown);
    return [
      "<!doctype html>",
      '<html lang="en">',
      "<head>",
      '  <meta charset="utf-8" />',
      '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
      "  <title>Rewrite Comparison Export</title>",
      "  <style>",
      "    body { font-family: Inter, Arial, sans-serif; margin: 24px; color: #111827; line-height: 1.6; }",
      "    pre { white-space: pre-wrap; word-break: break-word; margin: 0; }",
      "  </style>",
      "</head>",
      "<body>",
      `  <pre>${escaped}</pre>`,
      "</body>",
      "</html>",
      "",
    ].join("\n");
  };

  const downloadContent = (filename: string, type: string, content: string) => {
    const blob = new Blob([content], { type });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleExport = (format: "markdown" | "html" | "pdf") => {
    const markdown = buildComparisonMarkdown();
    if (format === "markdown") {
      downloadContent("rewrite-comparison.md", "text/markdown", markdown);
      return;
    }

    const html = toHtmlDocument(markdown);
    if (format === "html") {
      downloadContent("rewrite-comparison.html", "text/html", html);
      return;
    }

    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) {
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  const handlePrint = () => {
    const markdown = buildComparisonMarkdown();
    const html = toHtmlDocument(markdown);
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) {
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  const handleCopySection = async (key: string, body: string) => {
    await navigator.clipboard.writeText(body);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const rowPadding = density === "compact" ? "p-2.5" : "p-3";
  const columnPadding = density === "compact" ? "p-3" : "p-4";
  const sectionGap = density === "compact" ? "space-y-2" : "space-y-3";
  return (
    <section className="overflow-hidden rounded-xl bg-linear-to-b from-card to-secondary/20">
      <div className="grid gap-0 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
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
                <p className="text-xs text-muted-foreground">
                  {baselineTimestampLabel} | {selectedBaselineRef ?? "No ref"}
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
                <p className="text-xs text-muted-foreground">
                  {currentTimestampLabel} | {currentRequestRef ?? "No ref"}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-border/60 bg-card/10 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-secondary/40 px-2 py-1 text-xs font-medium text-foreground/85">
                  {changedRows.length} sections changed
                </span>
                {changedTitles.has("headline") ? (
                  <span className="rounded bg-secondary/40 px-2 py-1 text-xs font-medium text-foreground/85">
                    Headline changed
                  </span>
                ) : null}
                {Array.from(changedTitles).some((title) =>
                  title.includes("cta"),
                ) ? (
                  <span className="rounded bg-secondary/40 px-2 py-1 text-xs font-medium text-foreground/85">
                    CTA changed
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() =>
                    setDensity((prev) =>
                      prev === "comfortable" ? "compact" : "comfortable",
                    )
                  }
                >
                  Density:{" "}
                  {density === "comfortable" ? "Comfortable" : "Compact"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => setShowUnchangedSections((prev) => !prev)}
                >
                  {showUnchangedSections
                    ? "Hide unchanged sections"
                    : "Show unchanged sections"}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" size="xs">
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => handleExport("markdown")}>
                      <FileText className="h-4 w-4" />
                      Markdown (.md)
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleExport("html")}>
                      <FileCode2 className="h-4 w-4" />
                      HTML (.html)
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleExport("pdf")}>
                      <FileType2 className="h-4 w-4" />
                      PDF (.pdf)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={handlePrint}
                >
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-2">
            <div
              className={`max-h-[68vh] overflow-y-auto bg-card/30 ${columnPadding}`}
            >
              <div className={sectionGap}>
                {visibleRows.map((row) => (
                  <section
                    key={`previous-${row.key}`}
                    data-compare-row-key={row.key}
                    className={`rounded-lg ${rowPadding} ${
                      row.changed
                        ? "border border-primary/30 bg-card"
                        : "bg-card/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {row.title}
                      </p>
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        onClick={() =>
                          void handleCopySection(
                            `previous-${row.key}`,
                            row.previousBody,
                          )
                        }
                        disabled={!row.hasPrevious}
                      >
                        {copiedKey === `previous-${row.key}` ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        {copiedKey === `previous-${row.key}`
                          ? "Copied"
                          : "Copy"}
                      </Button>
                    </div>
                    <div className="mt-2 text-sm leading-relaxed text-foreground/90">
                      {row.hasPrevious ? (
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
                          {row.previousBody}
                        </ReactMarkdown>
                      ) : (
                        <div className="rounded-md border border-dashed border-border/60 bg-secondary/20 p-2">
                          <p className="text-sm text-muted-foreground">
                            Not present in previous draft.
                          </p>
                        </div>
                      )}
                    </div>
                  </section>
                ))}
              </div>
            </div>

            <div
              className={`max-h-[68vh] overflow-y-auto bg-secondary/30 ${columnPadding}`}
            >
              <div className={sectionGap}>
                {visibleRows.map((row) => (
                  <section
                    key={`current-${row.key}`}
                    data-compare-row-key={row.key}
                    className={`rounded-lg ${rowPadding} ${
                      row.changed
                        ? "border border-primary/40 bg-card/90"
                        : "bg-card/80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {row.title}
                      </p>
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        onClick={() =>
                          void handleCopySection(
                            `current-${row.key}`,
                            row.currentBody,
                          )
                        }
                        disabled={!row.hasCurrent}
                      >
                        {copiedKey === `current-${row.key}` ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        {copiedKey === `current-${row.key}` ? "Copied" : "Copy"}
                      </Button>
                    </div>
                    <div className="mt-2 text-sm leading-relaxed text-foreground/90">
                      {row.hasCurrent ? (
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
                          {row.currentBody}
                        </ReactMarkdown>
                      ) : (
                        <div className="rounded-md border border-dashed border-border/60 bg-secondary/20 p-2">
                          <p className="text-sm text-muted-foreground">
                            Not present in current generation.
                          </p>
                        </div>
                      )}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

