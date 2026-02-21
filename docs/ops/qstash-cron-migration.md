# QStash Cron Migration

This project uses cron-protected API routes under `/api/cron/*`.
Vercel Hobby cannot run sub-daily Vercel cron jobs, so schedules are managed by Upstash QStash instead.

## Required Environment Variables

- `QSTASH_TOKEN`: QStash API token with schedule management access.
- `CRON_SECRET`: Existing cron auth secret already required by this app.
- `QSTASH_TARGET_BASE_URL` (recommended): Full base URL for target deployment, e.g. `https://your-domain.com`.
  - Fallbacks used by script: `NEXT_PUBLIC_SITE_URL`, then `VERCEL_PROJECT_PRODUCTION_URL`.

## Sync Schedules

Run:

```bash
npm run qstash:sync-schedules
```

This upserts the following schedules:

- `* * * * *` -> `/api/cron/report-jobs`
- `* * * * *` -> `/api/cron/free-snapshot-jobs`
- `*/30 * * * *` -> `/api/cron/usage-reconciliation`
- `0 14 * * 1` -> `/api/cron/weekly-summary`

The script forwards `x-cron-secret` to keep current endpoint authorization behavior unchanged.

## Deployment Notes

- `vercel.json` cron config is intentionally empty to avoid Hobby deployment failures.
- QStash is now the scheduler of record for cron routes.
