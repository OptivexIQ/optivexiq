export const CachePolicy = {
  user: { cache: "no-store" as const },
  dashboard: { next: { revalidate: 60 } },
  public: { next: { revalidate: 300 } },
};
