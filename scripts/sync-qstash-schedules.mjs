import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const schedules = [
  {
    id: "optivexiq-report-jobs",
    path: "/api/cron/report-jobs",
    cron: "* * * * *",
  },
  {
    id: "optivexiq-free-snapshot-jobs",
    path: "/api/cron/free-snapshot-jobs",
    cron: "* * * * *",
  },
  {
    id: "optivexiq-usage-reconciliation",
    path: "/api/cron/usage-reconciliation",
    cron: "*/30 * * * *",
  },
  {
    id: "optivexiq-weekly-summary",
    path: "/api/cron/weekly-summary",
    cron: "0 14 * * 1",
  },
];

function requireEnv(name, aliases = []) {
  const keys = [name, ...aliases];
  const value = keys.map((key) => process.env[key]).find((candidate) =>
    Boolean(candidate),
  );
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}${
        aliases.length > 0 ? ` (or ${aliases.join(", ")})` : ""
      }`,
    );
  }
  return value;
}

function parseBool(value) {
  return typeof value === "string" && value.toLowerCase() === "true";
}

function resolveSiteUrl() {
  const baseUrl = requireEnv("QSTASH_TARGET_BASE_URL");

  const normalized = baseUrl.trim().replace(/^['"]|['"]$/g, "");
  const withScheme =
    normalized.startsWith("http://") || normalized.startsWith("https://")
      ? normalized
      : `https://${normalized}`;

  try {
    const parsed = new URL(withScheme);
    return parsed.origin;
  } catch {
    throw new Error(
      `Invalid site URL: ${baseUrl}. Set QSTASH_TARGET_BASE_URL to a full URL like https://your-domain.com`,
    );
  }
}

function assertSafeTargetHost(baseUrl) {
  const host = new URL(baseUrl).hostname.toLowerCase();
  const isLocalHost =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.endsWith(".local");

  if (isLocalHost && !parseBool(process.env.QSTASH_ALLOW_LOCAL_TARGET)) {
    throw new Error(
      "Refusing localhost/.local target. Set QSTASH_ALLOW_LOCAL_TARGET=true only for local testing.",
    );
  }

  const allowedHosts = (process.env.QSTASH_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (allowedHosts.length > 0 && !allowedHosts.includes(host)) {
    throw new Error(
      `Target host '${host}' is not in QSTASH_ALLOWED_HOSTS: ${allowedHosts.join(", ")}`,
    );
  }
}

async function upsertSchedule({ token, baseUrl, cronSecret, schedule }) {
  const destination = `${baseUrl}${schedule.path}`;
  const endpoint = `https://qstash.upstash.io/v2/schedules/${destination}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Upstash-Cron": schedule.cron,
      "Upstash-Method": "GET",
      "Upstash-Schedule-Id": schedule.id,
      "Upstash-Forward-x-cron-secret": cronSecret,
    },
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Failed to sync ${schedule.id} (${response.status}): ${details}`,
    );
  }

  const payload = await response.json();
  return payload.scheduleId ?? schedule.id;
}

async function listSchedules(token) {
  const response = await fetch("https://qstash.upstash.io/v2/schedules", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Failed to list schedules during verification (${response.status}): ${details}`,
    );
  }
  const payload = await response.json();
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === "object" && Array.isArray(payload.schedules)) {
    return payload.schedules;
  }
  return [];
}

function verifySchedule({ schedule, baseUrl, schedules }) {
  const destination = `${baseUrl}${schedule.path}`;
  const expectedHost = new URL(baseUrl).host;
  const match = schedules.find((item) => {
    const blob = JSON.stringify(item);
    return blob.includes(destination) && blob.includes(schedule.cron);
  });
  if (!match) {
    throw new Error(
      `Verification failed for ${schedule.id}: destination '${destination}' with cron '${schedule.cron}' not found.`,
    );
  }
  const blob = JSON.stringify(match);
  if (!blob.includes(expectedHost)) {
    throw new Error(
      `Verification failed for ${schedule.id}: matched entry does not include expected host '${expectedHost}'.`,
    );
  }
}

async function main() {
  const token = requireEnv("QSTASH_TOKEN", ["UPSTASH_QSTASH_TOKEN"]);
  const cronSecret = requireEnv("CRON_SECRET");
  const baseUrl = resolveSiteUrl();
  assertSafeTargetHost(baseUrl);

  for (const schedule of schedules) {
    const scheduleId = await upsertSchedule({
      token,
      baseUrl,
      cronSecret,
      schedule,
    });
    console.log(
      `Synced ${schedule.id} (${schedule.cron}) -> ${schedule.path} [${scheduleId}]`,
    );
  }

  const existingSchedules = await listSchedules(token);
  for (const schedule of schedules) {
    verifySchedule({ schedule, baseUrl, schedules: existingSchedules });
    console.log(`Verified ${schedule.id} host and destination.`);
  }
}

main().catch((error) => {
  console.error("QStash schedule sync failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
