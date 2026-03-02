import { buildRewriteOutputViewModel } from "@/features/rewrites/services/rewriteOutputViewModel";
import type {
  RewriteExportFormat,
  RewriteType,
} from "@/features/rewrites/types/rewrites.types";

type BuildRewriteExportDocumentParams = {
  rewriteType: RewriteType;
  outputMarkdown: string;
  format: RewriteExportFormat;
};

export type RewriteExportDocument = {
  filename: string;
  contentType: string;
  content: string;
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

function toStructuredMarkdownDocument(
  output: string,
  rewriteType: RewriteType,
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
  const copySections = model.copySections;
  if (copySections.length === 0) {
    lines.push("Not available for this rewrite.");
    lines.push("");
  }
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

export function buildRewriteExportDocument(
  params: BuildRewriteExportDocumentParams,
): RewriteExportDocument {
  const base = `${params.rewriteType}-rewrite`;
  const structuredMarkdown = toStructuredMarkdownDocument(
    params.outputMarkdown,
    params.rewriteType,
  );

  if (params.format === "markdown") {
    return {
      filename: `${base}.md`,
      contentType: "text/markdown; charset=utf-8",
      content: structuredMarkdown,
    };
  }

  if (params.format === "text") {
    return {
      filename: `${base}.txt`,
      contentType: "text/plain; charset=utf-8",
      content: toPlainTextDocument(structuredMarkdown),
    };
  }

  if (params.format === "html") {
    return {
      filename: `${base}.html`,
      contentType: "text/html; charset=utf-8",
      content: toHtmlDocument(structuredMarkdown),
    };
  }

  return {
    filename: `${base}.pdf`,
    contentType: "text/html; charset=utf-8",
    content: toHtmlDocument(structuredMarkdown),
  };
}
