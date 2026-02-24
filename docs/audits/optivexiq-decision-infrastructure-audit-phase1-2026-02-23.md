# OptivexIQ Decision Infrastructure Audit (Phase 1)

Date: 2026-02-23
Scope: Audit only (no code changes)

## 1) Executive Verdict
**Decision Infrastructure: Partial**

OptivexIQ has substantial infrastructure characteristics (durable queueing, canonical `report_data` persistence, guarded paid compute, stage/progress tracking), but it fails strict qualification on replay-stable canonical rendering, scoring model consistency/versioning, architecture invariants (no direct UI `fetch`), and artifact/export completeness (`json` export missing for full reports).

## 2) Evidence Table

| Requirement | Evidence (files/lines) | Status | Risk |
|---|---|---|---|
| A1. Canonical `report_data` persisted in DB | `scripts/031_canonical_report_data_persistence.sql:6`, `scripts/031_canonical_report_data_persistence.sql:152`, `features/reports/services/reportCreateService.ts:964` | Met | Low |
| A2. Re-render/re-export from canonical without recomputation | `features/reports/services/reportService.ts:112`, `features/reports/services/reportService.ts:122`, `app/api/reports/[reportId]/export/route.ts:72` | Partial | Medium: read path mutates score/threat view from stored artifact |
| A3. Structured sections exist in canonical contract | `features/conversion-gap/validators/reportSchema.ts:15`, `features/conversion-gap/validators/reportSchema.ts:28`, `features/conversion-gap/validators/reportSchema.ts:58` | Partial | Medium: schema allows empty objects/records for key sections |
| A4. Report can be read from canonical payload | `features/reports/services/gapReportReadService.ts:133`, `features/reports/services/gapReportReadService.ts:149`, `app/api/reports/[reportId]/route.ts:33` | Met | Low |
| B1. Durable queue for report generation | `features/reports/services/reportJobQueueService.ts:20`, `features/reports/services/reportJobQueueService.ts:143`, `app/api/cron/report-jobs/route.ts:12` | Met | Low |
| B2. Stage/progress persisted + visible | `features/reports/services/reportCreateService.ts:499`, `features/reports/services/reportCreateService.ts:878`, `features/reports/services/gapReportReadService.ts:103` | Met | Low |
| B3. Idempotency prevents duplicates | `features/reports/services/reportCreateService.ts:138`, `features/reports/services/reportCreateService.ts:200`, `scripts/019_tier1_revenue_hardening.sql:33` | Met | Low |
| B4. Clear failure states + retry safety | `features/reports/services/reportCreateService.ts:1024`, `features/reports/services/reportCreateService.ts:621`, `features/reports/services/reportJobQueueService.ts:173` | Met | Low |
| B5. Operational logs/events for disputes | `features/reports/services/reportJobQueueService.ts:206`, `features/reports/services/reportCreateService.ts:988`, `features/ai/services/generateStreamService.ts:391` | Partial | Medium: generate finalization failures alert, but reconciliation enqueue path appears unwired |
| C1. Auth required for paid compute | `app/api/generate/route.ts:6`, `middleware/withGuards.ts:33`, `features/reports/api/reportMutationRouteHandler.ts:8` | Met | Low |
| C2. Subscription + entitlement server-side | `middleware/planGuard.ts:37`, `middleware/planGuard.ts:67`, `features/billing/services/planValidationService.ts:38` | Met | Low |
| C3. Quota/token usage enforced server-side with atomic semantics | `features/usage/services/usageTracker.ts:100`, `features/usage/services/usageTracker.ts:130`, `scripts/025_tier0_usage_reservations_and_checkout_rls.sql` | Met | Low |
| C4. No compute before guard approval | `middleware/withGuards.ts:50`, `app/api/generate/route.ts:6`, `features/reports/api/reportMutationRouteHandler.ts:8` | Met | Low |
| C5. No post-hoc charging that can fail after output delivered | `features/ai/services/generateStreamService.ts:466`, `features/ai/services/generateStreamService.ts:390`, `features/usage/services/usageFinalizationReconciliationService.ts:24` | Partial | High: stream can return output while finalization is unresolved; reconciliation queue function exists but no call-sites found |
| D1. Repeatable runs over time | `features/reports/services/reportCreateService.ts:1070`, `features/reports/services/reportCreateService.ts:1158`, `app/api/reports/create/route.ts:4` | Met | Low |
| D2. Report history browsable | `app/(app)/dashboard/reports/page.tsx`, `features/reports/services/dashboardOverviewService.ts` | Met | Low |
| D3. Comparison/delta support path | Canonical snapshots per run in `conversion_gap_reports` (`scripts/__canonical_migration_snapshot.sql:16`) | Partial | Medium: data exists, no explicit diff API/service |
| D4. Export stable artifacts (PDF/JSON/HTML) | `app/api/reports/[reportId]/export/route.ts:9`, `features/reports/services/reportExportService.ts:3` | Partial | Medium: missing `json` export |
| E1. Real scraping/extraction from URLs | `features/conversion-gap/services/gapEngineService.ts:82`, `features/conversion-gap/services/gapEngineService.ts:879`, `features/conversion-gap/scraping/scraper.ts` | Met | Low |
| E2. LLM synthesis schema-validated at runtime | `features/conversion-gap/services/moduleRuntimeService.ts`, `features/conversion-gap/services/gapEngineService.ts:111`, `features/conversion-gap/services/competitorSynthesisService.ts:124` | Met | Low |
| E3. Deterministic, explainable scoring with weights/versioning | `features/conversion-gap/services/scoringEngine.ts:13`, `features/conversion-gap/services/scoringModelService.ts:5`, `features/reports/services/reportService.ts:11` | Partial | High: multiple scoring models, no persisted scoring model version |
| F1. Status page / monitoring hooks | `app/api/status/route.ts`, `app/(marketing)/status/page.tsx`, `app/api/admin/health/route.ts:22` | Met | Low |
| F2. Dead entrypoints removed | `features/reports/services/reportDetailService.ts:1`, `data/reportDetail.ts:76` | Partial | Medium: legacy detail service still present and mock-shaped |
| F3. Documentation matches behavior | `docs/architecture.md:83`, `features/reports/services/reportJobQueueService.ts:143` | Partial | Medium: doc says no external worker, code has queue worker + cron route |
| F4. No mock leakage in production | `lib/config/runtime.server.ts:6`, `app/api/admin/runtime-health/route.ts:19`, `lib/data/dataSource.ts:8` | Partial | Medium: prod guard exists, but client mock switch still central and needs CI/runtime enforcement proof |
| Invariant: No direct fetch in UI components | `features/reports/components/ReportExecutionStatusCard.tsx:103`, `features/conversion-gap/components/GapEngineLiveStatusProvider.tsx:136` | Failed | Medium: architecture drift from required data-client pattern |
| Invariant: Canonical report contract single source for report read + export | `features/reports/services/gapReportReadService.ts:149`, `features/reports/services/reportService.ts:112` | Partial | Medium: read path recalculates displayed score fields |
| Invariant: Long-running work durable (queue/worker semantics) | `features/reports/services/reportJobQueueService.ts:143`, `features/free-snapshot/services/freeSnapshotJobQueueService.ts:197`, `app/api/cron/free-snapshot-jobs/route.ts:12` | Met | Low |

