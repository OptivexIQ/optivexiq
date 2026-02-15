# Rate Limiting

OptivexIQ currently uses an in-memory rate limiter in
[middleware/rateLimitGuard.ts](../../middleware/rateLimitGuard.ts).

## Current Behavior

- Per-IP counting
- 60 second window
- 30 requests per minute
- Stored in memory (per server instance)

## Production Note

In-memory rate limiting does not provide cross-instance coordination.
For production deployments, migrate the backing store to a shared
system such as Redis so limits are enforced consistently.
