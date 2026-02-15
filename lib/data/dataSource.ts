import { RuntimeConfig } from "@/lib/config/runtime";

export async function resolveData<T>(
  key: string,
  fetcher: () => Promise<T>,
  mockResolver: () => Promise<T> | T
): Promise<T> {
  if (RuntimeConfig.useMockData) {
    return await mockResolver();
  }

  return await fetcher();
}
