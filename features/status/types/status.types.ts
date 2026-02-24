export type SystemStatusLevel =
  | "operational"
  | "degraded"
  | "partial_outage"
  | "major_outage";

export type ComponentKey = "web" | "analysis" | "billing" | "email";

export type StatusComponent = {
  key: ComponentKey;
  name: string;
  description: string;
  status: SystemStatusLevel;
  updatedAt: string;
  detail?: string;
};

export type StatusIncident = {
  id: string;
  title: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  startedAt: string;
  resolvedAt?: string;
  customerImpact: string;
  updates: Array<{ at: string; message: string }>;
};

export type StatusPayload = {
  overall: {
    status: SystemStatusLevel;
    message: string;
    updatedAt: string;
  };
  components: StatusComponent[];
  incidents: StatusIncident[];
  meta: {
    refreshSeconds: number;
    dataSourceNote: string;
    signalDegraded?: boolean;
    support: {
      contactUrl: string;
      email: string;
      securityEmail: string;
    };
  };
};

// Safe public-status rules:
// - Use customer-facing component labels only.
// - Do not include provider/vendor names unless intentionally disclosed.
// - Do not expose internal identifiers, endpoints, or infrastructure details.
