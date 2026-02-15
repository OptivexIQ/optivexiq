import { RuntimeClientConfig } from "@/lib/config/runtime.client";

export async function resolveData<T>(
  key: string,
  fetcher: () => Promise<T>,
  mockResolver: () => Promise<T> | T
): Promise<T> {
  if (RuntimeClientConfig.useMockData) {
    return await mockResolver();
  }

  return await fetcher();
}
