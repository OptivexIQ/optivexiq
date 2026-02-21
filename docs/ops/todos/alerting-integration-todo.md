# Alerting Integration TODO (Deferred)

## Goal
Implement early-stage external alerting for Tier 1 operational signals without changing billing behavior.

Recommended stack for current stage:
- Sentry (error tracking + alert rules)
- Slack (primary alert destination)
- Email fallback (critical alerts)

## Scope To Implement Later

1. Wire Sentry alerts for critical backend failures:
- LemonSqueezy webhook failures (`/api/webhooks/lemonsqueezy`)
- Cron worker failures (`/api/cron/report-jobs`, `/api/cron/free-snapshot-jobs`)
- Repeated queue processing failures

2. Create alert rules for DB-backed webhook telemetry:
- Trigger when repeated failures detected in `operational_alerts`
- Source target: `billing.webhook.lemonsqueezy`
- Threshold guidance: 3+ failures in 15 minutes

3. Connect alert destinations:
- Slack private ops channel (primary)
- Email fallback for critical/high alerts

4. Add queue/backlog alert conditions:
- Oldest queued job age > 10 minutes
- No successful report worker completion in rolling window

5. Verify end-to-end alerting:
- Simulate webhook signature failure
- Simulate cron worker failure
- Confirm Slack + email delivery
- Confirm runbook links are included in alert payloads

## Notes
- Keep alerting implementation operational-only.
- Do not modify billing entitlement logic.
- Keep runtime health endpoint admin-only.
