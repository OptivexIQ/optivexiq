"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeftRight,
  Brain,
  Check,
  Copy,
  Download,
  FileCode2,
  FileText,
  FileType2,
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
import {
  buildRewriteOutputViewModel,
  normalizeRationaleParagraph,
} from "@/features/rewrites/services/rewriteOutputViewModel";
import type { RewriteSectionMapResult } from "@/features/rewrites/types/rewrites.types";

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
  baselineVersionNumber?: number | null;
  currentVersionNumber?: number | null;
  baselineIsWinner?: boolean;
  currentIsWinner?: boolean;
  baselineIsControl?: boolean;
  currentIsControl?: boolean;
  onMarkBaselineWinner?: () => void | Promise<void>;
  onMarkCurrentWinner?: () => void | Promise<void>;
  winnerActionDisabled?: boolean;
  compareBaselineOptions: Array<{
    requestRef: string;
    label: string;
  }>;
  selectedBaselineRef: string | null;
  originalBaselineMap: RewriteSectionMapResult | null;
  originalBaselineMapLoading: boolean;
  originalBaselineMapError: string | null;
  canServerExport?: boolean;
  exportingCompare?: boolean;
  hypothesisSummary: {
    type: string;
    minimumDeltaLevel: string;
    controlledVariables: string[];
    treatmentVariables: string[];
    successCriteria: string;
  };
  onExportCompare: (format: "markdown" | "html" | "pdf") => void;
  onSelectBaseline: (requestRef: string) => void;
  onExitCompare: () => void;
};
const ORIGINAL_BASELINE_REF = "__original_draft__";

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

  const aliases: Record<string, string> = {
    "hero-section": "hero",
    headline: "hero",
    subheadline: "hero",
    "primary-cta": "hero",
    "secondary-cta": "hero",

    "problem-solution": "problem-solution",
    "problem-solution-section": "problem-solution",
    "problem-and-solution": "problem-solution",
    "pain-point": "problem-solution",
    "pain-points": "problem-solution",
    "value-proposition": "problem-solution",

    "product-demo": "product-showcase",
    demo: "product-showcase",

    "benefits-results": "benefits-results",
    benefits: "benefits-results",
    results: "benefits-results",
    "before-after": "benefits-results",

    "testimonials-case-studies": "testimonials-case-studies",
    testimonials: "testimonials-case-studies",
    testimonial: "testimonials-case-studies",
    "case-study": "testimonials-case-studies",
    "case-studies": "testimonials-case-studies",

    "use-case": "use-cases",
    ecosystem: "integrations",

    "trusted-by": "social-proof",
    "trust-badges": "social-proof",
    proof: "social-proof",

    "pricing-section": "pricing",
    "final-cta-section": "final-cta",
  };
  if (aliases[normalized]) {
    return aliases[normalized];
  }

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
  if (lower.includes("hero") || lower.includes("headline")) return 20;
  if (lower.includes("primary cta")) return 20;
  if (
    lower.includes("problem / solution") ||
    lower.includes("problem solution")
  )
    return 40;
  if (lower.includes("features")) return 50;
  if (lower.includes("how it works")) return 60;
  if (lower.includes("product showcase") || lower.includes("demo")) return 65;
  if (lower.includes("benefits / results") || lower.includes("benefits"))
    return 70;
  if (
    lower.includes("testimonials / case studies") ||
    lower.includes("testimonials")
  )
    return 75;
  if (lower.includes("use cases")) return 80;
  if (lower.includes("integrations")) return 85;
  if (lower.includes("pricing")) return 90;
  if (lower.includes("social proof")) return 95;
  if (lower.includes("faq")) return 100;
  if (lower.includes("final cta") || lower.includes("secondary cta"))
    return 110;
  if (lower.includes("rationale")) return 115;
  if (lower.includes("other")) return 120;
  if (lower.includes("implementation")) return 130;
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
  baselineVersionNumber,
  currentVersionNumber,
  baselineIsWinner = false,
  currentIsWinner = false,
  baselineIsControl = false,
  currentIsControl = false,
  onMarkBaselineWinner,
  onMarkCurrentWinner,
  winnerActionDisabled = false,
  compareBaselineOptions,
  selectedBaselineRef,
  originalBaselineMap,
  originalBaselineMapLoading,
  originalBaselineMapError,
  canServerExport = false,
  exportingCompare = false,
  hypothesisSummary,
  onExportCompare,
  onSelectBaseline,
  onExitCompare,
}: RewriteComparisonPanelProps) {
  const currentViewModel = buildRewriteOutputViewModel(currentOutput);
  const baselineViewModel = buildRewriteOutputViewModel(baselineOutput);
  const hasBaselineOptions = compareBaselineOptions.length > 0;
  const isOriginalBaselineSelected =
    selectedBaselineRef === ORIGINAL_BASELINE_REF;
  const originalBaselineSections = useMemo(
    () => originalBaselineMap?.sections ?? [],
    [originalBaselineMap],
  );
  const baselineSections = useMemo(() => {
    if (isOriginalBaselineSelected) {
      return originalBaselineSections;
    }
    return baselineViewModel.copySections;
  }, [
    isOriginalBaselineSelected,
    originalBaselineSections,
    baselineViewModel.copySections,
  ]);
  const currentSections = useMemo(
    () => currentViewModel.copySections,
    [currentViewModel.copySections],
  );
  const baselineRationale = normalizeRationaleParagraph(
    baselineViewModel.rationaleSections[0]?.body?.trim() ?? "",
  );
  const currentRationale = normalizeRationaleParagraph(
    currentViewModel.rationaleSections[0]?.body?.trim() ?? "",
  );
  const baselineRawRationale =
    baselineViewModel.rationaleSections[0]?.body?.trim() ?? "";
  const currentRawRationale =
    currentViewModel.rationaleSections[0]?.body?.trim() ?? "";
  const baselineRationaleFallback = isOriginalBaselineSelected
    ? "Unavailable for original draft baseline."
    : baselineRawRationale.length === 0
      ? "Not generated for this version."
      : "Suppressed because rationale did not meet quality constraints.";
  const currentRationaleFallback =
    currentRawRationale.length === 0
      ? "Not generated for this version."
      : "Suppressed because rationale did not meet quality constraints.";
  const [showUnchangedSections, setShowUnchangedSections] = useState(false);
  const [density, setDensity] = useState<"comfortable" | "compact">(
    "comfortable",
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const baselineVersionLabel = baselineIsControl
    ? "Control (original input)"
    : `Treatment v${baselineVersionNumber ?? "?"}`;
  const baselineTitle = baselineIsControl ? "Original Input" : "Previous Draft";
  const baselineMeta = isOriginalBaselineSelected
    ? "Source content"
    : `${baselineTimestampLabel} | ${selectedBaselineRef ?? "No ref"}`;

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
  const addedRows = useMemo(
    () => alignedRows.filter((row) => !row.hasPrevious && row.hasCurrent),
    [alignedRows],
  );
  const removedRows = useMemo(
    () => alignedRows.filter((row) => row.hasPrevious && !row.hasCurrent),
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

  const handleCopySection = async (key: string, body: string) => {
    await navigator.clipboard.writeText(body);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const rowPadding = density === "compact" ? "p-2.5" : "p-3";
  const columnPadding = density === "compact" ? "p-3" : "p-4";
  const sectionGap = density === "compact" ? "space-y-2" : "space-y-3";
  const baselineIdentityLabel = baselineIsControl
    ? "Control baseline"
    : baselineIsWinner
      ? "Winning baseline"
      : "Saved baseline";
  const currentIdentityLabel = currentIsControl
    ? "Control candidate"
    : currentIsWinner
      ? "Current winner"
      : "Current treatment";
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
                <blockquote className="mt-3 h-28 overflow-hidden rounded-md border border-border/60 bg-secondary/20 p-3 text-sm italic text-foreground/90">
                  <p className="line-clamp-4 whitespace-pre-wrap wrap-break-words">
                    {sourceContent}
                  </p>
                </blockquote>
              ) : (
                <div className="mt-3 h-28 overflow-hidden rounded-md border border-border/60 bg-secondary/20 p-3">
                  <p className="text-sm text-muted-foreground">
                    No pasted source content was provided for this rewrite.
                  </p>
                </div>
              )}
              {isOriginalBaselineSelected &&
              sourceContent.trim().length > 0 &&
              originalBaselineSections.length === 0 ? (
                <p
                  className={`mt-2 text-xs ${
                    originalBaselineMapLoading
                      ? "text-muted-foreground"
                      : "text-amber-500"
                  }`}
                >
                  {originalBaselineMapLoading
                    ? "Mapping original draft sections..."
                    : (originalBaselineMapError ??
                      originalBaselineMap?.warnings[0] ??
                      "Section mapping unavailable. Add explicit section labels or retry.")}
                </p>
              ) : null}
            </section>

            <section className="bg-transparent">
              <p className="text-sm font-semibold text-muted-foreground">
                Rewrite Strategy
              </p>
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    ICP
                  </p>
                  <div className="mt-1 rounded-md border border-border/60 bg-secondary/20 px-3 py-2">
                    <p className="text-sm text-foreground/90">
                      {personaRole.trim().length > 0 ? personaRole : "Not set"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Tone
                  </p>
                  <div className="mt-1 rounded-md border border-border/60 bg-secondary/20 px-3 py-2">
                    <p className="text-sm text-foreground/90">
                      {toDisplayLabel(tone)}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Length
                  </p>
                  <div className="mt-1 rounded-md border border-border/60 bg-secondary/20 px-3 py-2">
                    <p className="text-sm text-foreground/90">
                      {toDisplayLabel(length)}
                    </p>
                  </div>
                </div>
                {emphasis.length > 0 ? (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Emphasis
                    </p>
                    <div className="mt-1 rounded-md border border-border/60 bg-secondary/20 px-3 py-2">
                      <div className="flex flex-wrap gap-1.5">
                        {emphasis.map((item) => (
                          <span
                            key={item}
                            className="rounded bg-secondary/40 px-2 py-0.5 text-xs text-foreground/85"
                          >
                            {toDisplayLabel(item)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
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
          <div className="border-t border-border/60 bg-card/20 px-6 py-4">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="rounded-full border border-border/60 bg-background px-2.5 py-1">
                    {baselineIdentityLabel}
                  </span>
                  <span className="rounded-full border border-border/60 bg-background px-2.5 py-1">
                    {currentIdentityLabel}
                  </span>
                  <span className="rounded-full border border-border/60 bg-background px-2.5 py-1">
                    {changedRows.length} changed sections
                  </span>
                  <span className="rounded-full border border-border/60 bg-background px-2.5 py-1">
                    {addedRows.length} added
                  </span>
                  <span className="rounded-full border border-border/60 bg-background px-2.5 py-1">
                    {removedRows.length} removed
                  </span>
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">
                  Experiment review
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Review structural change, winner state, and section churn before
                  deciding which version should advance.
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                <p className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground">
                  Success criteria
                </p>
                <p className="mt-2 text-sm text-foreground/90">
                  {hypothesisSummary.successCriteria.trim().length > 0
                    ? hypothesisSummary.successCriteria
                    : "No explicit success criteria provided."}
                </p>
              </div>
            </div>
          </div>
          <div className="grid lg:grid-cols-2">
            <div className="bg-card px-4 py-3">
              <p className="text-xs font-semibold text-muted-foreground">
                {baselineVersionLabel}
              </p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {baselineTitle}
                  </p>
                  <p className="text-xs text-muted-foreground">{baselineMeta}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {baselineIsWinner ? (
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                      Winner
                    </span>
                  ) : null}
                  <Button
                    type="button"
                    size="xs"
                    variant={baselineIsWinner ? "secondary" : "outline"}
                    disabled={
                      isOriginalBaselineSelected ||
                      baselineIsControl ||
                      winnerActionDisabled ||
                      !onMarkBaselineWinner
                    }
                    onClick={() => void onMarkBaselineWinner?.()}
                  >
                    {baselineIsWinner ? "Winner" : "Mark winner"}
                  </Button>
                </div>
              </div>
              {isOriginalBaselineSelected || baselineIsControl ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Control baselines cannot be promoted as winners.
                </p>
              ) : winnerActionDisabled ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Winner updates are temporarily locked while another action is running.
                </p>
              ) : null}
            </div>
            <div className="bg-secondary/20 px-4 py-3">
              <p className="text-xs font-semibold text-muted-foreground">
                {currentIsControl
                  ? "Control (original input)"
                  : `Treatment v${currentVersionNumber ?? "?"}`}
              </p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {currentIsControl ? "Original Input" : "Current Generation"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {currentTimestampLabel} | {currentRequestRef ?? "No ref"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {currentIsWinner ? (
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                      Winner
                    </span>
                  ) : null}
                  <Button
                    type="button"
                    size="xs"
                    variant={currentIsWinner ? "secondary" : "outline"}
                    disabled={
                      winnerActionDisabled ||
                      currentIsControl ||
                      !onMarkCurrentWinner
                    }
                    onClick={() => void onMarkCurrentWinner?.()}
                  >
                    {currentIsWinner ? "Winner" : "Mark winner"}
                  </Button>
                </div>
              </div>
              {currentIsControl ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Control drafts cannot be marked as winners from compare mode.
                </p>
              ) : winnerActionDisabled ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Winner updates are temporarily locked while another action is running.
                </p>
              ) : null}
            </div>
          </div>

          <div className="border-t border-border/60 bg-card/10 px-4 py-3">
            <p className="text-sm font-semibold text-foreground">
              Experiment Summary
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded bg-secondary/40 px-2 py-1 text-foreground/85">
                Hypothesis: {toDisplayLabel(hypothesisSummary.type.replaceAll("_", "-"))}
              </span>
              <span className="rounded bg-secondary/40 px-2 py-1 text-foreground/85">
                Delta: {toDisplayLabel(hypothesisSummary.minimumDeltaLevel)}
              </span>
              <span className="rounded bg-secondary/40 px-2 py-1 text-foreground/85">
                Locked controls:{" "}
                {hypothesisSummary.controlledVariables.length > 0
                  ? hypothesisSummary.controlledVariables
                      .map((item) => toDisplayLabel(item.replaceAll("_", "-")))
                      .join(", ")
                  : "N/A"}
              </span>
              <span className="rounded bg-secondary/40 px-2 py-1 text-foreground/85">
                Changed treatments:{" "}
                {hypothesisSummary.treatmentVariables.length > 0
                  ? hypothesisSummary.treatmentVariables
                      .map((item) => toDisplayLabel(item.replaceAll("_", "-")))
                      .join(", ")
                  : "N/A"}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Success criteria:{" "}
              <span className="text-foreground/90">
                {hypothesisSummary.successCriteria.trim().length > 0
                  ? hypothesisSummary.successCriteria
                  : "N/A"}
              </span>
            </p>
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
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      disabled={!canServerExport || exportingCompare}
                    >
                      <Download className="h-4 w-4" />
                      {exportingCompare ? "Exporting..." : "Export"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onExportCompare("markdown")}>
                      <FileText className="h-4 w-4" />
                      Markdown (.md)
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onExportCompare("html")}>
                      <FileCode2 className="h-4 w-4" />
                      HTML (.html)
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onExportCompare("pdf")}>
                      <FileType2 className="h-4 w-4" />
                      PDF (.pdf)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {!canServerExport ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Server compare export requires a saved baseline version, not the original input draft.
                </p>
              ) : exportingCompare ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Preparing comparison export. Keep this tab open until the file is ready.
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-2">
            <div className={`min-h-0 bg-card/30 ${columnPadding}`}>
              <div className="min-h-0 max-h-[68vh] overflow-y-auto">
                <div className={sectionGap}>
                  {visibleRows.length === 0 ? (
                    <div className="rounded-md border border-border/60 bg-secondary/20 p-3">
                      <p className="text-sm text-muted-foreground">
                        Structured sections are unavailable for the baseline version.
                      </p>
                    </div>
                  ) : null}
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
                          variant="ghost"
                          className="hover:bg-transparent"
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
            </div>

            <div className={`min-h-0 bg-secondary/30 ${columnPadding}`}>
              <div className="min-h-0 max-h-[68vh] overflow-y-auto">
                <div className={sectionGap}>
                  {visibleRows.length === 0 ? (
                    <div className="rounded-md border border-border/60 bg-secondary/20 p-3">
                      <p className="text-sm text-muted-foreground">
                        Structured sections are unavailable for the current version.
                      </p>
                    </div>
                  ) : null}
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
                          variant="ghost"
                          className="hover:bg-transparent"
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

          <div className="grid gap-6 bg-card/10 p-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-[hsl(216_55%_38%/.62)] bg-linear-to-br from-[hsl(218_48%_13%)] via-[hsl(0_1%_1%)] to-[hsl(210_38%_10%)] p-6 shadow-[0_14px_36px_hsl(216_62%_8%/.46)]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Brain className="h-4 w-4" />
                  <p className="text-sm font-semibold text-[hsl(216_38%_93%)]">
                    Strategic Rationale
                  </p>
                </div>
              </div>
              {baselineRationale.length > 0 ? (
                <div className="mt-2 text-sm leading-relaxed text-foreground/90">
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
                    {baselineRationale}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  {baselineRationaleFallback}
                </p>
              )}
            </section>
            <section className="rounded-2xl border border-[hsl(216_55%_38%/.62)] bg-linear-to-br from-[hsl(218_48%_13%)] via-[hsl(0_1%_1%)] to-[hsl(210_38%_10%)] p-6 shadow-[0_14px_36px_hsl(216_62%_8%/.46)]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Brain className="h-4 w-4" />
                  <p className="text-sm font-semibold text-[hsl(216_38%_93%)]">
                    Strategic Rationale
                  </p>
                </div>
              </div>
              {currentRationale.length > 0 ? (
                <div className="mt-2 text-sm leading-relaxed text-foreground/90">
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
                    {currentRationale}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  {currentRationaleFallback}
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}
