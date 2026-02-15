export type FreeAuditRiskLevel = "Low" | "Medium" | "High";

export type FreeAuditRequest = {
  homepage_url: string;
  pricing_url?: string | null;
  competitor_urls?: string[] | null;
};

export type FreeAuditResult = {
  risk_level: FreeAuditRiskLevel;
  insights: string[];
  revenue_impact: {
    pipeline_at_risk: number;
    estimated_recovery: number;
    note: string;
  };
  upgrade_cta: string;
};
