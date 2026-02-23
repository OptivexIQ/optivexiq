import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const shouldVerify =
  process.env.CI === "true" ||
  process.env.VERCEL === "1" ||
  process.env.REQUIRE_DB_CONTRACT_CHECK === "true";

if (shouldVerify) {
  run(npmCommand, ["run", "verify:db-contract"]);
  run(npmCommand, ["run", "verify:admin-client-usage"]);
  run(npmCommand, ["run", "verify:decision-infra"]);
}

run(process.execPath, ["./node_modules/next/dist/bin/next", "build"]);
