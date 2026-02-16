export interface FreeConversionSnapshot {
  executiveSummary: string;
  topMessagingGap: string;
  topObjectionGap: string;
  clarityScore: number;
  positioningScore: number;
  riskEstimate: string;
  quickWins: string[];
}

export type FreeSnapshotExecutionStage =
  | "fetching_homepage_content"
  | "extracting_positioning_signals"
  | "analyzing_competitor_structure"
  | "generating_executive_diagnosis"
  | "scoring_conversion_gaps"
  | "finalizing_snapshot";

export type FreeSnapshotStatus =
  | "queued"
  | "scraping"
  | "analyzing"
  | "generating"
  | "completed"
  | "failed";

export type FreeSnapshotRow = {
  id: string;
  email: string | null;
  website_url: string;
  competitor_urls: unknown;
  analysis_context: string | null;
  snapshot_data: unknown;
  status: FreeSnapshotStatus;
  execution_stage: FreeSnapshotExecutionStage | null;
  created_at: string;
  updated_at: string;
  ip_address: string | null;
  user_agent: string | null;
  error_message: string | null;
  unlocked_at: string | null;
  conversion_from_snapshot: boolean;
  snapshot_user_id: string | null;
};
