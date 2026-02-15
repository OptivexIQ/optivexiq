# Deprecated Migrations (Governance)

These migrations remain in the repo for historical replay integrity, but are superseded by later canonical hardening and should not be treated as the source of truth for runtime contract decisions.

## Superseded by later canonical chain

- `scripts/004_functions_and_rls.sql`
- `scripts/010_usage_increment_functions.sql`
- `scripts/019_tier1_revenue_hardening.sql`
- `scripts/023_tier0_report_completion_atomic.sql`
- `scripts/024_tier1_generate_usage_atomic.sql`
- `scripts/026_tier1_entitlement_alignment.sql`
- `scripts/029_fix_rate_limit_ambiguity.sql`
- `scripts/031_canonical_report_data_persistence.sql`
- `scripts/032_report_data_first_gap_completion.sql`

## Canonical reference and guards

- Snapshot artifact: `scripts/__canonical_migration_snapshot.sql`
- Startup guard migration: `scripts/040_tier3_migration_snapshot_guard.sql`
- Runtime startup check:
  - `features/db/services/dbContractStartupService.ts`
  - `instrumentation.ts`
- CI/ops verifier:
  - `scripts/verify-db-contract.mjs`
