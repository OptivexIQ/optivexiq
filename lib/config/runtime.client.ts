const isProduction = process.env.NODE_ENV === "production";
const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";

if (isProduction && useMockData) {
  throw new Error(
    "FATAL: NEXT_PUBLIC_USE_MOCK_DATA must be 'false' in production.",
  );
}

export const RuntimeClientConfig = {
  useMockData,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};
