export function buildCanonicalReportJson(reportData: unknown): string {
  return `${JSON.stringify(reportData, null, 2)}\n`;
}
