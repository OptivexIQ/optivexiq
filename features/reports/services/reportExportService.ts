import type { ConversionGapReport } from "@/features/reports/types/report.types";

type ExportFormat = "pdf" | "html" | "txt";

type ExportPayload = {
  contentType: string;
  filename: string;
  body: Uint8Array | string;
};

function sanitizeFilePart(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-");
  return normalized.replace(/^-+|-+$/g, "") || "report";
}

function buildFilename(report: ConversionGapReport, format: ExportFormat) {
  const company = sanitizeFilePart(report.company || "report");
  return `optivexiq-${company}-${report.id}.${format}`;
}

function toTextLines(report: ConversionGapReport): string[] {
  const lines: string[] = [];
  lines.push(`OptivexIQ Conversion Gap Report`);
  lines.push(`Report ID: ${report.id}`);
  lines.push(`Company: ${report.company || "Unknown"}`);
  lines.push(`Status: ${report.status}`);
  lines.push(`Created: ${report.createdAt}`);
  lines.push("");
  lines.push(`Executive Summary`);
  lines.push(report.executiveSummary || "No executive summary available.");
  lines.push("");
  lines.push(`Core Scores`);
  lines.push(`- Conversion Score: ${report.conversionScore}/100`);
  lines.push(`- Funnel Risk: ${report.funnelRisk}/100`);
  lines.push(`- Differentiation Score: ${report.differentiationScore}/100`);
  lines.push(`- Pricing Score: ${report.pricingScore}/100`);
  lines.push(`- Clarity Score: ${report.clarityScore}/100`);
  lines.push(`- Confidence Score: ${report.confidenceScore}/100`);
  lines.push("");
  lines.push(`Top Priority Issues`);
  if (report.priorityIssues.length === 0) {
    lines.push("- No priority issues captured.");
  } else {
    for (const issue of report.priorityIssues.slice(0, 10)) {
      lines.push(
        `- ${issue.issue} (tier ${issue.tier}, score ${issue.priorityScore})`,
      );
    }
  }
  lines.push("");
  lines.push(`Messaging Overlap Insight`);
  lines.push(
    report.messagingOverlap.insight || "No overlap insight available.",
  );
  return lines;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildHtmlDocument(report: ConversionGapReport) {
  const lines = toTextLines(report);
  const listItems = lines
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>OptivexIQ Report ${escapeHtml(report.id)}</title>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.5; padding: 24px; color: #111827; }
      h1 { margin: 0 0 16px; font-size: 24px; }
      ul { margin: 0; padding-left: 20px; }
      li { margin-bottom: 6px; }
    </style>
  </head>
  <body>
    <h1>OptivexIQ Conversion Gap Report</h1>
    <ul>${listItems}</ul>
  </body>
</html>`;
}

function escapePdfText(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)")
    .replace(/[^\x20-\x7E]/g, "");
}

function buildSimplePdf(report: ConversionGapReport): Uint8Array {
  const lines = toTextLines(report).slice(0, 45);
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
    `5 0 obj\n<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}endstream\nendobj\n`,
  ];

  let body = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(body, "utf8"));
    body += object;
  }

  const xrefStart = Buffer.byteLength(body, "utf8");
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

  return Buffer.from(body, "utf8");
}

export function buildReportExport(
  report: ConversionGapReport,
  format: ExportFormat,
): ExportPayload {
  if (format === "html") {
    return {
      contentType: "text/html; charset=utf-8",
      filename: buildFilename(report, "html"),
      body: buildHtmlDocument(report),
    };
  }

  if (format === "txt") {
    return {
      contentType: "text/plain; charset=utf-8",
      filename: buildFilename(report, "txt"),
      body: `${toTextLines(report).join("\n")}\n`,
    };
  }

  return {
    contentType: "application/pdf",
    filename: buildFilename(report, "pdf"),
    body: buildSimplePdf(report),
  };
}
