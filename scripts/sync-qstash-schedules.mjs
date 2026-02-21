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

function resolveSiteUrl() {
  const baseUrl =
    process.env.QSTASH_TARGET_BASE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL;

  if (!baseUrl) {
    throw new Error(
      "Missing site URL. Set QSTASH_TARGET_BASE_URL or NEXT_PUBLIC_SITE_URL.",
    );
  }

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

async function main() {
  const token = requireEnv("QSTASH_TOKEN", ["UPSTASH_QSTASH_TOKEN"]);
  const cronSecret = requireEnv("CRON_SECRET");
  const baseUrl = resolveSiteUrl();

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
}

main().catch((error) => {
  console.error("QStash schedule sync failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
