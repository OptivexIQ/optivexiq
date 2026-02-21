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

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
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

  if (baseUrl.startsWith("http://") || baseUrl.startsWith("https://")) {
    return baseUrl.replace(/\/+$/, "");
  }

  return `https://${baseUrl.replace(/\/+$/, "")}`;
}

async function upsertSchedule({ token, baseUrl, cronSecret, schedule }) {
  const destination = `${baseUrl}${schedule.path}`;
  const encodedDestination = encodeURIComponent(destination);
  const endpoint = `https://qstash.upstash.io/v2/schedules/${encodedDestination}`;

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
  const token = requireEnv("QSTASH_TOKEN");
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
