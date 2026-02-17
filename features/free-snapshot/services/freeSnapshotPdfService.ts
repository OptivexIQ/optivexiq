import type { FreeConversionSnapshot } from "@/features/free-snapshot/types/freeSnapshot.types";

function escapePdfText(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)")
    .replace(/[^\x20-\x7E]/g, "");
}

export function buildFreeSnapshotPdf(snapshot: FreeConversionSnapshot): Buffer {
  const lines = [
    "OptivexIQ Free Conversion Audit",
    "",
    "This snapshot was generated using live AI analysis of your website.",
    "",
    "Executive Summary",
    snapshot.executiveSummary,
    "",
    "Top Messaging Gap",
    snapshot.topMessagingGap,
    "",
    "Top Objection Gap",
    snapshot.topObjectionGap,
    "",
    `Clarity Score: ${snapshot.clarityScore}/100`,
    `Positioning Score: ${snapshot.positioningScore}/100`,
    "",
    "Risk Estimate",
    snapshot.riskEstimate,
    "",
    "Quick Wins",
    ...snapshot.quickWins.map((item) => `- ${item}`),
    "",
    "Upgrade CTA",
    "Unlock the full Conversion Gap Report for complete diagnostics and rewrites.",
  ].slice(0, 60);

  const contentLines: string[] = ["BT", "/F1 11 Tf", "50 760 Td"];
  for (let index = 0; index < lines.length; index += 1) {
    if (index > 0) {
      contentLines.push("0 -14 Td");
    }
    contentLines.push(`(${escapePdfText(lines[index])}) Tj`);
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
