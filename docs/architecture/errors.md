# API Error Contracts

## Response shape

All API routes that return errors respond with a structured payload:

```json
{
  "error": {
    "code": "invalid_payload",
    "message": "Invalid payload.",
    "requestId": "uuid",
    "details": {
      "field": "reason"
    }
  }
}
```

- `error.code`: machine-readable error code.
- `error.message`: human-readable summary.
- `error.requestId`: correlates logs with the request.
- `error.details`: optional object for extra context.

## Headers

- `x-request-id` is returned on all successful and error responses from API routes that use the shared error contract.

## Client handling

- `httpClient` and `streamClient` extract `error.message` and `error.code` when present.
- UI surfaces user-friendly messaging, while logging `requestId` for support.
