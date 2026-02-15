# Observability

## Streaming requests

`POST /api/generate` logs the following:

- Start: request ID, user ID, model.
- End: request ID, duration, token usage, cost.
- Errors: request ID and exception details.

## Correlation

- Every response includes `x-request-id`.
- Clients should include the request ID in support tickets or error reports.