## 3) Tiered Remediation Plan (Tier 0-4)

### Tier 0 - Production Blockers

1. **Canonical replay must be immutable (no derived overwrite on read/export)**
- Problem: `getGapReport` recalculates and overrides canonical `conversionScore`/`threatLevel`.
- File targets:
  - `features/reports/services/reportService.ts`
  - `features/reports/services/gapReportReadService.ts`
  - `features/conversion-gap/services/reportAggregationService.ts`
- Create modules:
  - `features/conversion-gap/services/scoringVersionService.ts` (single scoring source + version id)
- Acceptance tests:
  - Stored `report_data` replayed through read API returns exact persisted scoring fields.
  - Export uses exact stored canonical payload (no score/threat mutation).

2. **Unify scoring implementation + persist model version**
- Problem: `scoringEngine.ts` and `scoringModelService.ts` diverge in weights/logic.
- File targets:
  - `features/conversion-gap/services/scoringEngine.ts`
  - `features/conversion-gap/services/scoringModelService.ts`
  - `features/conversion-gap/services/reportAggregationScoring.ts`
  - `features/reports/types/report.types.ts`
  - `features/conversion-gap/validators/reportSchema.ts`
- Create modules:
  - `features/conversion-gap/services/scoringModelRegistry.ts`
- Acceptance tests:
  - One deterministic score for same canonical input across generation/read/export paths.
  - `report_data` includes `scoringModelVersion` and `scoringBreakdown`.

