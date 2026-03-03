import { buildRewriteOutputViewModel } from "@/features/rewrites/services/rewriteOutputViewModel";
import type {
  RewriteExportFormat,
  RewriteType,
} from "@/features/rewrites/types/rewrites.types";

type BuildRewriteExportDocumentParams = {
  rewriteType: RewriteType;
  outputMarkdown: string;
  format: RewriteExportFormat;
  metadata?: {
    requestRef?: string | null;
    experimentGroupId?: string | null;
    versionNumber?: number | null;
    parentRequestRef?: string | null;
    isWinner?: boolean;
    winnerLabel?: string | null;
    hypothesis?: {
      type: string;
      controlledVariables: string[];
      treatmentVariables: string[];
      successCriteria: string;
      minimumDeltaLevel: string;
    } | null;
    deltaMetrics?: Record<string, unknown> | null;
    promptVersion?: number | null;
    systemTemplateVersion?: number | null;
    modelTemperature?: number | null;
  };
};

export type RewriteExportDocument = {
  filename: string;
  contentType: string;
  content: Uint8Array | string;
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

function escapePdfText(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)")
    .replace(/[^\x20-\x7E]/g, "");
}

export function buildSimplePdfFromMarkdown(markdown: string) {
  const encoder = new TextEncoder();
  const byteLength = (value: string) => encoder.encode(value).length;
  const lines = toPlainTextDocument(markdown)
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line, index, all) => line.length > 0 || (index > 0 && all[index - 1].length > 0))
    .slice(0, 45);
  const contentLines: string[] = ["BT", "/F1 11 Tf", "50 760 Td"];
  for (let index = 0; index < lines.length; index += 1) {
    const escaped = escapePdfText(lines[index]);
    if (index > 0) {
      contentLines.push("0 -14 Td");
    }
    contentLines.push(`(${escaped}) Tj`);
  }
  contentLines.push("ET");
  const stream = `${contentLines.join("\n")}\n`;

  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    `5 0 obj\n<< /Length ${byteLength(stream)} >>\nstream\n${stream}endstream\nendobj\n`,
  ];

  let body = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const object of objects) {
    offsets.push(byteLength(body));
    body += object;
  }

  const xrefStart = byteLength(body);
  body += `xref
0 ${objects.length + 1}
0000000000 65535 f 
`;
  for (let i = 1; i < offsets.length; i += 1) {
    body += `${offsets[i].toString().padStart(10, "0")} 00000 n \n`;
  }
  body += `trailer
<< /Size ${objects.length + 1} /Root 1 0 R >>
startxref
${xrefStart}
%%EOF`;

  return encoder.encode(body);
}

function toStructuredMarkdownDocument(
  output: string,
  rewriteType: RewriteType,
  metadata?: BuildRewriteExportDocumentParams["metadata"],
) {
  const model = buildRewriteOutputViewModel(output);
  const lines: string[] = [];
  lines.push(`# ${rewriteType === "pricing" ? "Pricing" : "Homepage"} Rewrite`);
  lines.push("");
  lines.push("## Experiment Metadata");
  lines.push(
    `- Request ref: ${metadata?.requestRef?.trim() ? metadata.requestRef : "N/A"}`,
  );
  lines.push(
    `- Experiment ID: ${metadata?.experimentGroupId?.trim() ? metadata.experimentGroupId : "N/A"}`,
  );
  lines.push(
    `- Version: ${typeof metadata?.versionNumber === "number" ? metadata.versionNumber : "N/A"}`,
  );
  lines.push(
    `- Parent version: ${metadata?.parentRequestRef?.trim() ? metadata.parentRequestRef : "N/A"}`,
  );
  lines.push(
    `- Winner: ${metadata?.isWinner ? `yes${metadata.winnerLabel ? ` (${metadata.winnerLabel})` : ""}` : "no"}`,
  );
  lines.push("");

  lines.push("## Hypothesis Contract");
  lines.push(`- Type: ${metadata?.hypothesis?.type ?? "N/A"}`);
  lines.push(
    `- Controlled variables: ${
      metadata?.hypothesis?.controlledVariables?.length
        ? metadata.hypothesis.controlledVariables.join(", ")
        : "N/A"
    }`,
  );
  lines.push(
    `- Treatment variables: ${
      metadata?.hypothesis?.treatmentVariables?.length
        ? metadata.hypothesis.treatmentVariables.join(", ")
        : "N/A"
    }`,
  );
  lines.push(
    `- Success criteria: ${metadata?.hypothesis?.successCriteria?.trim() ? metadata.hypothesis.successCriteria : "N/A"}`,
  );
  lines.push(
    `- Minimum delta level: ${metadata?.hypothesis?.minimumDeltaLevel ?? "N/A"}`,
  );
  lines.push("");

  lines.push("## Delta Metrics");
  lines.push(
    `- Lexical similarity: ${
      typeof metadata?.deltaMetrics?.lexical_similarity === "number"
        ? metadata.deltaMetrics.lexical_similarity.toFixed(4)
        : "N/A"
    }`,
  );
  lines.push(
    `- Headline changed: ${
      typeof metadata?.deltaMetrics?.headline_changed === "boolean"
        ? metadata.deltaMetrics.headline_changed
          ? "yes"
          : "no"
        : "N/A"
    }`,
  );
  lines.push(
    `- CTA changed: ${
      typeof metadata?.deltaMetrics?.cta_changed === "boolean"
        ? metadata.deltaMetrics.cta_changed
          ? "yes"
          : "no"
        : "N/A"
    }`,
  );
  lines.push(
    `- Structure changed: ${
      typeof metadata?.deltaMetrics?.structure_changed === "boolean"
        ? metadata.deltaMetrics.structure_changed
          ? "yes"
          : "no"
        : "N/A"
    }`,
  );
  lines.push(
    `- Delta level: ${
      typeof metadata?.deltaMetrics?.delta_level === "string"
        ? metadata.deltaMetrics.delta_level
        : "N/A"
    }`,
  );
  lines.push("");

  lines.push("## Prompt & Model Metadata");
  lines.push(
    `- Prompt version: ${typeof metadata?.promptVersion === "number" ? metadata.promptVersion : "N/A"}`,
  );
  lines.push(
    `- System template version: ${typeof metadata?.systemTemplateVersion === "number" ? metadata.systemTemplateVersion : "N/A"}`,
  );
  lines.push(
    `- Model temperature: ${typeof metadata?.modelTemperature === "number" ? metadata.modelTemperature.toFixed(2) : "N/A"}`,
  );
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
    params.metadata,
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
    contentType: "application/pdf",
    content: buildSimplePdfFromMarkdown(structuredMarkdown),
  };
}
