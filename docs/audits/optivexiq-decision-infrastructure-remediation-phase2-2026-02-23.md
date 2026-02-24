# OptivexIQ Decision Infrastructure Remediation Plan (Phase 2)

Date: 2026-02-23
Scope: Remediation plan with implementation closeout updates
Depends on: `docs/audits/optivexiq-decision-infrastructure-audit-phase1-2026-02-23.md`

## Tier 0 - Production Blockers

### 0.1 Canonical Replay Immutability (No Read-Time Recompute)
- Problem:
  - Read path mutates persisted artifact by recalculating `conversionScore`/`threatLevel`.
- Exact files to modify:
  - `features/reports/services/reportService.ts`
  - `features/reports/services/gapReportReadService.ts`
  - `app/api/reports/[reportId]/export/route.ts`
- Modules/services to create:
  - `features/reports/services/canonicalReportReadService.ts`
- Plan:
  - Return canonical `report_data` fields as-is for read/export.
  - Move derived analytics to non-contract, explicitly derived fields (if needed), never overriding canonical keys.
- Acceptance tests:
  - Same report payload hash across repeated reads/exports.
  - Exported JSON/PDF metadata references unchanged canonical core scores.
  - Regression test proving no `calculateScore(...)` call occurs in canonical read path.

### 0.2 Single Scoring Engine + Versioned Contract
- Problem:
  - Multiple scoring implementations diverge; no persisted scoring model version.
- Exact files to modify:
  - `features/conversion-gap/services/scoringEngine.ts`
  - `features/conversion-gap/services/scoringModelService.ts`
  - `features/conversion-gap/services/reportAggregationScoring.ts`
  - `features/conversion-gap/validators/reportSchema.ts`
  - `features/reports/types/report.types.ts`
  - `features/conversion-gap/services/reportAggregationService.ts`
- Modules/services to create:
  - `features/conversion-gap/services/scoringModelRegistry.ts`
  - `features/conversion-gap/services/scoreReportCanonical.ts`
- Plan:
  - Consolidate to one scoring implementation.
  - Add `scoringModelVersion` + stable `scoringBreakdown` to canonical `report_data`.
  - Freeze version for replay fidelity.
- Acceptance tests:
  - Deterministic score snapshot tests for fixed fixtures.
  - Backward compatibility test for legacy reports lacking version (default migration behavior).
  - Cross-path parity: generation score == read score == export score.

### 0.3 Generate Finalization Reconciliation Wiring
- Problem:
  - Reconciliation queue service exists but is not invoked from failed finalization path.
- Exact files to modify:
  - `features/ai/services/generateStreamService.ts`
  - `features/usage/services/usageFinalizationReconciliationService.ts`
  - `features/usage/services/usageReconciliationCronService.ts`
  - `app/api/cron/usage-reconciliation/route.ts`
- Modules/services to create:
  - None required (wire existing service).
- Plan:
  - On finalization retry exhaustion, enqueue reconciliation record with exact+fallback values.
  - Ensure success path marks reconciliation row resolved (idempotent).
- Acceptance tests:
  - Simulated finalization failure creates reconciliation row.
  - Cron run resolves row and commits reservation.
  - Duplicate enqueue for same reservation key is idempotent.

## Tier 1 - Billing/Trust Risks

### 1.1 Add Canonical JSON Export
- Exact files to modify:
  - `app/api/reports/[reportId]/export/route.ts`
  - `features/reports/services/reportExportService.ts`
- Modules/services to create:
  - `features/reports/services/reportJsonExportService.ts`
- Plan:
  - Support `format=json` for canonical artifact export.
  - Use exact stored `report_data` (no normalization side-effects).
- Acceptance tests:
  - `GET /api/reports/{id}/export?format=json` returns canonical JSON attachment.
  - Validation test ensures JSON export matches read payload byte-for-byte (ignoring envelope fields).

### 1.2 Remove Dead Legacy Report Detail Path
- Exact files to modify:
  - `features/reports/services/reportDetailService.ts`
  - `data/reportDetail.ts`
- Modules/services to create:
  - None required.
- Plan:
  - Remove/retire unused service and mock-shaped data mapper.
  - Replace with canonical service if any hidden dependency exists.
