"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";
import { isHttpError } from "@/lib/api/httpClient";
import { RewriteInputPanel } from "@/features/rewrites/components/RewriteInputPanel";
import { RewriteComparisonPanel } from "@/features/rewrites/components/RewriteComparisonPanel";
import { RewriteExecutiveSummaryCard } from "@/features/rewrites/components/RewriteExecutiveSummaryCard";
import { RewriteOutputPanel } from "@/features/rewrites/components/RewriteOutputPanel";
import { RewriteShiftStatsCards } from "@/features/rewrites/components/RewriteShiftStatsCards";
import { RewriteStrategicRationaleCard } from "@/features/rewrites/components/RewriteStrategicRationaleCard";
import {
  RewriteStudioControlBar,
  type StudioGoal,
} from "@/features/rewrites/components/RewriteStudioControlBar";
import { RewriteStudioHeader } from "@/features/rewrites/components/RewriteStudioHeader";
import {
  mapRewriteSections,
  streamRewrite,
} from "@/features/rewrites/services/rewritesClient";
import { hasAnyAllowedSectionLabel } from "@/features/rewrites/services/sectionLabelUtils";
import { buildRewriteOutputViewModel } from "@/features/rewrites/services/rewriteOutputViewModel";
import type {
  RewriteExportFormat,
  RewriteGenerateRequest,
  RewriteSectionMapResult,
  RewriteStrategy,
  RewriteStudioInitialData,
} from "@/features/rewrites/types/rewrites.types";

type RewriteStudioViewProps = {
  initialData: RewriteStudioInitialData;
};
const REWRITE_STUDIO_CONTEXT_STORAGE_KEY =
  "optivexiq.rewrite_studio.context.v1";
const REWRITE_STUDIO_STRATEGY_STORAGE_KEY =
  "optivexiq.rewrite_studio.strategy.v1";
const REWRITE_STUDIO_INPUT_POLICY_STORAGE_KEY =
  "optivexiq.rewrite_studio.input_policy.v1";
const ORIGINAL_BASELINE_REF = "__original_draft__";

function toMarkdownDocument(output: string) {
  return output.endsWith("\n") ? output : `${output}\n`;
}

function toPlainTextDocument(markdown: string) {
  return toMarkdownDocument(markdown)
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`{1,3}(.*?)`{1,3}/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toHtmlDocument(markdown: string) {
  const escaped = escapeHtml(toMarkdownDocument(markdown));
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
    "  <title>Rewrite Export</title>",
    "  <style>",
    "    body { font-family: Inter, Arial, sans-serif; margin: 32px; color: #111827; line-height: 1.6; }",
    "    pre { white-space: pre-wrap; word-break: break-word; margin: 0; }",
    "  </style>",
    "</head>",
    "<body>",
    `  <pre>${escaped}</pre>`,
    "</body>",
    "</html>",
    "",
  ].join("\n");
}

function toStructuredMarkdownDocument(
  output: string,
  rewriteType: RewriteGenerateRequest["rewriteType"],
) {
  const model = buildRewriteOutputViewModel(output);
  const lines: string[] = [];
  lines.push(`# ${rewriteType === "pricing" ? "Pricing" : "Homepage"} Rewrite`);
  lines.push("");
  lines.push("## Executive Rewrite Summary");
  if (model.summaryBullets.length > 0) {
    for (const bullet of model.summaryBullets.slice(0, 3)) {
      lines.push(`- ${bullet}`);
    }
  } else {
    lines.push("- Summary not available for this rewrite.");
  }
  lines.push("");
  lines.push("## Rewritten Copy");
  const copySections =
    model.copySections.length > 0
      ? model.copySections
      : [{ title: "Rewrite", body: output }];
  for (const section of copySections) {
    lines.push(`### ${section.title}`);
    lines.push(section.body);
    lines.push("");
  }

  lines.push("## Strategic Rationale");
  if (model.rationaleSections.length > 0) {
    for (const section of model.rationaleSections) {
      lines.push(`### ${section.title}`);
      lines.push(section.body);
      lines.push("");
    }
  } else {
    lines.push("Not available for this rewrite.");
    lines.push("");
  }

  return lines.join("\n").trimEnd() + "\n";
}

