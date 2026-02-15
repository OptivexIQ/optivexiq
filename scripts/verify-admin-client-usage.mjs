import { readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8", shell: true });
  if (result.status !== 0) {
    return [];
  }
  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

const tsFiles = run("rg", [
  "--files",
  "app",
  "features",
  "services",
  "-g",
  "*.ts",
  "-g",
  "*.tsx",
]);

const violations = [];
const allowedContexts = new Set(["webhook", "worker", "cron", "usage_rpc"]);

for (const file of tsFiles) {
  const content = readFileSync(join(process.cwd(), file), "utf8");
  const lines = content.split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (!line.includes("createSupabaseAdminClient(")) {
      return;
    }

    const match = line.match(/createSupabaseAdminClient\("([a-z_]+)"\)/);
    if (!match) {
      violations.push(
        `${file}:${idx + 1} missing explicit trusted context argument for createSupabaseAdminClient`,
      );
      return;
    }

    const context = match[1];
    if (!allowedContexts.has(context)) {
      violations.push(
        `${file}:${idx + 1} invalid admin context "${context}"`,
      );
    }

    if (file.startsWith("app/api/") && !file.includes("/webhooks/") && !file.includes("/cron/")) {
      violations.push(
        `${file}:${idx + 1} admin client usage is restricted to webhook/cron routes`,
      );
    }
  });
}

if (violations.length > 0) {
  console.error("Admin client usage verification failed:");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log("Admin client usage verification passed.");