3. **Wire generate finalization reconciliation queue (currently orphaned)**
- Problem: `enqueueUsageFinalizationReconciliation` exists but has no call-sites.
- File targets:
  - `features/ai/services/generateStreamService.ts`
  - `features/usage/services/usageFinalizationReconciliationService.ts`
  - `app/api/cron/usage-reconciliation/route.ts`
- Acceptance tests:
  - Simulated finalization failure enqueues reconciliation row.
  - Cron reconciles and marks reservation resolved.

### Tier 1 - Billing/Trust Risks

1. **Add JSON export for reports**
- File targets:
  - `app/api/reports/[reportId]/export/route.ts`
  - `features/reports/services/reportExportService.ts`
- Acceptance tests:
  - `?format=json` returns canonical `report_data` with stable schema and attachment headers.

2. **Remove or replatform stale report detail legacy service**
- File targets:
  - `features/reports/services/reportDetailService.ts`
  - `data/reportDetail.ts`
- Acceptance tests:
  - No production route imports legacy mock-shaped detail module.
  - Build-time check fails if `data/reportDetail.ts` is reintroduced into runtime path.

3. **Correct architecture docs to match actual queue worker semantics**
- File targets:
  - `docs/architecture.md`
- Acceptance tests:
  - Docs explicitly describe cron-triggered durable workers for report/snapshot/reconciliation.

### Tier 2 - Guard/Data Integrity

1. **Enforce required guard ordering (auth -> rateLimit -> plan/usage)**
- Problem: current `withGuards` runs rate limit first.
- File targets:
  - `middleware/withGuards.ts`
  - `middleware/guardPolicy.ts`
- Acceptance tests:
  - Integration test validates guard call order for `/api/generate` and `/api/reports/create`.

2. **Tighten canonical section completeness rules**
- Problem: schema allows empty records for sections that should be structured.
- File targets:
  - `features/conversion-gap/validators/reportSchema.ts`
  - `features/conversion-gap/services/reportAggregationService.ts`
  - `features/reports/services/reportCreateService.ts`
- Acceptance tests:
  - Completed reports fail validation if required decision sections are missing/empty.

3. **Snapshot unlock/download abuse-control hardening**
- Problem: create endpoint rate-limited; unlock/download paths lack equivalent enforcement.
- File targets:
  - `app/api/free-snapshot/unlock/route.ts`
  - `app/api/free-snapshot/download/route.ts`
  - `features/free-snapshot/services/freeSnapshotRateLimitService.ts`
- Acceptance tests:
  - Unlock/download endpoints enforce per-IP and per-email ceilings with explicit 429 responses.

### Tier 3 - Architectural Drift

1. **Remove direct `fetch` from UI components**
- File targets:
  - `features/reports/components/ReportExecutionStatusCard.tsx`
  - `features/conversion-gap/components/GapEngineLiveStatusProvider.tsx`
  - `features/reports/clients/*` (new)
- Create modules:
  - `features/reports/clients/reportExecutionClient.ts`
- Acceptance tests:
  - Lint rule/test forbids raw `fetch` usage in `components/**/*.tsx` (except whitelisted infra files).

2. **Consolidate read models and remove duplicate route/service drift**
- File targets:
  - `features/reports/services/reportService.ts`
  - `features/reports/services/gapReportReadService.ts`
- Acceptance tests:
  - Single canonical read service is used by read + export + detail pages.

### Tier 4 - UX/Presentation Polish

1. **Render real competitive matrix content when data exists**
- File targets:
  - `features/conversion-gap/components/CompetitiveMatrix.tsx`
- Acceptance tests:
  - Snapshot tests for populated matrix and empty-state matrix.

