"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { RewriteOutputActionBar } from "@/features/rewrites/components/RewriteOutputActionBar";
import { RewriteShiftStatsCards } from "@/features/rewrites/components/RewriteShiftStatsCards";
import { RewriteStrategicRationaleCard } from "@/features/rewrites/components/RewriteStrategicRationaleCard";
import {
  RewriteStudioControlBar,
  type StudioGoal,
} from "@/features/rewrites/components/RewriteStudioControlBar";
import { RewriteStudioHeader } from "@/features/rewrites/components/RewriteStudioHeader";
import {
  exportRewrite,
  exportRewriteComparison,
  mapRewriteSections,
  streamRewrite,
} from "@/features/rewrites/services/rewritesClient";
import { hasAnyAllowedSectionLabel } from "@/features/rewrites/services/sectionLabelUtils";
import { buildRewriteOutputViewModel } from "@/features/rewrites/services/rewriteOutputViewModel";
import { buildRewriteExportDocument } from "@/features/rewrites/services/rewriteExportService";
import { markWinnerAction } from "@/features/rewrites/actions/markWinner";
import type {
  RewriteExportFormat,
  RewriteGenerateRequest,
  RewriteHypothesis,
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
const REWRITE_STUDIO_HYPOTHESIS_STORAGE_KEY =
  "optivexiq.rewrite_studio.hypothesis.v1";
const ORIGINAL_BASELINE_REF = "__original_draft__";

const DEFAULT_REWRITE_HYPOTHESIS: RewriteHypothesis = {
  type: "clarity_simplification",
  controlledVariables: ["audience", "tone"],
  treatmentVariables: ["headline"],
  successCriteria: "Improve clarity and conversion intent for the target page.",
  minimumDeltaLevel: "moderate",
};

function createIdempotencyKey() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function downloadBlob(filename: string, blob: Blob) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function printHtmlBlob(blob: Blob) {
  const html = await blob.text();
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

function normalizeHypothesis(value?: Partial<RewriteHypothesis> | null): RewriteHypothesis {
  const type =
    value?.type === "positioning_shift" ||
    value?.type === "objection_attack" ||
    value?.type === "differentiation_emphasis" ||
    value?.type === "risk_reduction" ||
    value?.type === "authority_increase" ||
    value?.type === "clarity_simplification"
      ? value.type
      : DEFAULT_REWRITE_HYPOTHESIS.type;

  const controlledVariables = Array.isArray(value?.controlledVariables)
    ? value.controlledVariables.filter(
        (item): item is RewriteHypothesis["controlledVariables"][number] =>
          item === "audience" ||
          item === "tone" ||
          item === "structure" ||
          item === "value_prop" ||
          item === "cta_type" ||
          item === "proof_points" ||
          item === "pricing_frame",
      )
    : [];

  const treatmentVariables = Array.isArray(value?.treatmentVariables)
    ? value.treatmentVariables.filter(
        (item): item is RewriteHypothesis["treatmentVariables"][number] =>
          item === "headline" ||
          item === "primary_cta" ||
          item === "objection_handling" ||
          item === "differentiators" ||
          item === "risk_reversal" ||
          item === "proof_depth" ||
          item === "pricing_anchor",
      )
    : [];

  return {
    type,
    controlledVariables:
      controlledVariables.length >= 2
        ? Array.from(new Set(controlledVariables))
        : DEFAULT_REWRITE_HYPOTHESIS.controlledVariables,
    treatmentVariables:
      treatmentVariables.length >= 1
        ? Array.from(new Set(treatmentVariables))
        : DEFAULT_REWRITE_HYPOTHESIS.treatmentVariables,
    successCriteria:
      typeof value?.successCriteria === "string" &&
      value.successCriteria.trim().length >= 8
        ? value.successCriteria
        : DEFAULT_REWRITE_HYPOTHESIS.successCriteria,
    minimumDeltaLevel:
      value?.minimumDeltaLevel === "light" ||
      value?.minimumDeltaLevel === "moderate" ||
      value?.minimumDeltaLevel === "strong"
        ? value.minimumDeltaLevel
        : DEFAULT_REWRITE_HYPOTHESIS.minimumDeltaLevel,
  };
}

export function RewriteStudioView({ initialData }: RewriteStudioViewProps) {
  const { toast } = useToast();
  const abortRef = useRef<AbortController | null>(null);
  const [request, setRequest] = useState<RewriteGenerateRequest>({
    rewriteType: "homepage",
    idempotencyKey: createIdempotencyKey(),
    websiteUrl: initialData.defaultWebsiteUrl,
    content: "",
    notes: "",
    hypothesis: DEFAULT_REWRITE_HYPOTHESIS,
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
  const originalBaselineMapCacheRef = useRef<
    Map<string, RewriteSectionMapResult>
  >(new Map());
  const [refineMode, setRefineMode] = useState(false);
  const [deltaInstructions, setDeltaInstructions] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
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
  const [hypothesis, setHypothesis] = useState<RewriteHypothesis>(
    normalizeHypothesis(
      initialData.historyVersions?.find(
        (item) => item.requestRef === initialData.initialRequestRef,
      )?.hypothesis,
    ),
  );
  const [historyVersions, setHistoryVersions] = useState(
    initialData.historyVersions ?? [],
  );
  const [winnerMutationRunning, setWinnerMutationRunning] = useState(false);
  const [idempotentReplay, setIdempotentReplay] = useState(false);
  const [compareExportRunning, setCompareExportRunning] = useState(false);

  const selectedIcpLabel = useCustomIcp ? customIcp.trim() : profileIcp;
  const resolvedIcpLabel =
    selectedIcpLabel.trim().length > 0 ? selectedIcpLabel : "Custom ICP";
  const currentVersionSourceContent =
    requestRef != null
      ? (historyVersions.find((item) => item.requestRef === requestRef)
          ?.sourceContent ?? null)
      : null;
  const comparisonSourceContent = useMemo(() => {
    if (requestRef != null) {
      return currentVersionSourceContent ?? "";
    }
    return request.content?.trim().length ? request.content : "";
  }, [requestRef, currentVersionSourceContent, request.content]);
  const compareBaselineOptions = useMemo(
    () => {
      const current = requestRef
        ? historyVersions.find((item) => item.requestRef === requestRef)
        : null;
      const currentExperimentId = current?.experimentGroupId ?? null;
      const candidates = historyVersions.filter(
        (item) =>
          item.requestRef !== requestRef &&
          (!currentExperimentId || item.experimentGroupId === currentExperimentId),
      );
      const sorted = [...candidates].sort((left, right) => {
        if (left.isControl && !right.isControl) {
          return -1;
        }
        if (!left.isControl && right.isControl) {
          return 1;
        }
        return right.createdAt.localeCompare(left.createdAt);
      });

      return sorted.map((item) => {
        const target = item.rewriteType === "pricing" ? "Pricing" : "Homepage";
        const role = item.isControl
          ? "Control (original input)"
          : `Treatment v${item.versionNumber ?? "?"}`;
        return {
          requestRef: item.requestRef,
          label: `${role} | ${target} | ${item.requestRef}`,
        };
      });
    },
    [historyVersions, requestRef],
  );
  const baselineOptions = useMemo(() => compareBaselineOptions, [compareBaselineOptions]);
  const isOriginalBaselineSelected =
    selectedBaselineRef === ORIGINAL_BASELINE_REF;
  const selectedBaselineOutput = isOriginalBaselineSelected
    ? comparisonSourceContent
    : (historyVersions.find((item) => item.requestRef === selectedBaselineRef)
        ?.outputMarkdown ?? previousOutput);
  const selectedBaselineTimestamp = selectedBaselineRef
    ? historyVersions.find((item) => item.requestRef === selectedBaselineRef)
        ?.createdAt
    : null;
  const baselineTimestamp =
    selectedBaselineTimestamp ?? previousVersionCreatedAt;
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
  const currentVersionRecord = requestRef
    ? historyVersions.find((item) => item.requestRef === requestRef)
    : null;
  const baselineVersionRecord =
    selectedBaselineRef && selectedBaselineRef !== ORIGINAL_BASELINE_REF
      ? historyVersions.find((item) => item.requestRef === selectedBaselineRef)
      : null;

  useEffect(() => {
    if (!compareMode) {
      return;
    }

    const hasSelected =
      selectedBaselineRef != null &&
      baselineOptions.some((option) => option.requestRef === selectedBaselineRef);
    if (hasSelected) {
      return;
    }

    const preferredControl = baselineOptions.find((option) => {
      const record = historyVersions.find(
        (item) => item.requestRef === option.requestRef,
      );
      return Boolean(record?.isControl);
    });

    setSelectedBaselineRef(preferredControl?.requestRef ?? baselineOptions[0]?.requestRef ?? null);
  }, [compareMode, baselineOptions, selectedBaselineRef, historyVersions]);
  const strategySnapshot = useMemo(() => {
    const parts: string[] = [];
    const targetLabel =
      request.rewriteType === "pricing" ? "Pricing" : "Homepage";
    parts.push(`Target ${targetLabel}`);
    parts.push(`Goal ${goal}`);
    parts.push(`ICP ${resolvedIcpLabel}`);
    parts.push(`Tone ${strategy.tone}`);
    parts.push(`Length ${strategy.length}`);
    if (strategy.emphasis.length > 0) {
      parts.push(`Emphasis ${strategy.emphasis.join(", ")}`);
    }
    return parts.join(" | ");
  }, [
    request.rewriteType,
    goal,
    resolvedIcpLabel,
    strategy.tone,
    strategy.length,
    strategy.emphasis,
  ]);
  const outputViewModel = useMemo(
    () => buildRewriteOutputViewModel(output),
    [output],
  );
  const studioStatus = useMemo(() => {
    if (!isOnline) {
      return "offline" as const;
    }
    if (running) {
      return "processing" as const;
    }
    if (error) {
      return "error" as const;
    }
    return "ready" as const;
  }, [isOnline, running, error]);
  const studioStatusTooltip = useMemo(() => {
    if (studioStatus === "processing") {
      return "Processing: rewrite generation in progress.";
    }
    if (studioStatus === "offline") {
      return "Offline: reconnect to run rewrite requests.";
    }
    if (studioStatus === "error") {
      return "Error: last request returned an error.";
    }
    return "Ready: rewrite studio is available.";
  }, [studioStatus]);
  const studioStatusToneClass = useMemo(() => {
    if (studioStatus === "processing") {
      return "text-amber-500";
    }
    if (studioStatus === "offline") {
      return "text-slate-500";
    }
    if (studioStatus === "error") {
      return "text-rose-500";
    }
    return "text-emerald-500";
  }, [studioStatus]);

  useEffect(() => {
    setIsOnline(window.navigator.onLine);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    const raw = window.localStorage.getItem(
      REWRITE_STUDIO_HYPOTHESIS_STORAGE_KEY,
    );
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<RewriteHypothesis>;
      setHypothesis(normalizeHypothesis(parsed));
    } catch {
      window.localStorage.removeItem(REWRITE_STUDIO_HYPOTHESIS_STORAGE_KEY);
    }
  }, []);

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
        modifierPressed && event.altKey && event.key.toLowerCase() === "c";

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
      REWRITE_STUDIO_HYPOTHESIS_STORAGE_KEY,
      JSON.stringify(hypothesis),
    );
  }, [hypothesis]);

  useEffect(() => {
    window.localStorage.setItem(
      REWRITE_STUDIO_INPUT_POLICY_STORAGE_KEY,
      JSON.stringify({ enforceSectionLabels }),
    );
  }, [enforceSectionLabels]);

  const resetStudio = () => {
    setRequest({
      rewriteType: "homepage",
      idempotencyKey: createIdempotencyKey(),
      websiteUrl: initialData.defaultWebsiteUrl,
      content: "",
      notes: "",
      hypothesis: DEFAULT_REWRITE_HYPOTHESIS,
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
    setHypothesis(DEFAULT_REWRITE_HYPOTHESIS);
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

  const handleOpenHistory = () => {
    setHistoryOpen(true);
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
    setRequest((previous) => ({
      ...previous,
      idempotencyKey: createIdempotencyKey(),
    }));
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

  const handleSubmit = async (overrideIdempotencyKey?: string) => {
    const controlledVariables = Array.from(new Set(hypothesis.controlledVariables));
    const treatmentVariables = Array.from(new Set(hypothesis.treatmentVariables));
    const successCriteria = hypothesis.successCriteria.trim();
    if (controlledVariables.length < 2) {
      setError("Select at least 2 controlled variables in Hypothesis.");
      return;
    }
    if (treatmentVariables.length < 1) {
      setError("Select at least 1 treatment variable in Hypothesis.");
      return;
    }
    if (successCriteria.length < 8) {
      setError("Success criteria is required in Hypothesis.");
      return;
    }

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
    setIdempotentReplay(false);
    setRunning(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const activeIdempotencyKey =
        overrideIdempotencyKey && overrideIdempotencyKey.trim().length > 0
          ? overrideIdempotencyKey
          : (request.idempotencyKey?.trim().length ?? 0) > 0
            ? request.idempotencyKey
            : createIdempotencyKey();
      if (activeIdempotencyKey !== request.idempotencyKey) {
        setRequest((previous) => ({
          ...previous,
          idempotencyKey: activeIdempotencyKey,
        }));
      }
      const userNotes = request.notes?.trim() ?? "";
      const parentRequestRef = requestRef;
      const submissionRequest: RewriteGenerateRequest = {
        ...request,
        idempotencyKey: activeIdempotencyKey,
        parentRequestRef: parentRequestRef ?? undefined,
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
        hypothesis: {
          type: hypothesis.type,
          controlledVariables,
          treatmentVariables,
          successCriteria,
          minimumDeltaLevel: hypothesis.minimumDeltaLevel,
        },
      };

      const result = await streamRewrite(submissionRequest, {
        signal: controller.signal,
        onChunk: (chunk) => {
          setOutput((previous) => previous + chunk);
        },
      });
      setOutput(result.content);
      setRequestRef(result.requestRef);
      setCurrentVersionCreatedAt(
        result.requestCreatedAt ?? new Date().toISOString(),
      );
      setIdempotentReplay(result.idempotentReplay);
      const nextRequestRef = result.requestRef;
      if (nextRequestRef) {
        setHistoryVersions((previous) => {
          const nextCreatedAt =
            result.requestCreatedAt ?? new Date().toISOString();
          const parentVersion = parentRequestRef
            ? previous.find((item) => item.requestRef === parentRequestRef)
            : null;
          const inferredControlRequestRef =
            parentVersion?.controlRequestRef ??
            (parentVersion?.isControl ? parentVersion.requestRef : null) ??
            (!parentRequestRef ? `${nextRequestRef}-control` : null);

          const syntheticControl =
            !parentRequestRef && inferredControlRequestRef
              ? {
                  requestRef: inferredControlRequestRef,
                  isControl: true,
                  controlRequestRef: inferredControlRequestRef,
                  experimentGroupId: parentVersion?.experimentGroupId,
                  parentRequestRef: null,
                  versionNumber: 0,
                  isWinner: false,
                  winnerLabel: null,
                  winnerMarkedAt: null,
                  rewriteType: submissionRequest.rewriteType,
                  createdAt: nextCreatedAt,
                  outputMarkdown:
                    submissionRequest.content?.trim().length
                      ? submissionRequest.content
                      : "_No pasted source content provided for this control baseline._",
                  websiteUrl: submissionRequest.websiteUrl ?? null,
                  sourceContent: submissionRequest.content ?? null,
                  userNotes: submissionRequest.notes ?? "",
                  strategicContext: {
                    goal,
                    icp: resolvedIcpLabel,
                    differentiationFocus: differentiationFocus,
                    objectionFocus: objectionFocus,
                  },
                  tone: strategy.tone,
                  length: strategy.length,
                  emphasis: [...strategy.emphasis],
                  constraints: strategy.constraints ?? "",
                  audience: strategy.audience ?? "",
                  strategyContext: {
                    target: submissionRequest.rewriteType,
                    goal,
                    icp: resolvedIcpLabel,
                    tone: strategy.tone,
                    length: strategy.length,
                    emphasis: [...strategy.emphasis],
                    constraints: strategy.constraints ?? "",
                    audience: strategy.audience ?? "",
                    focus: {
                      differentiation: differentiationFocus,
                      objection: objectionFocus,
                    },
                    schemaVersion: 1,
                  },
                  idempotencyKey: `${submissionRequest.idempotencyKey}:control`,
                  hypothesis: submissionRequest.hypothesis,
                }
              : null;

          const nextVersion = {
            requestRef: nextRequestRef,
            isControl: false,
            controlRequestRef: inferredControlRequestRef,
            rewriteType: submissionRequest.rewriteType,
            createdAt: nextCreatedAt,
            outputMarkdown: result.content,
            websiteUrl: submissionRequest.websiteUrl ?? null,
            sourceContent: submissionRequest.content ?? null,
            userNotes: submissionRequest.notes ?? "",
            strategicContext: {
              goal,
              icp: resolvedIcpLabel,
              differentiationFocus: differentiationFocus,
              objectionFocus: objectionFocus,
            },
            tone: strategy.tone,
            length: strategy.length,
            emphasis: [...strategy.emphasis],
            constraints: strategy.constraints ?? "",
            audience: strategy.audience ?? "",
            strategyContext: {
              target: submissionRequest.rewriteType,
              goal,
              icp: resolvedIcpLabel,
              tone: strategy.tone,
              length: strategy.length,
              emphasis: [...strategy.emphasis],
              constraints: strategy.constraints ?? "",
              audience: strategy.audience ?? "",
              focus: {
                differentiation: differentiationFocus,
                objection: objectionFocus,
              },
              schemaVersion: 1,
            },
            idempotencyKey: submissionRequest.idempotencyKey,
            hypothesis: submissionRequest.hypothesis,
            deltaMetrics:
              result.deltaLexicalSimilarity == null
                ? null
                : {
                    lexical_similarity: result.deltaLexicalSimilarity,
                    delta_level: submissionRequest.hypothesis.minimumDeltaLevel,
                  },
          };
          const withoutCurrent = previous.filter(
            (item) => item.requestRef !== nextRequestRef,
          );
          const withoutControl = syntheticControl
            ? withoutCurrent.filter(
                (item) => item.requestRef !== syntheticControl.requestRef,
              )
            : withoutCurrent;
          return syntheticControl
            ? [nextVersion, syntheticControl, ...withoutControl]
            : [nextVersion, ...withoutControl];
        });
      }
      setRequest((previous) => ({
        ...previous,
        idempotencyKey: createIdempotencyKey(),
      }));
      toast({
        title: result.idempotentReplay ? "Previous result returned" : "Rewrite generated",
        description: result.idempotentReplay
          ? "Duplicate request detected. Force a new variation to run a fresh generation."
          : "Your output is ready to copy or export.",
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
          /metrics contract validation/i.test(message) ||
          /structured contract validation/i.test(message)
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

  const handleForceNewVariation = () => {
    if (running) {
      return;
    }
    const forcedIdempotencyKey = createIdempotencyKey();
    setRequest((previous) => ({
      ...previous,
      idempotencyKey: forcedIdempotencyKey,
    }));
    setIdempotentReplay(false);
    void handleSubmit(forcedIdempotencyKey);
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
      idempotencyKey: createIdempotencyKey(),
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
    setHypothesis(normalizeHypothesis(version.hypothesis));
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
      idempotencyKey: createIdempotencyKey(),
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
    setHypothesis(normalizeHypothesis(version.hypothesis));
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
    const markdown = buildRewriteExportDocument({
      rewriteType: request.rewriteType,
      outputMarkdown: output,
      format: "markdown",
    }).content;
    await navigator.clipboard.writeText(markdown);
    toast({ title: "Copied", description: "Rewrite copied as markdown." });
  };

  const handleExport = async (format: RewriteExportFormat) => {
    if (!requestRef) {
      throw new Error("Save or generate this rewrite before exporting.");
    }

    const exported = await exportRewrite({ requestRef, format });
    if (format === "pdf") {
      await printHtmlBlob(exported.blob);
      return;
    }
    downloadBlob(exported.filename, exported.blob);
  };

  const handleCompareExport = async (format: "markdown" | "html" | "pdf") => {
    if (!requestRef) {
      throw new Error("Generate a current rewrite before exporting comparison.");
    }
    if (!selectedBaselineRef || selectedBaselineRef === ORIGINAL_BASELINE_REF) {
      throw new Error("Select a saved baseline version for server compare export.");
    }
    setCompareExportRunning(true);
    try {
      const exported = await exportRewriteComparison({
        baselineRequestRef: selectedBaselineRef,
        currentRequestRef: requestRef,
        format,
      });
      if (format === "pdf") {
        await printHtmlBlob(exported.blob);
        return;
      }
      downloadBlob(exported.filename, exported.blob);
    } finally {
      setCompareExportRunning(false);
    }
  };

  const handleMarkWinner = async (winnerRequestRef: string) => {
    setWinnerMutationRunning(true);
    try {
      const result = await markWinnerAction({ requestRef: winnerRequestRef });
      if (result.error !== null) {
        setError(result.error);
        toast({
          title: "Unable to mark winner",
          description: result.error,
        });
        return;
      }

      setHistoryVersions((previous) =>
        previous.map((version) =>
          version.experimentGroupId === result.experimentGroupId
            ? {
                ...version,
                isWinner: version.requestRef === result.requestRef,
                winnerLabel:
                  version.requestRef === result.requestRef
                    ? (result.winnerLabel ?? undefined)
                    : undefined,
                winnerMarkedAt:
                  version.requestRef === result.requestRef
                    ? result.winnerMarkedAt
                    : undefined,
              }
            : version,
        ),
      );

      toast({
        title: "Winner marked",
        description: "Winning version updated for this experiment.",
      });
    } finally {
      setWinnerMutationRunning(false);
    }
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
          baselineVersionNumber={baselineVersionRecord?.versionNumber ?? null}
          currentVersionNumber={currentVersionRecord?.versionNumber ?? null}
          baselineIsWinner={Boolean(baselineVersionRecord?.isWinner)}
          currentIsWinner={Boolean(currentVersionRecord?.isWinner)}
          baselineIsControl={Boolean(baselineVersionRecord?.isControl)}
          currentIsControl={Boolean(currentVersionRecord?.isControl)}
          hypothesisSummary={{
            type:
              currentVersionRecord?.hypothesis?.type ??
              hypothesis.type,
            minimumDeltaLevel:
              currentVersionRecord?.hypothesis?.minimumDeltaLevel ??
              hypothesis.minimumDeltaLevel,
            controlledVariables:
              currentVersionRecord?.hypothesis?.controlledVariables ??
              hypothesis.controlledVariables,
            treatmentVariables:
              currentVersionRecord?.hypothesis?.treatmentVariables ??
              hypothesis.treatmentVariables,
            successCriteria:
              currentVersionRecord?.hypothesis?.successCriteria ??
              hypothesis.successCriteria,
          }}
          onMarkBaselineWinner={
            baselineVersionRecord
              ? () => handleMarkWinner(baselineVersionRecord.requestRef)
              : undefined
          }
          onMarkCurrentWinner={
            currentVersionRecord
              ? () => handleMarkWinner(currentVersionRecord.requestRef)
              : undefined
          }
          winnerActionDisabled={winnerMutationRunning || running || idempotentReplay}
          compareBaselineOptions={baselineOptions}
          selectedBaselineRef={selectedBaselineRef}
          originalBaselineMap={originalBaselineMap}
          originalBaselineMapLoading={originalBaselineMapLoading}
          originalBaselineMapError={originalBaselineMapError}
          canServerExport={Boolean(
            requestRef &&
              selectedBaselineRef &&
              selectedBaselineRef !== ORIGINAL_BASELINE_REF,
          )}
          exportingCompare={compareExportRunning}
          onExportCompare={(format) => {
            void handleCompareExport(format).catch((exportError: unknown) => {
              const message =
                exportError instanceof Error
                  ? exportError.message
                  : "Unable to export comparison.";
              setError(message);
              toast({
                title: "Compare export failed",
                description: message,
              });
            });
          }}
          onSelectBaseline={setSelectedBaselineRef}
          onExitCompare={() => setCompareMode(false)}
        />
      ) : (
        <div className="grid gap-0 overflow-hidden rounded-xl border border-border/60 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.45fr)]">
          <section className="space-y-4 bg-card/30 p-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/80">
                Source Input
              </p>
              <div className="h-px bg-border/60" />
            </div>
            <RewriteInputPanel
              value={request}
              strategy={strategy}
              hypothesis={hypothesis}
              refineMode={refineMode}
              deltaInstructions={deltaInstructions}
              running={running}
              enforceSectionLabels={enforceSectionLabels}
              onChange={setRequest}
              onStrategyChange={setStrategy}
              onHypothesisChange={setHypothesis}
              onEnforceSectionLabelsChange={setEnforceSectionLabels}
              onDeltaInstructionsChange={setDeltaInstructions}
              onSubmit={() => void handleSubmit()}
              onCancel={handleCancel}
            />
          </section>

          <section className="flex h-full flex-col border-t border-border/60 bg-background p-6 lg:border-t-0 lg:border-l lg:border-border/60">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label="Rewrite studio status"
                          className="inline-flex h-5 w-5 items-center justify-center"
                        >
                          <span className="relative inline-flex h-4 w-4 items-center justify-center">
                            <span
                              className={[
                                "absolute inset-0 rounded-full",
                                studioStatus === "processing"
                                  ? "bg-amber-500/30"
                                  : studioStatus === "ready"
                                    ? "bg-emerald-500/30"
                                    : studioStatus === "offline"
                                      ? "bg-slate-500/30"
                                      : "bg-rose-500/30",
                                "animate-[pulse_2.8s_cubic-bezier(0.4,0,0.2,1)_infinite]",
                              ].join(" ")}
                              aria-hidden="true"
                            />
                            <span
                              className={[
                                "h-2 w-2 rounded-full",
                                studioStatus === "processing"
                                  ? "bg-amber-500"
                                  : studioStatus === "ready"
                                    ? "bg-emerald-500"
                                    : studioStatus === "offline"
                                      ? "bg-slate-500"
                                      : "bg-rose-500",
                              ].join(" ")}
                            />
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        {studioStatusTooltip}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/80">
                    Analysis & Output
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {outputViewModel.confidence ? (
                    <span>Confidence Score: {outputViewModel.confidence}</span>
                  ) : null}
                  <span className={studioStatusToneClass}>
                    {studioStatus === "processing"
                      ? "Processing"
                      : studioStatus === "offline"
                        ? "Offline"
                        : studioStatus === "error"
                          ? "Error"
                          : "Ready"}
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label="Status details"
                          className={`inline-flex h-4 w-4 items-center justify-center ${studioStatusToneClass}`}
                        >
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        {studioStatusTooltip}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <div className="h-px bg-border/60" />
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-4">
              {idempotentReplay ? (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
                  <p className="font-medium">
                    Previous result returned (duplicate request detected).
                  </p>
                  <div className="mt-2">
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      disabled={running}
                      onClick={handleForceNewVariation}
                    >
                      Force new variation
                    </Button>
                  </div>
                </div>
              ) : null}
              <RewriteExecutiveSummaryCard
                output={output}
                compareMode={compareMode}
              />
              <RewriteShiftStatsCards output={output} running={running} />
              <RewriteOutputPanel
                rewriteType={request.rewriteType}
                running={running}
                output={output}
                requestRef={requestRef}
                error={error}
                metadata={{
                  experimentId: currentVersionRecord?.experimentGroupId ?? null,
                  versionNumber: currentVersionRecord?.versionNumber ?? null,
                  parentRequestRef:
                    currentVersionRecord?.parentRequestRef ?? null,
                  isWinner: Boolean(currentVersionRecord?.isWinner),
                  winnerLabel: currentVersionRecord?.winnerLabel ?? null,
                  strategySnapshot,
                  deltaMetrics: currentVersionRecord?.deltaMetrics ?? null,
                  idempotentReplay,
                }}
                onRetry={() => void handleSubmit()}
              />
              <RewriteOutputActionBar
                canExport={output.trim().length > 0 && Boolean(requestRef)}
                canCompare={canCompare}
                running={running}
                showRunGapEngine
                onOpenHistory={handleOpenHistory}
                onDuplicate={handleDuplicate}
                onRefine={handleRefine}
                onCopy={() => void handleCopy()}
                onEnterCompare={() => {
                  if (!selectedBaselineRef && baselineOptions.length > 0) {
                    setSelectedBaselineRef(baselineOptions[0].requestRef);
                  }
                  setCompareMode(true);
                }}
                onExport={(format) => {
                  void handleExport(format).catch((exportError: unknown) => {
                    const message =
                      exportError instanceof Error
                        ? exportError.message
                        : "Unable to export rewrite.";
                    setError(message);
                    toast({
                      title: "Export failed",
                      description: message,
                    });
                  });
                }}
              />
              <RewriteStrategicRationaleCard
                output={output}
                compareMode={compareMode}
              />
            </div>
          </section>
        </div>
      )}

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
                    <Badge variant="secondary">
                      {item.isControl ? "Control" : "Treatment"}
                    </Badge>
                    <Badge variant="secondary">Saved</Badge>
                    {item.tone ? (
                      <Badge variant="secondary">{item.tone}</Badge>
                    ) : null}
                    {item.isWinner ? (
                      <Badge variant="secondary">Winner</Badge>
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
