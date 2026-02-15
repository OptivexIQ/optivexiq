# Caching Policy

OptivexIQ uses a small, explicit caching policy for server-side fetch calls.
Use these presets instead of ad-hoc cache options.

## Presets

- User data: `CachePolicy.user`
  - Always fresh: `cache: 'no-store'`
- Dashboard aggregates: `CachePolicy.dashboard`
  - Revalidate every 60 seconds
- Public marketing data: `CachePolicy.public`
  - Revalidate every 300 seconds

## Usage

Import the policy and pass it to server-side fetch calls:

```ts
import { CachePolicy } from "@/lib/constants/cachePolicy";

await httpClient<MyType>("/api/example", {
  ...CachePolicy.user,
  headers: { cookie: cookieHeader },
});
```

If a fetch does not fit these categories, add a new preset instead of
inlining cache options.