2. **Improve free snapshot lifecycle visibility**
- File targets:
  - `app/(marketing)/*free-snapshot*` pages/components
  - `app/api/free-snapshot/[id]/status/route.ts`
- Acceptance tests:
  - UI maps execution stages to deterministic progress and terminal states.

## 4) Messaging vs Reality Mismatches

1. **Export claims exceed backend capability**
- Claim: `components/Pricing.tsx:126` advertises "Export integration (JSON, HTML, Markdown)".
- Reality: report export supports only `pdf/html/txt` (`app/api/reports/[reportId]/export/route.ts:9`, `features/reports/services/reportExportService.ts:3`).

2. **CMS deployment claim has no implementation path**
- Claim: `components/Solution.tsx:25` says export directly to CMS/landing builder/structured JSON.
- Reality: no CMS integration endpoint/client found; only file export route exists.

3. **Competitive matrix UI implies depth but displays placeholder copy**
- Claim: decision-grade matrix experience implied in product narrative.
- Reality: panel shows static message even with data (`features/conversion-gap/components/CompetitiveMatrix.tsx:23`).

4. **Architecture doc says no queue worker**
- Claim: `docs/architecture.md:83` says "in-process asynchronous execution (no external queue worker)".
- Reality: durable queue tables + cron worker routes for reports/snapshots/reconciliation exist (`features/reports/services/reportJobQueueService.ts:143`, `app/api/cron/report-jobs/route.ts:12`, `app/api/cron/free-snapshot-jobs/route.ts:12`).

## 5) Lifecycle Trace Summary (Phase 1)

### Report lifecycle (`/api/reports/create`)
- Entry: `app/api/reports/create/route.ts:4` -> `features/reports/api/reportMutationRouteHandler.ts:7`
- Guards: `middleware/withGuards.ts:5`
- Queue create + idempotent insert: `features/reports/services/reportCreateService.ts:1115`
- Durable worker claim/process: `features/reports/services/reportJobQueueService.ts:177`
- Canonical persistence + atomic completion: `features/reports/services/reportCreateService.ts:964`
- Read: `app/api/reports/[reportId]/route.ts:14`
- Export: `app/api/reports/[reportId]/export/route.ts:18`

### Rewrite lifecycle (`/api/generate`)
- Entry + guards: `app/api/generate/route.ts:5`, `middleware/withGuards.ts:5`
- Reserve before compute: `features/ai/services/generateStreamService.ts:188`
- Stream output: `features/ai/services/generateStreamService.ts:466`
- Finalize/rollback: `features/ai/services/generateStreamService.ts:380`, `features/ai/services/generateStreamService.ts:298`
- Reconciliation cron exists: `app/api/cron/usage-reconciliation/route.ts:12` (enqueue hook not wired)

### Snapshot lifecycle (`/api/free-snapshot`)
- Public create + rate limit: `app/api/free-snapshot/route.ts:40`
- Durable queue enqueue: `features/free-snapshot/services/freeSnapshotCreateService.ts:44`
- Worker processing + stage persistence: `features/free-snapshot/services/freeSnapshotJobQueueService.ts:130`
- Status endpoint: `app/api/free-snapshot/[id]/status/route.ts:6`
- Unlock/download PDF: `app/api/free-snapshot/unlock/route.ts:25`, `app/api/free-snapshot/download/route.ts:25`

## 6) Post-Remediation Re-Run Checklist

- [ ] Read API and export API return exactly persisted canonical scoring fields (no recompute drift).
- [ ] One scoring model implementation exists with explicit `scoringModelVersion` in canonical payload.
- [ ] `enqueueUsageFinalizationReconciliation` is invoked on generate finalization exhaustion.
- [ ] Report export supports `json` canonical artifact.
- [ ] Guard order is `auth -> rateLimit -> plan/usage` and covered by integration tests.
- [ ] No direct `fetch` calls remain in UI components.
- [ ] Competitive matrix renders structured data, not static placeholder text.
- [ ] Snapshot unlock/download paths have abuse controls equivalent to create path.
- [ ] `docs/architecture.md` accurately describes current queue/worker reality.
- [ ] Marketing pricing/solution export claims align with implemented capabilities.

---
Phase 1 completed (audit only). No code changes performed.
