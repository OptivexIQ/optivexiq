export const API_PATHS = {
  generate: "/api/generate",
  rewriteGenerate: "/api/rewrites/generate",
  reportCreate: "/api/reports/create",
} as const;

export const REPORT_MUTATION_PATHS = new Set<string>([
  API_PATHS.reportCreate,
]);

export type QuotaAction = "generate" | "gapReport";

export function isRewriteExportPath(pathname: string): boolean {
  return /^\/api\/rewrites\/[^/]+\/export$/.test(pathname);
}

export function getQuotaActionForPath(pathname: string): QuotaAction | null {
  if (
    pathname === API_PATHS.generate ||
    pathname === API_PATHS.rewriteGenerate
  ) {
    return "generate";
  }

  if (REPORT_MUTATION_PATHS.has(pathname)) {
    return "gapReport";
  }

  return null;
}

export function requiresOnboardingForPath(pathname: string): boolean {
  return REPORT_MUTATION_PATHS.has(pathname);
}
