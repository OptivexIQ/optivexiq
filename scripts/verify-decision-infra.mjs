import { readFileSync } from "node:fs";
import { join } from "node:path";

function read(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const failures = [];

function assertIncludes(content, token, message) {
  if (!content.includes(token)) {
    failures.push(message);
  }
}

function assertGuardOrder() {
  const content = read("middleware/withGuards.ts");
  const authIndex = content.indexOf("authGuard(request)");
  const rateIndex = content.indexOf("rateLimitGuard(");
  const onboardingIndex = content.indexOf("onboardingGuard(");
  const planIndex = content.indexOf("planGuard(");
  if (
    authIndex === -1 ||
    rateIndex === -1 ||
    onboardingIndex === -1 ||
    planIndex === -1
  ) {
    failures.push("Unable to verify full guard chain in middleware/withGuards.ts");
    return;
  }

  if (!(authIndex < rateIndex && rateIndex < onboardingIndex && onboardingIndex < planIndex)) {
    failures.push("Guard order drift detected: expected auth -> rateLimit -> onboarding -> plan");
  }
}

function assertComputeGuarded() {
  const generateRoute = read("app/api/generate/route.ts");
  assertIncludes(
    generateRoute,
    "return withGuards(request",
    "app/api/generate/route.ts must wrap compute with withGuards",
  );
  assertIncludes(
    generateRoute,
    "handleGenerateStream(",
    "app/api/generate/route.ts must call generate handler inside withGuards",
  );

  const reportMutationRoute = read("features/reports/api/reportMutationRouteHandler.ts");
  assertIncludes(
    reportMutationRoute,
    "return withGuards(request",
    "report mutation handler must wrap compute with withGuards",
  );
  assertIncludes(
    reportMutationRoute,
    "submitReportMutation(",
    "report mutation handler must call submitReportMutation inside guard wrapper",
  );
}

function assertCanonicalCompletenessGating() {
  const completeness = read("features/reports/services/canonicalSectionCompletenessService.ts");
  assertIncludes(
    completeness,
    "missing_diagnosis_section",
    "canonical completeness must reject missing diagnosis section",
  );
  assertIncludes(
    completeness,
    "missing_competitive_matrix_section",
    "canonical completeness must reject missing competitive matrix",
  );

  const createService = read("features/reports/services/reportCreateService.ts");
  assertIncludes(
    createService,
    "assertCanonicalSectionCompleteness(canonicalReport)",
    "reportCreateService must run canonical completeness check before completion",
  );
  assertIncludes(
    createService,
    "incomplete_canonical_report_data",
    "reportCreateService must fail deterministically on canonical incompleteness",
  );
}

function assertJsonExportSourceOfTruth() {
  const exportService = read("features/reports/services/reportExportService.ts");
  if (exportService.includes('format === "json"')) {
    failures.push("reportExportService must not include JSON export branch");
  }
  const exportRoute = read("app/api/reports/[reportId]/export/route.ts");
  assertIncludes(
    exportRoute,
    'if (format === "json")',
    "report export route must own canonical JSON export behavior",
  );
}

assertGuardOrder();
assertComputeGuarded();
assertCanonicalCompletenessGating();
assertJsonExportSourceOfTruth();

if (failures.length > 0) {
  console.error("Decision infrastructure verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Decision infrastructure verification passed.");
