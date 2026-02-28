"use client";

import { useRef, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { isHttpError } from "@/lib/api/httpClient";
import { RewriteInputPanel } from "@/features/rewrites/components/RewriteInputPanel";
import { RewriteOutputPanel } from "@/features/rewrites/components/RewriteOutputPanel";
import {
  RewriteStudioControlBar,
  type StudioGoal,
} from "@/features/rewrites/components/RewriteStudioControlBar";
import { RewriteStudioHeader } from "@/features/rewrites/components/RewriteStudioHeader";
import { streamRewrite } from "@/features/rewrites/services/rewritesClient";
import type {
  RewriteExportFormat,
  RewriteGenerateRequest,
  RewriteStudioInitialData,
} from "@/features/rewrites/types/rewrites.types";

type RewriteStudioViewProps = {
  initialData: RewriteStudioInitialData;
};

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

function downloadContent(filename: string, type: string, content: string) {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
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

  const selectedIcpLabel = useCustomIcp ? customIcp.trim() : profileIcp;
  const selectedGoalLabel =
    goal === "clarity"
      ? "Clarity"
      : goal === "differentiation"
        ? "Differentiation"
        : "Conversion";
  const resolvedIcpLabel =
    selectedIcpLabel.trim().length > 0 ? selectedIcpLabel : "Custom ICP";

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
    setOutput("");
    setError(null);
    setRequestRef(null);
  };

  const resetControlContext = () => {
    setRequest((previous) => ({ ...previous, rewriteType: "homepage" }));
    setUseCustomIcp(false);
    setCustomIcp("");
    setGoal("conversion");
    setDifferentiationFocus(true);
    setObjectionFocus(false);
  };

  const handleSubmit = async () => {
    if (useCustomIcp && customIcp.trim().length === 0) {
      setError("Custom ICP is required when ICP is set to Custom.");
      return;
    }

    setError(null);
    setOutput("");
    setRequestRef(null);
    setRunning(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const userNotes = request.notes?.trim() ?? "";
      const studioContext = [
        "Studio context:",
        `- Target: ${request.rewriteType === "pricing" ? "Pricing" : "Homepage"}`,
        `- ICP: ${resolvedIcpLabel}`,
        `- Goal: ${selectedGoalLabel}`,
        `- Differentiation focus: ${differentiationFocus ? "On" : "Off"}`,
        `- Objection focus: ${objectionFocus ? "On" : "Off"}`,
      ].join("\n");

      const submissionRequest: RewriteGenerateRequest = {
        ...request,
        notes:
          userNotes.length > 0
            ? `${studioContext}\n\nUser notes:\n${userNotes}`
            : studioContext,
      };

      const result = await streamRewrite(submissionRequest, {
        signal: controller.signal,
        onChunk: (chunk) => {
          setOutput((previous) => previous + chunk);
        },
      });
      setRequestRef(result.requestRef);
      toast({
        title: "Rewrite generated",
        description: "Your output is ready to copy or export.",
      });
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

  const handleCopy = async () => {
    await navigator.clipboard.writeText(toMarkdownDocument(output));
    toast({ title: "Copied", description: "Rewrite copied as markdown." });
  };

  const handleExport = (format: RewriteExportFormat) => {
    const base = `${request.rewriteType}-rewrite`;
    if (format === "markdown") {
      downloadContent(
        `${base}.md`,
        "text/markdown",
        toMarkdownDocument(output),
      );
      return;
    }

    if (format === "text") {
      downloadContent(`${base}.txt`, "text/plain", toPlainTextDocument(output));
      return;
    }

    downloadContent(`${base}.html`, "text/html", toHtmlDocument(output));
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <RewriteStudioHeader
        disableActions={running}
        onNewRewrite={resetStudio}
      />
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <RewriteInputPanel
          value={request}
          running={running}
          error={error}
          onChange={setRequest}
          onSubmit={() => void handleSubmit()}
          onCancel={handleCancel}
        />
        <RewriteOutputPanel
          rewriteType={request.rewriteType}
          running={running}
          output={output}
          requestRef={requestRef}
          onCopy={() => void handleCopy()}
          onExport={(format) => handleExport(format)}
        />
      </div>
    </div>
  );
}
