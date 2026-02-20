"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Copy, Download, FileCode2, FileText, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  RewriteExportFormat,
  RewriteType,
} from "@/features/rewrites/types/rewrites.types";

type RewriteOutputPanelProps = {
  rewriteType: RewriteType;
  running: boolean;
  output: string;
  requestRef: string | null;
  onCopy: () => void | Promise<void>;
  onExport: (format: RewriteExportFormat) => void;
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
  requestRef,
  onCopy,
  onExport,
}: RewriteOutputPanelProps) {
  const canExport = output.trim().length > 0;
  const filename = useMemo(() => filenameFor(rewriteType), [rewriteType]);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <Button variant="secondary" onClick={() => void handleCopy()} disabled={!canExport}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-4 h-135 overflow-y-auto rounded-lg border border-border/60 bg-secondary/30 p-4">
        {running && !output ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Waiting for first tokens...
          </div>
        ) : output ? (
          <article className="prose prose-sm max-w-none prose-headings:mb-2 prose-headings:mt-4 prose-headings:font-semibold prose-headings:text-foreground prose-p:my-2 prose-p:leading-relaxed prose-p:text-foreground prose-li:my-1 prose-li:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-blockquote:text-foreground prose-strong:text-foreground prose-code:rounded prose-code:bg-secondary prose-code:px-1 prose-code:py-0.5 prose-code:font-mono prose-code:text-foreground prose-pre:bg-secondary prose-pre:text-foreground prose-hr:my-4 prose-hr:border-border prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
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
                  />
                ),
              }}
            >
              {output}
            </ReactMarkdown>
          </article>
        ) : (
          <p className="text-sm text-muted-foreground">
            Submit a rewrite request to generate output.
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>Filename: {filename}</span>
        <span>Request: {requestRef ?? "N/A"}</span>
      </div>
    </div>
  );
}