- Acceptance tests:
  - Repo grep test: no runtime import of `data/reportDetail`.
  - Typecheck/build passes without legacy path.

### 1.3 Align Public Messaging to Implemented Capability
- Exact files to modify:
  - `components/Pricing.tsx`
  - `components/Solution.tsx`
  - `docs/architecture.md`
- Modules/services to create:
  - None.
- Plan:
  - Update claims to match shipped export/deployment capability.
  - Update architecture doc section describing worker semantics.
- Acceptance tests:
  - Content review checklist ties each claim to route/service proof.

## Tier 2 - Guard/Data Integrity

### 2.1 Guard Order Enforcement (auth -> rateLimit -> plan/usage)
- Exact files to modify:
  - `middleware/withGuards.ts`
  - `middleware/guardPolicy.ts`
  - `middleware/index.ts`
- Modules/services to create:
  - `middleware/guardExecutionOrder.ts`
- Plan:
  - Reorder guard execution to required invariant.
  - Preserve request-id propagation and denial telemetry.
- Acceptance tests:
  - Integration tests on `/api/generate` and `/api/reports/create` verifying order and denial semantics.

### 2.2 Canonical Section Completeness Hardening
- Exact files to modify:
  - `features/conversion-gap/validators/reportSchema.ts`
  - `features/conversion-gap/services/reportAggregationService.ts`
  - `features/reports/services/reportCreateService.ts`
- Modules/services to create:
  - `features/reports/services/canonicalSectionCompletenessService.ts`
- Plan:
  - Enforce non-empty structured sections for completed reports: diagnosis, overlap, objections, matrix, positioning map, rewrites, revenue impact.
  - Fail completion if canonical payload violates completeness rules.
- Acceptance tests:
  - Negative tests: missing section blocks completion.
  - Positive tests: full payload completes and persists.

### 2.3 Snapshot Unlock/Download Abuse Controls
- Exact files to modify:
  - `app/api/free-snapshot/unlock/route.ts`
  - `app/api/free-snapshot/download/route.ts`
  - `features/free-snapshot/services/freeSnapshotRateLimitService.ts`
- Modules/services to create:
  - `features/free-snapshot/services/freeSnapshotUnlockRateLimitService.ts`
- Plan:
  - Add per-IP and per-email controls on unlock/download paths.
  - Emit explicit 429 + audit logs for throttled attempts.
- Acceptance tests:
  - Repeated unlock/download attempts trigger deterministic 429 thresholds.

## Tier 3 - Architectural Drift

### 3.1 Remove Direct UI fetch Calls
- Exact files to modify:
  - `features/reports/components/ReportExecutionStatusCard.tsx`
  - `features/conversion-gap/components/GapEngineLiveStatusProvider.tsx`
- Modules/services to create:
  - `features/reports/clients/reportExecutionClient.ts`
  - `features/reports/hooks/useReportExecutionPolling.ts`
- Plan:
  - Move API calls into feature client/hook abstraction.
  - Keep UI components presentation-only.
- Acceptance tests:
  - Static check: no raw `fetch(` in `components/**/*.tsx`.
  - Polling behavior unchanged (status transitions still reflected).

### 3.2 Consolidate Report Read Paths
- Exact files to modify:
  - `features/reports/services/reportService.ts`
  - `features/reports/services/gapReportReadService.ts`
  - `app/api/reports/[reportId]/route.ts`
  - `app/api/reports/[reportId]/export/route.ts`
- Modules/services to create:
  - Extend `features/reports/services/canonicalReportReadService.ts`
- Plan:
  - One canonical read source for read and export.
  - Remove duplicate normalization logic.
- Acceptance tests:
  - Contract tests confirm route-level parity for canonical payload.

## Tier 4 - UX Polish

### 4.1 Competitive Matrix Real Rendering
- Exact files to modify:
  - `features/conversion-gap/components/CompetitiveMatrix.tsx`
  - `features/reports/types/report.types.ts` (if matrix typing is currently too loose)
- Modules/services to create:
  - `features/conversion-gap/services/competitiveMatrixViewModelService.ts`
