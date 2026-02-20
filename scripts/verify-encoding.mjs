import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const ROOT = process.cwd();
const ALLOWED_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".css",
  ".md",
  ".sql",
]);
const IGNORE_DIRS = new Set([
  ".git",
  ".next",
  "node_modules",
  ".venv",
  "public",
  "coverage",
]);

const suspiciousTokens = [
  "\uFFFD",
  "\u00e2\u20ac\u00a2",
  "\u00ef\u00bf\u00bd",
  "\u00c3",
];
const scanRoots = [
  "app",
  "components",
  "features",
  "lib",
  "services",
  "hooks",
  "providers",
  "types",
  "data",
  "scripts",
  "docs",
  "middleware",
];

const findings = [];

function walk(dirPath) {
  let entries = [];
  try {
    entries = readdirSync(dirPath);
  } catch {
    return;
  }

  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry)) continue;

    const fullPath = join(dirPath, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (!ALLOWED_EXTENSIONS.has(extname(fullPath))) continue;

    const content = readFileSync(fullPath, "utf8");
    for (const token of suspiciousTokens) {
      const idx = content.indexOf(token);
      if (idx === -1) continue;

      findings.push({
        path: fullPath.replace(`${ROOT}\\`, "").replace(/\\/g, "/"),
        token,
      });
    }
  }
}

for (const root of scanRoots) {
  walk(join(ROOT, root));
}

if (findings.length > 0) {
  console.error("Encoding check failed. Suspicious text tokens found:");
  for (const finding of findings) {
    console.error(`- ${finding.path} (token: ${finding.token})`);
  }
  process.exit(1);
}

console.log("Encoding check passed.");
