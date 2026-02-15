# Idempotency

## Report creation

`POST /api/reports/create` accepts an `Idempotency-Key` header.

- The key is stored on the report row in `conversion_gap_reports.competitor_data.idempotency_key`.
- If a matching report exists for the same user, the API returns the existing `reportId` and current `status`.
- If the key is missing, a short dedupe window is applied based on recent matching inputs.
- For higher throughput, add the index in scripts/011_idempotency_key_index.sql to speed up lookups.

## Client guidance

- Generate a UUID per user action and reuse it on retries.
- If the response indicates the report already exists, redirect to the report view rather than creating another request.