- Plan:
  - Replace static placeholder with structured matrix view.
- Acceptance tests:
  - Snapshot tests for populated and empty matrix states.

### 4.2 Free Snapshot Progress UX
- Exact files to modify:
  - `app/(marketing)` free-snapshot components/pages
  - `features/free-snapshot/*` client-side status usage
- Modules/services to create:
  - `features/free-snapshot/hooks/useFreeSnapshotStatus.ts`
- Plan:
  - Surface deterministic stage progress and terminal statuses.
- Acceptance tests:
  - End-to-end flow from submit -> status polling -> completed/unlock path.

## Execution Order Recommendation
1. Tier 0.1, 0.2, 0.3
2. Tier 1.1, 1.2, 1.3
3. Tier 2.1, 2.2, 2.3
4. Tier 3.1, 3.2
5. Tier 4.1, 4.2

## Exit Criteria for "Decision Infrastructure: Yes"
- Canonical report replay is immutable across read/export.
- Single versioned scoring model is persisted and explainable.
- Paid stream finalization failures are durably reconciled.
- Guard order and architecture invariants are enforced and tested.
- Export artifacts include JSON/HTML/PDF backed by canonical data.
- Messaging/docs reflect implemented system behavior.

---

## Implementation Closeout (Updated 2026-02-23)

### Tier 0.1 Canonical Replay Immutability (No Read-Time Recompute)
- Status: Implemented
- Evidence:
  - `features/reports/services/canonicalReportReadService.ts`
  - `features/reports/services/reportService.ts`
  - `features/reports/services/gapReportReadService.ts`
  - `app/api/reports/[reportId]/export/route.ts`
- Validation:
  - Read paths validate and return canonical persisted `report_data` without score recomputation.
  - Export route consumes canonical read output and uses canonical artifact for JSON export.

### Tier 0.2 Single Scoring Engine + Versioned Contract
- Status: Implemented
- Evidence:
  - `features/conversion-gap/services/scoringModelRegistry.ts`
  - `features/conversion-gap/services/scoringEngine.ts`
  - `features/conversion-gap/services/reportAggregationService.ts`
  - `features/conversion-gap/validators/reportSchema.ts`
  - `features/conversion-gap/types/conversionGapReport.types.ts`
- Validation:
  - Canonical report contract includes `scoringModelVersion` and structured `scoringBreakdown`.
  - Generation path stamps canonical scoring version and model breakdown into persisted report payload.

### Tier 0.3 Generate Finalization Reconciliation Wiring
- Status: Implemented
- Evidence:
  - `features/ai/services/generateStreamService.ts`
  - `features/usage/services/usageFinalizationReconciliationService.ts`
  - `features/usage/services/usageReconciliationCronService.ts`
  - `app/api/cron/usage-reconciliation/route.ts`
- Validation:
  - Generate stream finalization retry exhaustion enqueues reconciliation work.
  - Cron reconciliation service is wired for durable recovery and operational alerting.

### Tier 1.1 Add Canonical JSON Export
- Status: Implemented
- Evidence:
  - `app/api/reports/[reportId]/export/route.ts`
  - `features/reports/services/reportExportService.ts`
  - `features/reports/services/reportJsonExportService.ts`
  - `features/reports/services/canonicalReportReadService.ts`
- Validation:
  - `format=json` returns canonical report JSON as attachment from canonical read service output.

### Tier 1.2 Remove Dead Legacy Report Detail Path
- Status: Implemented
- Evidence:
  - `features/reports/services/reportDetailService.ts` (removed)
  - `data/reportDetail.ts` (removed)
- Validation:
  - No runtime imports remain for legacy detail/mocked report detail modules.

### Tier 1.3 Align Public Messaging to Implemented Capability
- Status: Implemented
- Evidence:
  - `components/Pricing.tsx`
  - `components/Solution.tsx`
  - `docs/architecture.md`
- Validation:
  - Messaging and architecture text now align with shipped artifact/export and execution behavior.

