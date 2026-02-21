"use client";

import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { isHttpError } from "@/lib/api/httpClient";
import { RewriteInputPanel } from "@/features/rewrites/components/RewriteInputPanel";
import { RewriteOutputPanel } from "@/features/rewrites/components/RewriteOutputPanel";
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
  });
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [requestRef, setRequestRef] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setOutput("");
    setRequestRef(null);
    setRunning(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await streamRewrite(request, {
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Rewrite Studio
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">
            On-demand homepage and pricing rewrites
          </h1>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        No hard cap on rewrites on Pro (within token limits).
      </p>

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
