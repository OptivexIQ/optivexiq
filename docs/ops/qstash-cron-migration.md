# QStash Cron Migration

This project uses cron-protected API routes under `/api/cron/*`.
Vercel Hobby cannot run sub-daily Vercel cron jobs, so schedules are managed by Upstash QStash instead.

## Required Environment Variables

- `QSTASH_TOKEN`: QStash API token with schedule management access.
- `CRON_SECRET`: Existing cron auth secret already required by this app.
- `QSTASH_TARGET_BASE_URL` (required): Full base URL for target deployment, e.g. `https://your-domain.com`.

## Optional Safety Controls

- `QSTASH_ALLOWED_HOSTS`: Comma-separated host allowlist for schedule target protection.
  - Example: `app.example.com,www.example.com`
- `QSTASH_ALLOW_LOCAL_TARGET=true`: Allow localhost/.local targets for local testing only.

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
The script also verifies each schedule after upsert and fails if destination host does not match target.

## Deployment Notes

- `vercel.json` cron config is intentionally empty to avoid Hobby deployment failures.
- QStash is now the scheduler of record for cron routes.
