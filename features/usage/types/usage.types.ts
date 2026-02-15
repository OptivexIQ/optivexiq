export type UsageRecord = {
  user_id: string;
  billing_period_start: string;
  billing_period_end: string;
  tokens_used: number;
  competitor_gaps_used: number;
  rewrites_used: number;
  ai_cost_cents: number;
  updated_at: string;
};

export type UsageMutationResult = {
  ok: boolean;
  record?: UsageRecord | null;
  error?: string;
};

export type UsageEvent = {
  user_id: string;
  action: string;
  tokens_input: number;
  tokens_output: number;
  tokens_total: number;
  cost_cents: number;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
};