### Tier 3.1 Remove Direct UI fetch Calls
- Status: Implemented
- Evidence:
  - `features/reports/components/ReportExecutionStatusCard.tsx`
  - `features/conversion-gap/components/GapEngineLiveStatusProvider.tsx`
  - `features/reports/clients/reportExecutionClient.ts`
  - `features/reports/hooks/useReportExecutionPolling.ts`
- Validation:
  - UI component polling now runs via feature client/hook abstraction.
  - No direct API `fetch` calls remain in Tier 3 target UI component files.

### Tier 3.2 Consolidate Report Read Paths
- Status: Implemented
- Evidence:
  - `features/reports/services/canonicalReportReadService.ts`
  - `features/reports/services/gapReportReadService.ts`
  - `app/api/reports/[reportId]/route.ts`
  - `app/api/reports/[reportId]/export/route.ts`
- Validation:
  - Shared canonical execution read source now provides status/stage/retention/schema-validated report payload.
  - Export route uses the same canonical execution read source as report execution reads.
  - Duplicate report read/normalization logic was removed from `gapReportReadService`.

### Tier 4.1 Competitive Matrix Real Rendering
- Status: Implemented
- Evidence:
  - `features/conversion-gap/components/CompetitiveMatrix.tsx`
  - `features/conversion-gap/services/competitiveMatrixViewModelService.ts`
  - `features/reports/components/execution/CompetitiveMatrixPreview.tsx`
  - `app/(app)/dashboard/reports/[reportId]/competitive-matrix/page.tsx`
- Validation:
  - Report detail renders matrix preview only.
  - Full matrix is available on dedicated route via explicit CTA.
  - Matrix rendering is driven by structured canonical fields (rows, differentiators, counters, narratives), not static placeholders.

### Tier 4.2 Free Snapshot Progress UX
- Status: Implemented
- Evidence:
  - `features/free-snapshot/hooks/useFreeSnapshotStatus.ts`
  - `features/free-snapshot/components/RunningState.tsx`
  - `features/free-snapshot/components/FreeSnapshotForm.tsx`
- Validation:
  - Progress and stage labels are derived from persisted execution stages.
  - Terminal state is driven by backend status only (`completed`/`failed`), not transient poll errors.
  - Poll failures now surface as retry warnings while preserving running state continuity.

### Tier 2 Note
- Status: No additional code changes required in this pass.
- Guard ordering invariant remains: `auth -> rateLimit -> plan/usage`.

### Final Hardening Pass (Updated 2026-02-23)

#### Tier 1 Follow-up: Remove Export JSON Drift
- Status: Implemented
- Evidence:
  - `features/reports/services/reportExportService.ts`
  - `app/api/reports/[reportId]/export/route.ts`
- Validation:
  - Generic export service now supports `pdf|html|txt` only.
  - Canonical JSON export remains exclusively route-owned and raw-payload based.

#### Tier 2 Follow-up: Guard/Data Integrity Verification Coverage
- Status: Implemented (repo-native verification)
- Evidence:
  - `scripts/verify-decision-infra.mjs`
  - `package.json`
  - `scripts/build-with-contract-check.mjs`
- Validation:
  - Verification script asserts guard order (`auth -> rateLimit -> onboarding -> plan`).
  - Verification script asserts compute entrypoints remain wrapped by `withGuards`.
  - Verification script asserts canonical completeness gating and deterministic incomplete failure token.
  - Verification script asserts no generic JSON export branch in report export service.

#### Tier 3 Follow-up: Explicit Report Diff API
- Status: Implemented
- Evidence:
  - `features/reports/services/reportDiffService.ts`
  - `app/api/reports/[reportId]/diff/route.ts`
- Validation:
  - Authenticated users can compare current run to prior/baseline run with deterministic section deltas.
  - Unauthorized/not-found/conflict states return explicit status semantics.

#### Tier 4 Follow-up: Comparison UX Entrypoints
- Status: Implemented
- Evidence:
  - `app/(app)/dashboard/reports/page.tsx`
  - `features/reports/components/ReportHeader.tsx`
  - `app/(app)/dashboard/reports/[reportId]/compare/page.tsx`
- Validation:
  - Users can launch compare flow from report list and report detail.
  - Dedicated compare page renders delta summary for score, diagnosis, overlap, objection coverage, matrix, and rewrites.
