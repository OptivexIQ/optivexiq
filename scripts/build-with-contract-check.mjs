import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: true,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const shouldVerify =
  process.env.CI === "true" ||
  process.env.VERCEL === "1" ||
  process.env.REQUIRE_DB_CONTRACT_CHECK === "true";

if (shouldVerify) {
  run("npm", ["run", "verify:db-contract"]);
  run("npm", ["run", "verify:admin-client-usage"]);
}

run("next", ["build"]);
