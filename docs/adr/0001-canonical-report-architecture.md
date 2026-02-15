# ADR 0001: Canonical Report Architecture

## Status

Accepted

## Context

OptivexIQ requires a production-safe report generation architecture with strict control over mutation surfaces, billing integrity, and schema consistency.

Current architectural constraints:

- A single public mutation surface must exist for Conversion Gap Report creation.
- Engine execution must be internalized and not exposed as a public route.
- Guard sequence must be enforced before mutation and compute.
- Revenue protection must prevent compute without entitlement and quota reservation.
- UI must consume a canonical report contract, not fragmented module payloads.

Operational context:

- Public report creation is routed through `/api/reports/create`.
- Guard stack enforces auth, rate limit, plan, and usage controls before processing.
- Report execution is service-driven and persists canonical `report_data`.
- Usage reservation and completion are enforced atomically via database functions.

## Decision

OptivexIQ adopts the following architecture decisions:

1. Canonical mutation surface

- `/api/reports/create` is the only public mutation endpoint for Conversion Gap Report creation.
- No duplicate public mutation entrypoints are allowed for the same business action.

2. Service-only engine execution

- Gap engine execution is internal to services.
- Engine services are pure compute/orchestration for analysis and must not own billing, guard, or persistence policy decisions.

3. Billing and quota before compute

- Entitlement, quota reservation, and mutation guards must pass before expensive compute.
- Usage is committed only after successful completion; failures must not produce irreversible charge drift.

4. Canonical report schema contract

- `report_data` is the canonical report payload.
- Report readers and UI layers consume validated canonical schema output.
- Raw module outputs are intermediate inputs to canonical aggregation, not UI contracts.

5. Queue-first mutation response

- Report creation returns `202` after durable queue insert/idempotent replay.
- Heavy processing executes asynchronously after response.
- Read endpoints are the source of truth for in-flight execution state.

6. Durable execution progress contract

- Execution lifecycle is persisted in DB (`execution_stage`, `execution_progress`, `started_at`, `completed_at`).
- UI progress must be driven by DB read polling, not timers or inferred client state.

## Consequences

Expected outcomes of this decision:

1. No duplicate entrypoints

- Reduced policy drift risk across routes.
- Centralized enforcement and observability at one mutation surface.

2. No billing logic in engine layer

- Clear separation of concerns between compute and monetization controls.
- Lower risk of accidental revenue leakage through compute-only pathways.

3. No `resolveData` in server services

- Server-side logic always uses real backend paths.
- Mock mode remains a frontend/data-source concern, not a server mutation concern.

4. Stronger contract discipline

- Canonical `report_data` validation becomes a release gate for report readability.
- Failures are explicit and observable instead of silently reconstructed from partial data.

## Future Extension Rules

All future architecture changes must follow these rules:

1. Canonical schema mapping required

- New analysis modules must map outputs into the canonical report schema before persistence.
- Module payloads may not be exposed directly to report UIs.

2. No direct UI consumption of raw module outputs

- UI components must read canonical report fields only.
- Any new section must be represented in canonical types and runtime validation schema.

3. Structured scoring only

- Scoring logic must derive from structured canonical report fields.
- No ad hoc scoring from fragmented DB fields or unvalidated intermediate outputs.

4. No route surface expansion for existing mutation intent

- New report-generation behavior must extend services behind `/api/reports/create`.
- Do not reintroduce `/api/gap-engine/run` or equivalent public duplicates.

5. Guard and revenue invariants are non-negotiable

- No compute before guard approval and quota reservation.
- No usage commit before completion persistence.
- No silent fallback that masks validation or persistence failures.

6. Async processing UX contract

- Gap Engine start action remains on the engine page during execution.
- Redirect to report detail occurs only when status transitions to `completed`.
