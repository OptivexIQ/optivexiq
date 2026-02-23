# OptivexIQ System Architecture

## Table of Contents

- [1. Executive Overview](#1-executive-overview)
- [2. System Architecture Overview](#2-system-architecture-overview)
- [3. Feature Architecture](#3-feature-architecture)
- [4. End-to-End Data Flow](#4-end-to-end-data-flow)
- [5. Billing & Entitlement Model](#5-billing--entitlement-model)
- [6. Revenue Protection Architecture](#6-revenue-protection-architecture)
- [7. Database Design](#7-database-design)
- [8. Mock Mode Architecture](#8-mock-mode-architecture)
- [9. Background Processing & Durability](#9-background-processing--durability)
- [10. Error Handling & Observability](#10-error-handling--observability)
- [11. Deployment & Migration Model](#11-deployment--migration-model)
- [12. Security Model](#12-security-model)
- [13. Scalability & Performance](#13-scalability--performance)
- [14. System Invariants](#14-system-invariants)
- [15. Operational Release Checklist](#15-operational-release-checklist)

## 1. Executive Overview

OptivexIQ is a SaaS platform for conversion-positioning analysis and AI-assisted rewrite generation. The system ingests a company's web content, compares messaging against competitors, computes structured gap diagnostics, and returns actionable conversion outputs.

Core objectives:

- Detect conversion, differentiation, and objection-handling gaps.
- Produce report-grade outputs and rewrite assets.
- Enforce paid usage and plan entitlements with server-side controls.

Revenue model:

- `starter`: one-time entitlement model.
- `pro` and `growth`: recurring subscription model.
- Compute-heavy capabilities are monetized through quota-gated usage enforcement.

## 2. System Architecture Overview

### Frontend Layer (Next.js App Router)

- Next.js App Router provides dashboard, reports, billing, onboarding, and settings surfaces.
- Frontend triggers server actions or API routes for mutations.
- UI plan/usage state is rendered from backend-derived summaries.

### Backend API Layer

- Route handlers under `app/api/*` expose mutation and query endpoints.
- Guarded routes pass through shared guard orchestration (`withGuards`).
- Route handlers are orchestration-focused: parse, guard, delegate, respond.
- Report execution read model is exposed via `GET /api/reports/[reportId]`.

### Service Layer

- Domain services encapsulate business logic.
- Billing services: checkout policy, checkout session lifecycle, webhook processing.
- Report services: idempotent creation, processing orchestration, status management.
- Usage services: reservation/finalization/rollback, usage summaries.
- AI services: stream lifecycle handling, token/cost estimation.

### Database Layer (Supabase/Postgres)

- PostgreSQL is the source of truth for subscriptions, limits, reports, usage, and checkout attribution.
- SQL functions implement atomic charging and completion semantics.
- Row-level security (RLS) enforces ownership constraints for user-owned data.

### Billing Integration (LemonSqueezy)

- Checkout references are server-issued and persisted before redirect.
- Webhooks validate HMAC signatures.
- Ownership resolution uses server mappings and Lemon identifiers.

### AI Integration

- AI calls are made via internal OpenAI client wrappers.
- Compute paths require quota reservation prior to expensive execution.
- Usage finalization adjusts reservations to actual consumption.

### Background Processing Model

- Report rows are persisted as `queued` before processing.
- Processing transitions report status through `running` to terminal state.
- Retry and stale-claim logic mitigate dropped or interrupted executions.
- Processing uses durable DB-backed job queues (`report_jobs`, `free_snapshot_jobs`) with cron-triggered workers.

## 3. Feature Architecture

### Onboarding System

- User onboarding state is persisted and evaluated before protected report mutations.
- Full report creation requires onboarding completion.

### Conversion Gap Engine

- Scrapes and normalizes target and competitor pages.
- Runs structured AI modules for analysis and rewrite generation.
- Produces report artifacts and usage events.
- Emits durable execution lifecycle state (`execution_stage`, `execution_progress`) to the reports table.

### Report Generation

- Supports full reports and snapshot reports.
- Uses idempotent creation and guarded processing state transitions.

### Streaming Rewrite Generation

- Streaming endpoint reserves usage before stream startup.
- Stream completion finalizes reserved usage to actual usage.
- Stream failures rollback reservations.

### Dashboard Analytics

- Aggregates recent report metrics and usage posture.
- Displays backend-derived entitlement and quota state.

### Usage Tracking

- Tracks token and report usage by billing window.
- Uses reservation-backed mutation paths to prevent race-driven leakage.

### Billing and Subscriptions

- Subscriptions stored with Lemon customer/subscription IDs.
- Lifecycle semantics differ by one-time vs recurring plan type.

### Plan Limits

- Limits resolved from `plan_limits` (DB-backed), not UI constants.
- Enforcement occurs in both app guards and DB mutation functions.

## 4. End-to-End Data Flow

### Primary Lifecycle

1. User signs up.
2. User profile, subscription, settings, and usage baseline are initialized.
3. User completes onboarding.
4. User submits report request.
5. Guards validate auth, rate limits, onboarding, entitlement, and quota.
6. Report is inserted idempotently as `queued`.
7. API returns `202` immediately with report id and queued/running status.
8. Background processor claims report as `running`.
9. Quota/token reservations are acquired atomically.
10. AI compute executes.
11. Report completion and usage mutation are committed.
12. Reservation is finalized to actual usage.
13. Polling endpoints expose live stage/progress updates until terminal status.

Flow diagram:

User -> API Route/Server Action -> Guard Stack -> Report Insert (`queued`) -> `202` Response -> Background Claim (`running`) -> Quota Reservation -> AI Compute -> Usage Finalization -> Report Complete/Fail

### Report Generation Lifecycle

Flow diagram:

User -> Report Mutation Endpoint -> Idempotent Insert/Replay -> `202` (queued/running + report id) -> Claim Running -> Reserve Quota/Tokens -> Compute Modules -> Atomic Completion Write -> Finalize Reservation -> Completed/Failed Status

### Streaming AI Lifecycle

Flow diagram:

User -> `/api/generate` -> Guard Stack -> Token Reservation -> Stream Initialization -> Chunk Streaming -> Usage Finalization -> Response Close

Failure flow:

User -> `/api/generate` -> Reservation -> Stream Failure -> Reservation Rollback -> Error Response

Finalization failure flow:

User -> `/api/generate` -> Stream Complete -> Finalization Retry Exhausted -> Reconciliation Queue -> Cron Reconciliation Commit

### Quota Reservation Flow

1. Acquire usage row lock.
2. Validate entitlement and limit.
3. Write reservation hold (`reserved`).
4. Execute compute.
5. On success: finalize reservation (`committed`) with actuals.
6. On failure: release reservation (`released`) and rollback hold.

Flow diagram:

Request -> Lock Usage Row -> Validate Limits -> Create Reservation Hold -> Compute -> Finalize Commit OR Rollback Release

## 5. Billing & Entitlement Model

### Plan Semantics

- One-time plans (`billing = one_time`): entitlement valid when `status = active`; no period-end requirement.
- Recurring plans (`billing = monthly`): entitlement valid only when `status = active` and `current_period_end > now()`.

### Lifecycle States

- Supported states: `active`, `past_due`, `canceled`, `expired`, `inactive`.
- Lifecycle normalization service resolves entitlement truth for guards and UI.

### `current_period_end` Rules

- Required for recurring entitlement evaluation.
- Not required for one-time entitlement continuity.

### Entitlement Validation Surfaces

- Application layer: `planValidationService`, `planGuard`, `usageGuard`.
- Database layer: entitlement resolver SQL function used by quota mutation routines.

### Webhook Processing Model

1. Verify signature.
2. Parse event.
3. Resolve ownership by `checkout_ref` and/or Lemon identifiers.
4. Upsert subscription state.
5. Log idempotent processing context.

Flow diagram:

LemonSqueezy Webhook -> Signature Verify -> Ownership Resolution -> Subscription Upsert -> Entitlement State Update

## 6. Revenue Protection Architecture

### Guard Stack

- `authGuard`: enforces authenticated context.
- `rateLimitGuard`: throttles abusive traffic.
- `onboardingGuard`: gates protected report mutations.
- `planGuard`: validates entitlement and quotas.
- `usageGuard`: validates active entitlement for usage views.

### Atomic Quota Reservation

- Reservation-first architecture prevents unpaid compute execution.
- Reservation records are keyed and stateful (`reserved`, `committed`, `released`).

### Idempotent Report Creation

- Unique constraint/index on `(user_id, report_type, idempotency_key)`.
- Insert with conflict replay returns existing immutable row.
- Retries must not alter previous report payload or status.

### Concurrency Control

- SQL functions lock usage/report rows during critical transitions.
- Reservation keys and status checks protect against duplicate charging.
- Conditional status updates prevent multi-processor claim conflicts.

### Failure Handling

- Pre-commit failures trigger reservation rollback.
- Critical persistence failures are logged and escalated.
- Terminal report status is persisted explicitly.

### No-Compute-Without-Reservation Invariant

- Heavy AI paths require successful reservation before execution.
- Reservation finalization is mandatory on successful output paths.

## 7. Database Design

### Core Table Summaries

Table: `user_profiles`

- `id` (uuid, PK, references `auth.users.id`)
- `full_name` (text)
- `avatar_url` (text)
- `role` (enum)
- `created_at` (timestamptz)

Table: `saas_profiles`

- `user_id` (uuid, PK, FK)
- Profile and onboarding metadata fields
- `created_at` (timestamptz)

Table: `subscriptions`

- `user_id` (uuid, PK, FK)
- `lemonsqueezy_customer_id` (text, unique partial)
- `lemonsqueezy_subscription_id` (text, unique partial)
- `plan` (text)
- `status` (text)
- `current_period_end` (timestamptz, nullable)
- `created_at` (timestamptz)

Table: `plan_limits`

- `plan` (text, PK)
- `billing` (`one_time` | `monthly`)
- `rewrite_limit` (int, nullable)
- `rewrite_window` (enum)
- `competitor_gap_limit` (int, nullable)
- `competitor_gap_window` (enum)
- `token_limit` (bigint, nullable)
- `token_window` (enum)
- `team_member_limit` (int)
- `created_at` (timestamptz)

Table: `usage_tracking`

- `user_id` (uuid, PK component, FK)
- `billing_period_start` (timestamptz, PK component)
- `billing_period_end` (timestamptz)
- `tokens_used` (int)
- `competitor_gaps_used` (int)
- `rewrites_used` (int)
- `ai_cost_cents` (int)
- `updated_at` (timestamptz)

Table: `conversion_gap_reports`

- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `homepage_url` (text)
- `pricing_url` (text, nullable)
- `competitor_data` (jsonb)
- `gap_analysis` (jsonb)
- `rewrites` (jsonb)
- `snapshot_result` (jsonb, nullable)
- `report_type` (`full` | `snapshot`)
- `status` (`queued` | `running` | `completed` | `failed`)
- `execution_stage` (text, nullable; lifecycle stage marker)
- `execution_progress` (integer 0-100, nullable)
- `started_at` (timestamptz, nullable)
- `completed_at` (timestamptz, nullable)
- `idempotency_key` (text, nullable)
- `quota_charged` (boolean)
- `created_at` (timestamptz)

Table: `usage_reservations`

- `reservation_key` (text, PK)
- `user_id` (uuid, FK)
- `usage_kind` (`generate` | `gap_report` | `snapshot`)
- `report_id` (uuid, nullable FK)
- `reserved_tokens` (int)
- `reserved_cost_cents` (int)
- `reserved_gap_reports` (int)
- `status` (`reserved` | `committed` | `released`)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

Table: `billing_checkout_sessions`

- `id` (uuid, PK)
- `checkout_ref` (text, unique)
- `user_id` (uuid, FK)
- `requested_plan` (text)
- `lemonsqueezy_subscription_id` (text, unique partial)
- `processed_at` (timestamptz, nullable)
- `created_at` (timestamptz)

### Relationships and Constraints

- User-owned tables reference profile/user identity via FK.
- Partial unique indexes enforce Lemon identifier uniqueness.
- Report idempotency unique index enforces replay safety.
- Status and billing window checks constrain state correctness.

### RLS Strategy

- RLS enabled on user-owned tables.
- Policies enforce `auth.uid()` ownership for CRUD where applicable.
- Checkout session policies enforce owner-only row visibility and mutation.

### Security Model in SQL Functions

- Critical quota/billing mutation functions are executed via trusted server role.
- Execute grants for high-impact mutation functions are restricted to `service_role`.

## 8. Mock Mode Architecture

### Runtime Flag

- Client-facing mock mode is driven by `NEXT_PUBLIC_USE_MOCK_DATA` through runtime config.

### Switching Mechanism

- UI data clients use a `resolveData` abstraction for mock/real selection.
- Backend billing, quota, and mutation logic does not branch on mock mode.

### Environment Discipline

- Environment reads are centralized in runtime/env modules.
- UI components do not directly branch on process environment for business-critical flows.

### Invariant

- Backend enforcement paths must remain real-data only.

## 9. Background Processing & Durability

### Report Job Lifecycle

- Report insertion is durable (`queued`) before execution.
- Mutation endpoint returns immediately after queueing (`202`).
- Processor claims `queued` rows to `running` asynchronously.
- Terminal transitions are explicit (`completed` / `failed`).
- Execution stage and percent progress are persisted during each major step.
- If processing is interrupted mid-run, stale-running reclaim logic re-queues eligible work safely.

### Live Progress Read Model

- Gap Engine dashboard polls report execution state every 2.5 seconds via report read endpoint.
- UI uses DB-backed `execution_stage` and `execution_progress`; no timer-based fake progress.
- Gap Engine page remains on the dashboard while running and redirects to report detail only when status becomes `completed`.
- Running progress must not render `100%` before terminal state (`completed` or `failed`).

### Status Transition Rules

- `queued` ? `running`: claim step.
- `running` ? `completed`: atomic completion RPC.
- `running`/`queued` ? `failed`: explicit failure persistence.

### Atomic Writes

- Completion RPCs update usage and report state in one DB transaction context.
- Reservation state changes are persisted on success/failure paths.

### Retry Safety

- Stale-running reclaim logic allows safe retries.
- Reservation and idempotency keys prevent duplicate charges and duplicate report effects.

## 10. Error Handling & Observability

### Logging Strategy

Structured logs cover:

- Guard rejections and quota denials.
- Reservation failures and rollback failures.
- Report claim/completion failures.
- Streaming startup/finalization failures.
- Webhook parse/signature/ownership failures.
- Billing upsert and session resolution failures.

### Failure Escalation

- Critical persistence errors trigger explicit error responses or hard failure handling.
- Failed status transitions are logged with request/user/report identifiers.

### No Silent Catch

- Critical paths prohibit silent swallow of persistence or charging failures.
- Catch blocks must log and either rollback or propagate terminal error state.

## 11. Deployment & Migration Model

### Build Requirements

- TypeScript build gate: `npx tsc --noEmit` must pass.
- Production deployment requires complete env configuration for Supabase, OpenAI, and LemonSqueezy.

### Environment Variable Boundaries

- Secrets remain server-only.
- Public environment variables are non-sensitive and UI-safe.

### Migration Safety Rules

- Use additive or non-destructive schema changes.
- Avoid destructive cascade drops on production paths.
- Reassert RLS and grants where schema or security posture changes.
- Ensure idempotent migrations (`IF NOT EXISTS`, guarded DDL) for repeatability.

### Release Ordering

1. Apply DB migrations in order.
2. Validate function grants and RLS policy state.
3. Deploy app code.
4. Verify webhook endpoint and signing secret.
5. Run smoke tests on checkout, report generation, and streaming compute.

## 12. Security Model

### Trust Boundaries

- Browser/client is untrusted.
- API routes and server actions are trusted orchestration boundaries.
- Database with service role is authoritative for mutation enforcement.
- External webhook payloads are untrusted until signature verification.

### Billing Attribution Integrity

- Checkout attribution uses server-issued `checkout_ref` only.
- Webhook ownership is resolved from server-maintained mappings and provider IDs.
- Client metadata cannot unilaterally assign subscription ownership.

### RLS Enforcement

- User-owned data is restricted by owner predicates.
- Public role access is not used for mutation flows.

### Webhook Verification

- HMAC signature check is mandatory.
- Invalid signatures return unauthorized.
- Unresolvable ownership events are logged and handled deterministically.

## 13. Scalability & Performance

### Rate Limiting

- Request rate limiting protects mutation surfaces from abuse.

### Concurrency Control

- Reservation table and row locks provide cross-request serialization on quota consumption.
- Conditional status claims prevent duplicate processors.

### N+1 and Query Discipline

- Dashboard/report queries are bounded and filtered.
- Batch and aggregation SQL functions are used where required.

### Transaction Discipline

- Critical billing/quota/report writes are encapsulated in SQL functions.
- Read-then-write race windows are closed in reservation and completion routines.

## 14. System Invariants

```text
- No compute without atomic quota reservation.
- No subscription attribution from client input.
- No mock branching in backend enforcement paths.
- One idempotency key = one immutable report replay.
- Reservation key lifecycle is single-commit or single-release.
- RLS enforced on all user-owned tables.
- Critical quota/billing RPC mutations are not executable by untrusted roles.
- One-time starter entitlement does not require current_period_end.
- Recurring entitlement requires active status and future current_period_end.
- No silent catch of critical persistence failures.
- TypeScript build must pass strict compile gate before release.
```

## 15. Operational Release Checklist

### Pre-Deployment

- [ ] All pending migrations applied successfully.
- [ ] RLS policies verified on user-owned and billing attribution tables.
- [ ] RPC execute grants verified for service-role-only mutation functions.
- [ ] LemonSqueezy webhook secret configured and validated.
- [ ] Checkout URLs configured for all enabled plans.
- [ ] OpenAI credentials configured and health-checked.
- [ ] `npx tsc --noEmit` passes.

### Functional Verification

- [ ] Checkout flow creates server-owned checkout session and redirect.
- [ ] Webhook updates subscription via verified ownership path.
- [ ] Full report generation transitions: queued -> running -> completed/failed.
- [ ] `/api/reports/create` returns `202` before compute completes.
- [ ] Gap Engine live progress updates from DB execution fields and redirects only on completion.
- [ ] Snapshot generation reservation/finalization path succeeds.
- [ ] Streaming generation reserves and finalizes usage correctly.
- [ ] Retry with identical idempotency key returns immutable existing report.

### Revenue Integrity Verification

- [ ] Quota-exceeded requests are blocked before compute.
- [ ] Failure paths rollback reservations.
- [ ] No double increment on retries or concurrent requests.
- [ ] Usage, report status, and reservation states remain consistent under load.

### Security Verification

- [ ] Client cannot mutate other users' data through direct RPC.
- [ ] RLS ownership policies enforce `auth.uid()` constraints.
- [ ] No service secrets exposed to client bundles.

### Post-Deployment Monitoring

- [ ] Monitor webhook failure logs and retry patterns.
- [ ] Monitor quota denial and reservation rollback rates.
- [ ] Monitor report processing failure rates and stale-running reclamations.
- [ ] Monitor AI stream finalization and reservation reconciliation errors.
