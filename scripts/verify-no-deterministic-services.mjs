import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

const removedFiles = [
  "features/conversion-gap/services/gapDetectionService.ts",
  "features/objection-engine/services/objectionEngineService.ts",
  "features/differentiation-builder/ai/positioningAnalysisModule.ts",
  "features/positioning-map/prompts/positioningMapModule.ts",
];

const bannedImportTokens = [
  "@/features/conversion-gap/services/gapDetectionService",
  "@/features/objection-engine/services/objectionEngineService",
  "@/features/differentiation-builder/ai/positioningAnalysisModule",
  "@/features/positioning-map/prompts/positioningMapModule",
];

const scanTargets = ["app", "features", "lib", "middleware", "scripts"];
const SELF_PATH = join(root, "scripts", "verify-no-deterministic-services.mjs");

function walkSync(dir, files = []) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === "node_modules" ||
        entry.name === ".next" ||
        entry.name === "dist"
      ) {
        continue;
      }
      walkSync(full, files);
      continue;
    }
    if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

for (const relative of removedFiles) {
  const absolute = join(root, relative);
  if (existsSync(absolute)) {
    failures.push(`Removed deterministic module reintroduced: ${relative}`);
  }
}

const targetFiles = [];
for (const target of scanTargets) {
  const full = join(root, target);
  if (!existsSync(full)) {
    continue;
  }
  walkSync(full, targetFiles);
}

for (const file of targetFiles) {
  if (file === SELF_PATH) {
    continue;
  }
  const content = readFileSync(file, "utf8");
  for (const token of bannedImportTokens) {
    if (content.includes(token)) {
      failures.push(
        `Banned deterministic import detected in ${file.replace(`${root}\\`, "")}: ${token}`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error("Deterministic service boundary verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Deterministic service boundary verification passed.");