function downloadContent(filename: string, type: string, content: string) {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function printPdfDocument(markdown: string) {
  const html = toHtmlDocument(markdown);
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) {
    throw new Error("Popup blocked. Enable popups to export PDF.");
  }

  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

function formatHistoryTimestamp(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown date";
  }
  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RewriteStudioView({ initialData }: RewriteStudioViewProps) {
  const { toast } = useToast();
  const abortRef = useRef<AbortController | null>(null);
  const [request, setRequest] = useState<RewriteGenerateRequest>({
    rewriteType: "homepage",
    websiteUrl: initialData.defaultWebsiteUrl,
    content: "",
    notes: "",
    ...(initialData.defaultRewriteRequest ?? {}),
  });
  const [output, setOutput] = useState(initialData.initialOutputMarkdown ?? "");
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [requestRef, setRequestRef] = useState<string | null>(
    initialData.initialRequestRef ?? null,
  );
  const [currentVersionCreatedAt, setCurrentVersionCreatedAt] = useState<
    string | null
  >(() => {
    if (!initialData.initialRequestRef) {
      return null;
    }
    return (
      initialData.historyVersions?.find(
        (item) => item.requestRef === initialData.initialRequestRef,
      )?.createdAt ?? null
    );
  });
  const [previousOutput, setPreviousOutput] = useState("");
  const [previousVersionCreatedAt, setPreviousVersionCreatedAt] = useState<
    string | null
  >(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedBaselineRef, setSelectedBaselineRef] = useState<string | null>(
    null,
  );
  const [originalBaselineMap, setOriginalBaselineMap] =
    useState<RewriteSectionMapResult | null>(null);
  const [originalBaselineMapLoading, setOriginalBaselineMapLoading] =
    useState(false);
  const [originalBaselineMapError, setOriginalBaselineMapError] = useState<
    string | null
  >(null);
  const [enforceSectionLabels, setEnforceSectionLabels] = useState(false);
  const originalBaselineMapCacheRef = useRef<Map<string, RewriteSectionMapResult>>(
    new Map(),
  );
  const [refineMode, setRefineMode] = useState(false);
  const [deltaInstructions, setDeltaInstructions] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const profileIcp = initialData.profileIcpRole.trim() || "Profile ICP";
  const [useCustomIcp, setUseCustomIcp] = useState(
    initialData.initialStudioContext?.useCustomIcp ?? false,
  );
  const [customIcp, setCustomIcp] = useState(
    initialData.initialStudioContext?.customIcp ?? "",
  );
  const [goal, setGoal] = useState<StudioGoal>(
    initialData.initialStudioContext?.goal ?? "conversion",
  );
  const [differentiationFocus, setDifferentiationFocus] = useState(
    initialData.initialStudioContext?.differentiationFocus ?? true,
  );
  const [objectionFocus, setObjectionFocus] = useState(
    initialData.initialStudioContext?.objectionFocus ?? false,
  );
  const [strategy, setStrategy] = useState<RewriteStrategy>({
    tone: "neutral",
    length: "standard",
    emphasis: [],
    constraints: "",
    audience: "",
  });

  const selectedIcpLabel = useCustomIcp ? customIcp.trim() : profileIcp;
  const resolvedIcpLabel =
    selectedIcpLabel.trim().length > 0 ? selectedIcpLabel : "Custom ICP";
  const historyVersions = useMemo(
    () => initialData.historyVersions ?? [],
    [initialData.historyVersions],
  );
  const currentVersionSourceContent =
    requestRef != null
      ? historyVersions.find((item) => item.requestRef === requestRef)
          ?.sourceContent ?? null
      : null;
  const comparisonSourceContent = useMemo(() => {
    if (requestRef != null) {
      return currentVersionSourceContent ?? "";
    }
    return request.content?.trim().length ? request.content : "";
  }, [requestRef, currentVersionSourceContent, request.content]);
  const compareBaselineOptions = useMemo(
    () =>
      historyVersions
        .filter((item) => item.requestRef !== requestRef)
        .map((item) => {
          const target = item.rewriteType === "pricing" ? "Pricing" : "Homepage";
          return {
            requestRef: item.requestRef,
            label: `${target} | ${item.requestRef}`,
          };
        }),
    [historyVersions, requestRef],
  );
  const baselineOptions = useMemo(
    () =>
      comparisonSourceContent.trim().length > 0
        ? [
            {
              requestRef: ORIGINAL_BASELINE_REF,
              label: "Original Draft | Source content",
            },
            ...compareBaselineOptions,
          ]
        : compareBaselineOptions,
    [comparisonSourceContent, compareBaselineOptions],
  );
  const isOriginalBaselineSelected =
    selectedBaselineRef === ORIGINAL_BASELINE_REF;
  const selectedBaselineOutput =
    isOriginalBaselineSelected
      ? comparisonSourceContent
      : historyVersions.find((item) => item.requestRef === selectedBaselineRef)
            ?.outputMarkdown ?? previousOutput;
  const selectedBaselineTimestamp = selectedBaselineRef
    ? historyVersions.find((item) => item.requestRef === selectedBaselineRef)
        ?.createdAt
    : null;
  const baselineTimestamp = selectedBaselineTimestamp ?? previousVersionCreatedAt;
  const baselineTimestampLabel = isOriginalBaselineSelected
    ? "Original input"
    : baselineTimestamp
      ? formatHistoryTimestamp(baselineTimestamp)
      : previousOutput.trim().length > 0
        ? "In-session baseline"
        : "Not selected";
  const currentTimestampLabel = currentVersionCreatedAt
    ? formatHistoryTimestamp(currentVersionCreatedAt)
    : "Not available";
  const canCompare =
    output.trim().length > 0 &&
    (previousOutput.trim().length > 0 || baselineOptions.length > 0);

  useEffect(() => {
    if (
      !compareMode ||
      !isOriginalBaselineSelected ||
      comparisonSourceContent.trim().length === 0
    ) {
      setOriginalBaselineMap(null);
      setOriginalBaselineMapLoading(false);
      setOriginalBaselineMapError(null);
      return;
    }

    const controller = new AbortController();
    const cacheKey = `${request.rewriteType}|${
      requestRef ?? "unsaved"
    }|${comparisonSourceContent}`;
    const cached = originalBaselineMapCacheRef.current.get(cacheKey);
    if (cached) {
      setOriginalBaselineMap(cached);
      setOriginalBaselineMapLoading(false);
      setOriginalBaselineMapError(null);
      return () => controller.abort();
    }

    setOriginalBaselineMapLoading(true);
    setOriginalBaselineMapError(null);
    void mapRewriteSections({
      rewriteType: request.rewriteType,
      requestRef,
      content: comparisonSourceContent,
      signal: controller.signal,
    })
      .then((result) => {
        originalBaselineMapCacheRef.current.set(cacheKey, result);
        setOriginalBaselineMap(result);
      })
      .catch((mapError: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        const message =
          mapError instanceof Error
            ? mapError.message
            : isHttpError(mapError)
              ? mapError.message
              : "Unable to map original draft sections.";
        setOriginalBaselineMapError(message);
        setOriginalBaselineMap(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setOriginalBaselineMapLoading(false);
        }
      });

    return () => controller.abort();
  }, [
    compareMode,
    isOriginalBaselineSelected,
    comparisonSourceContent,
    request.rewriteType,
    requestRef,
  ]);

  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) {
        return false;
      }

      const tag = target.tagName.toLowerCase();
      return (
        tag === "input" ||
        tag === "textarea" ||
        target.isContentEditable ||
        target.closest("[contenteditable='true']") !== null
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && compareMode) {
        event.preventDefault();
        setCompareMode(false);
        return;
      }

      const modifierPressed = event.metaKey || event.ctrlKey;
      const isCompareToggle =
        modifierPressed &&
        event.altKey &&
        event.key.toLowerCase() === "c";

      if (!isCompareToggle || isTypingTarget(event.target) || !canCompare) {
        return;
      }

      event.preventDefault();
      setCompareMode((previous) => {
        const next = !previous;
        if (next && !selectedBaselineRef && baselineOptions.length > 0) {
          setSelectedBaselineRef(baselineOptions[0].requestRef);
        }
        return next;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [baselineOptions, canCompare, compareMode, selectedBaselineRef]);

  useEffect(() => {
    if (initialData.initialStudioContext) {
      return;
    }

    const raw = window.localStorage.getItem(REWRITE_STUDIO_CONTEXT_STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as {
        rewriteType?: "homepage" | "pricing";
        useCustomIcp?: boolean;
        customIcp?: string;
        goal?: StudioGoal;
        differentiationFocus?: boolean;
        objectionFocus?: boolean;
      };

      if (
        parsed.rewriteType === "homepage" ||
        parsed.rewriteType === "pricing"
      ) {
        setRequest((previous) => ({
          ...previous,
          rewriteType: parsed.rewriteType!,
        }));
      }
      if (typeof parsed.useCustomIcp === "boolean") {
        setUseCustomIcp(parsed.useCustomIcp);
      }
      if (typeof parsed.customIcp === "string") {
        setCustomIcp(parsed.customIcp);
      }
      if (
        parsed.goal === "conversion" ||
        parsed.goal === "clarity" ||
        parsed.goal === "differentiation"
      ) {
        setGoal(parsed.goal);
      }
      if (typeof parsed.differentiationFocus === "boolean") {
        setDifferentiationFocus(parsed.differentiationFocus);
      }
      if (typeof parsed.objectionFocus === "boolean") {
        setObjectionFocus(parsed.objectionFocus);
      }
    } catch {
      window.localStorage.removeItem(REWRITE_STUDIO_CONTEXT_STORAGE_KEY);
    }
  }, [initialData.initialStudioContext]);

  useEffect(() => {
    const raw = window.localStorage.getItem(
      REWRITE_STUDIO_STRATEGY_STORAGE_KEY,
    );
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<RewriteStrategy>;
      setStrategy((previous) => ({
        tone:
          parsed.tone === "confident" ||
          parsed.tone === "technical" ||
          parsed.tone === "direct" ||
          parsed.tone === "founder-led" ||
          parsed.tone === "enterprise" ||
          parsed.tone === "neutral"
            ? parsed.tone
            : previous.tone,
        length:
          parsed.length === "short" ||
          parsed.length === "standard" ||
          parsed.length === "long"
            ? parsed.length
            : previous.length,
        emphasis: Array.isArray(parsed.emphasis)
          ? parsed.emphasis.filter(
              (item): item is RewriteStrategy["emphasis"][number] =>
                item === "clarity" ||
                item === "differentiation" ||
                item === "objection-handling" ||
                item === "pricing-clarity" ||
                item === "proof-credibility",
            )
          : previous.emphasis,
        constraints:
          typeof parsed.constraints === "string"
            ? parsed.constraints
            : previous.constraints,
        audience:
          typeof parsed.audience === "string"
            ? parsed.audience
            : previous.audience,
      }));
    } catch {
      window.localStorage.removeItem(REWRITE_STUDIO_STRATEGY_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const raw = window.localStorage.getItem(
      REWRITE_STUDIO_INPUT_POLICY_STORAGE_KEY,
    );
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as { enforceSectionLabels?: boolean };
      if (typeof parsed.enforceSectionLabels === "boolean") {
        setEnforceSectionLabels(parsed.enforceSectionLabels);
      }
    } catch {
      window.localStorage.removeItem(REWRITE_STUDIO_INPUT_POLICY_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const payload = {
      rewriteType: request.rewriteType,
      useCustomIcp,
      customIcp,
      goal,
      differentiationFocus,
      objectionFocus,
    };
    window.localStorage.setItem(
      REWRITE_STUDIO_CONTEXT_STORAGE_KEY,
      JSON.stringify(payload),
    );
  }, [
    request.rewriteType,
    useCustomIcp,
    customIcp,
    goal,
    differentiationFocus,
    objectionFocus,
  ]);

  useEffect(() => {
    window.localStorage.setItem(
      REWRITE_STUDIO_STRATEGY_STORAGE_KEY,
      JSON.stringify(strategy),
    );
  }, [strategy]);

  useEffect(() => {
    window.localStorage.setItem(
      REWRITE_STUDIO_INPUT_POLICY_STORAGE_KEY,
      JSON.stringify({ enforceSectionLabels }),
    );
  }, [enforceSectionLabels]);

  const resetStudio = () => {
    setRequest({
      rewriteType: "homepage",
      websiteUrl: initialData.defaultWebsiteUrl,
      content: "",
      notes: "",
      ...(initialData.defaultRewriteRequest ?? {}),
    });
    setUseCustomIcp(false);
    setCustomIcp("");
    setGoal("conversion");
    setDifferentiationFocus(true);
    setObjectionFocus(false);
    setStrategy({
      tone: "neutral",
      length: "standard",
      emphasis: [],
      constraints: "",
      audience: "",
    });
    setOutput("");
    setPreviousOutput("");
    setPreviousVersionCreatedAt(null);
    setCompareMode(false);
    setSelectedBaselineRef(null);
    setRefineMode(false);
    setDeltaInstructions("");
    setError(null);
    setRequestRef(null);
    setCurrentVersionCreatedAt(null);
    setOriginalBaselineMap(null);
    setOriginalBaselineMapLoading(false);
    setOriginalBaselineMapError(null);
    setEnforceSectionLabels(false);
  };

  const resetControlContext = () => {
    setRequest((previous) => ({ ...previous, rewriteType: "homepage" }));
    setUseCustomIcp(false);
    setCustomIcp("");
    setGoal("conversion");
    setDifferentiationFocus(true);
    setObjectionFocus(false);
  };

  const handleSaveVersion = () => {
    if (output.trim().length === 0) {
      setError("No rewrite output available to save.");
      return;
    }
    if (!requestRef) {
      setError("Generate a rewrite first, then save to version history.");
      return;
    }
    setHistoryOpen(true);
    toast({
      title: "Version saved",
      description: "Saved versions are available in Version History.",
    });
  };

  const handleDuplicate = () => {
    if (output.trim().length === 0) {
      return;
    }
    setPreviousOutput(output);
    setPreviousVersionCreatedAt(currentVersionCreatedAt);
    setOutput("");
    setCompareMode(false);
    setSelectedBaselineRef(null);
    setRequestRef(null);
    setCurrentVersionCreatedAt(null);
    setOriginalBaselineMap(null);
    setOriginalBaselineMapLoading(false);
    setOriginalBaselineMapError(null);
    setError(null);
    toast({
      title: "Rewrite duplicated",
      description:
        "Workspace reset for a new iteration with your current setup.",
    });
  };

  const handleRefine = () => {
    setRefineMode(true);
    setCompareMode(false);
    queueMicrotask(() => {
      const node = document.getElementById("rewrite-delta-instructions");
      node?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const handleSubmit = async () => {
    if (useCustomIcp && customIcp.trim().length === 0) {
      setError("Custom ICP is required when ICP is set to Custom.");
      return;
    }

    if (
      enforceSectionLabels &&
      (request.content?.trim().length ?? 0) > 0 &&
      !hasAnyAllowedSectionLabel(request.content ?? "")
    ) {
      setError(
        "Section labels are required. Add at least one labeled section (for example: Hero: ...).",
      );
      return;
    }

    setError(null);
    if (output.trim().length > 0) {
      setPreviousOutput(output);
      setPreviousVersionCreatedAt(currentVersionCreatedAt);
    }
    setOutput("");
    setRequestRef(null);
    setCurrentVersionCreatedAt(null);
    setRunning(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const userNotes = request.notes?.trim() ?? "";
      const submissionRequest: RewriteGenerateRequest = {
        ...request,
        notes:
          refineMode && deltaInstructions.trim().length > 0
            ? [
                userNotes.length > 0 ? userNotes : "",
                `Refine delta instructions: ${deltaInstructions.trim()}`,
              ]
                .filter((item) => item.length > 0)
                .join("\n\n")
            : userNotes.length > 0
              ? userNotes
              : undefined,
        strategicContext: {
          target: request.rewriteType,
          goal,
          icp: resolvedIcpLabel,
          focus: {
            differentiation: differentiationFocus,
            objection: objectionFocus,
          },
        },
        rewriteStrategy: strategy,
      };

      const result = await streamRewrite(submissionRequest, {
        signal: controller.signal,
        onChunk: (chunk) => {
          setOutput((previous) => previous + chunk);
        },
      });
      setRequestRef(result.requestRef);
      setCurrentVersionCreatedAt(result.requestCreatedAt ?? new Date().toISOString());
      toast({
        title: "Rewrite generated",
        description: "Your output is ready to copy or export.",
      });
      setRefineMode(false);
      setDeltaInstructions("");
    } catch (submissionError) {
      if (controller.signal.aborted) {
        setError("Generation canceled.");
      } else {
        const message =
          submissionError instanceof Error
            ? submissionError.message
            : isHttpError(submissionError)
              ? submissionError.message
              : "Unable to generate rewrite.";
        if (
          /shift stats contract validation/i.test(message) ||
          /metrics contract validation/i.test(message)
        ) {
          setOutput("");
        }
        setError(message);
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
  };

  const openVersion = (requestRefToOpen: string) => {
    const version = historyVersions.find(
      (item) => item.requestRef === requestRefToOpen,
    );
    if (!version) {
      return;
    }

    setRequest((previous) => ({
      ...previous,
      rewriteType: version.rewriteType,
      websiteUrl: version.websiteUrl ?? previous.websiteUrl,
      content: version.sourceContent ?? "",
      notes: version.userNotes ?? "",
    }));
    setOutput(version.outputMarkdown);
    setRequestRef(version.requestRef);
    setCurrentVersionCreatedAt(version.createdAt);
    setPreviousVersionCreatedAt(null);
    setUseCustomIcp(
      Boolean(version.strategicContext?.icp) &&
        version.strategicContext?.icp?.trim().toLowerCase() !==
          profileIcp.trim().toLowerCase(),
    );
    setCustomIcp(
      version.strategicContext?.icp &&
        version.strategicContext.icp.trim().toLowerCase() !==
          profileIcp.trim().toLowerCase()
        ? version.strategicContext.icp
        : "",
    );
    setGoal(version.strategicContext?.goal ?? "conversion");
    setDifferentiationFocus(
      version.strategicContext?.differentiationFocus ?? true,
    );
    setObjectionFocus(version.strategicContext?.objectionFocus ?? false);
    setStrategy((previous) => ({
      ...previous,
      tone:
        version.tone === "neutral" ||
        version.tone === "confident" ||
        version.tone === "technical" ||
        version.tone === "direct" ||
        version.tone === "founder-led" ||
        version.tone === "enterprise"
          ? version.tone
          : "neutral",
      length:
        version.length === "short" ||
        version.length === "standard" ||
        version.length === "long"
          ? version.length
          : "standard",
      emphasis:
        version.emphasis
          ?.filter(
            (item): item is RewriteStrategy["emphasis"][number] =>
              item === "clarity" ||
              item === "differentiation" ||
              item === "objection-handling" ||
              item === "pricing-clarity" ||
              item === "proof-credibility",
          )
          .slice(0, 5) ?? [],
      constraints: version.constraints ?? "",
      audience: version.audience ?? "",
    }));
    setRefineMode(false);
    setDeltaInstructions("");
    setCompareMode(false);
    setSelectedBaselineRef(null);
    setOriginalBaselineMap(null);
    setOriginalBaselineMapLoading(false);
    setOriginalBaselineMapError(null);
    setError(null);
    setHistoryOpen(false);
  };

  const restoreVersion = (requestRefToRestore: string) => {
    const version = historyVersions.find(
      (item) => item.requestRef === requestRefToRestore,
    );
    if (!version) {
      return;
    }

    setRequest((previous) => ({
      ...previous,
      rewriteType: version.rewriteType,
      websiteUrl: version.websiteUrl ?? previous.websiteUrl,
      content: version.sourceContent ?? "",
      notes: version.userNotes ?? "",
    }));
    setOutput(version.outputMarkdown);
    setRequestRef(version.requestRef);
    setCurrentVersionCreatedAt(version.createdAt);
    setPreviousVersionCreatedAt(null);
    setUseCustomIcp(
      Boolean(version.strategicContext?.icp) &&
        version.strategicContext?.icp?.trim().toLowerCase() !==
          profileIcp.trim().toLowerCase(),
    );
    setCustomIcp(
      version.strategicContext?.icp &&
        version.strategicContext.icp.trim().toLowerCase() !==
          profileIcp.trim().toLowerCase()
        ? version.strategicContext.icp
        : "",
    );
    setGoal(version.strategicContext?.goal ?? "conversion");
    setDifferentiationFocus(
      version.strategicContext?.differentiationFocus ?? true,
    );
    setObjectionFocus(version.strategicContext?.objectionFocus ?? false);
    setStrategy((previous) => ({
      ...previous,
      tone:
        version.tone === "neutral" ||
        version.tone === "confident" ||
        version.tone === "technical" ||
        version.tone === "direct" ||
        version.tone === "founder-led" ||
        version.tone === "enterprise"
          ? version.tone
          : "neutral",
      length:
        version.length === "short" ||
        version.length === "standard" ||
        version.length === "long"
          ? version.length
          : "standard",
      emphasis:
        version.emphasis
          ?.filter(
            (item): item is RewriteStrategy["emphasis"][number] =>
              item === "clarity" ||
              item === "differentiation" ||
              item === "objection-handling" ||
              item === "pricing-clarity" ||
              item === "proof-credibility",
          )
          .slice(0, 5) ?? [],
      constraints: version.constraints ?? "",
      audience: version.audience ?? "",
    }));
    setRefineMode(false);
    setDeltaInstructions("");
    setCompareMode(false);
    setSelectedBaselineRef(null);
    setOriginalBaselineMap(null);
    setOriginalBaselineMapLoading(false);
    setOriginalBaselineMapError(null);
    setError(null);
    setHistoryOpen(false);
    toast({
      title: "Version restored",
      description: "Version loaded as active workspace state.",
    });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(
      toStructuredMarkdownDocument(output, request.rewriteType),
    );
    toast({ title: "Copied", description: "Rewrite copied as markdown." });
  };

  const handleExport = (format: RewriteExportFormat) => {
    const base = `${request.rewriteType}-rewrite`;
    const structuredMarkdown = toStructuredMarkdownDocument(
      output,
      request.rewriteType,
    );
    if (format === "markdown") {
      downloadContent(`${base}.md`, "text/markdown", structuredMarkdown);
      return;
    }

    if (format === "text") {
      downloadContent(
        `${base}.txt`,
        "text/plain",
        toPlainTextDocument(structuredMarkdown),
      );
      return;
    }

    if (format === "pdf") {
      printPdfDocument(structuredMarkdown);
      return;
    }

    downloadContent(
      `${base}.html`,
      "text/html",
      toHtmlDocument(structuredMarkdown),
    );
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <RewriteStudioHeader
        disableActions={running}
        onOpenHistory={() => setHistoryOpen(true)}
        onNewRewrite={resetStudio}
      />
      {!compareMode ? (
        <RewriteStudioControlBar
          profileIcp={profileIcp}
          rewriteType={request.rewriteType}
          useCustomIcp={useCustomIcp}
          goal={goal}
          differentiationFocus={differentiationFocus}
          objectionFocus={objectionFocus}
          disabled={running}
          onRewriteTypeChange={(rewriteType) =>
            setRequest((previous) => ({ ...previous, rewriteType }))
          }
          onUseCustomIcpChange={setUseCustomIcp}
          onCustomIcpChange={setCustomIcp}
          customIcp={customIcp}
          onGoalChange={setGoal}
          onDifferentiationFocusChange={setDifferentiationFocus}
          onObjectionFocusChange={setObjectionFocus}
          onResetContext={resetControlContext}
        />
      ) : null}

      {compareMode ? (
        <RewriteComparisonPanel
          currentOutput={output}
          baselineOutput={selectedBaselineOutput}
          sourceContent={comparisonSourceContent}
          personaRole={resolvedIcpLabel}
          tone={strategy.tone}
          length={strategy.length}
          emphasis={strategy.emphasis}
          audience={strategy.audience}
          constraints={strategy.constraints}
          currentRequestRef={requestRef}
          baselineTimestampLabel={baselineTimestampLabel}
          currentTimestampLabel={currentTimestampLabel}
          compareBaselineOptions={baselineOptions}
          selectedBaselineRef={selectedBaselineRef}
          originalBaselineMap={originalBaselineMap}
          originalBaselineMapLoading={originalBaselineMapLoading}
          originalBaselineMapError={originalBaselineMapError}
          onSelectBaseline={setSelectedBaselineRef}
          onExitCompare={() => setCompareMode(false)}
        />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <RewriteInputPanel
            value={request}
            strategy={strategy}
            refineMode={refineMode}
            deltaInstructions={deltaInstructions}
            running={running}
            enforceSectionLabels={enforceSectionLabels}
            onChange={setRequest}
            onStrategyChange={setStrategy}
            onEnforceSectionLabelsChange={setEnforceSectionLabels}
            onDeltaInstructionsChange={setDeltaInstructions}
            onSubmit={() => void handleSubmit()}
            onCancel={handleCancel}
          />
          <div className="space-y-4">
            <RewriteExecutiveSummaryCard
              output={output}
              compareMode={compareMode}
            />
            <RewriteShiftStatsCards output={output} running={running} />
            <RewriteOutputPanel
              rewriteType={request.rewriteType}
              running={running}
              output={output}
              canCompare={canCompare}
              requestRef={requestRef}
              error={error}
              onCopy={() => void handleCopy()}
              onExport={(format) => {
                try {
                  handleExport(format);
                } catch (exportError) {
                  const message =
                    exportError instanceof Error
                      ? exportError.message
                      : "Unable to export rewrite.";
                  setError(message);
                  toast({
                    title: "Export failed",
                    description: message,
                  });
                }
              }}
              onSaveVersion={handleSaveVersion}
              onDuplicate={handleDuplicate}
              onRefine={handleRefine}
              onEnterCompare={() => {
                if (!selectedBaselineRef && baselineOptions.length > 0) {
                  setSelectedBaselineRef(baselineOptions[0].requestRef);
                }
                setCompareMode(true);
              }}
              onRetry={() => void handleSubmit()}
            />
            <RewriteStrategicRationaleCard
              output={output}
              compareMode={compareMode}
            />
          </div>
        </div>
      )}

      {!compareMode ? (
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <p className="text-sm text-foreground">
            Need the full audit workflow with score diagnostics and competitor
            benchmarking?
          </p>
          <div className="mt-4">
            <Button asChild variant="outline">
              <Link href="/dashboard/gap-engine">Run Gap Engine (Full report)</Link>
            </Button>
          </div>
        </div>
      ) : null}

      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Version History</SheetTitle>
            <SheetDescription>
              Open or restore previous rewrite versions.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-3 overflow-y-auto pr-1">
            {historyVersions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No rewrite versions available yet.
              </p>
            ) : (
              historyVersions.map((item) => (
                <div
                  key={item.requestRef}
                  className="rounded-lg border border-border/60 bg-card p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {item.rewriteType === "pricing" ? "Pricing" : "Homepage"}
                    </Badge>
                    <Badge variant="secondary">Saved</Badge>
                    {item.tone ? (
                      <Badge variant="secondary">{item.tone}</Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatHistoryTimestamp(item.createdAt)} | {item.requestRef}
                  </p>
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
                      onClick={() => openVersion(item.requestRef)}
                    >
                      Open
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => restoreVersion(item.requestRef)}
                    >
                      Restore
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
