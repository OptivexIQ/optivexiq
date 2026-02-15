export const API_PATHS = {
  generate: "/api/generate",
  reportCreate: "/api/reports/create",
} as const;

export const REPORT_MUTATION_PATHS = new Set<string>([
  API_PATHS.reportCreate,
]);

export type QuotaAction = "generate" | "gapReport";

export function getQuotaActionForPath(pathname: string): QuotaAction | null {
  if (pathname === API_PATHS.generate) {
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
