import type {
  StatusComponent,
  StatusPayload,
  SystemStatusLevel,
} from "@/features/status/types/status.types";
import {
  buildIncidentFromAlert,
  fetchRecentAlerts,
  inferAlertComponent,
  levelFromAlert,
} from "@/features/status/services/statusAlertsService";
import {
  getAnalysisComponent,
  getBillingComponent,
} from "@/features/status/services/statusComponentSignalService";

const REFRESH_SECONDS = 60;

const LEVEL_ORDER: Record<SystemStatusLevel, number> = {
  operational: 0,
  degraded: 1,
  partial_outage: 2,
  major_outage: 3,
};

function nowIso() {
  return new Date().toISOString();
}

function sinceIso(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function worstLevel(levels: SystemStatusLevel[]): SystemStatusLevel {
  return levels.reduce<SystemStatusLevel>((worst, current) =>
    LEVEL_ORDER[current] > LEVEL_ORDER[worst] ? current : worst,
  "operational");
}

function buildOperationalComponents(updatedAt: string) {
  const web: StatusComponent = {
    key: "web",
    name: "Website & Dashboard",
    description: "Public site and authenticated dashboard availability.",
    status: "operational",
    updatedAt,
  };

  const email: StatusComponent = {
    key: "email",
    name: "Email Delivery",
    description: "Snapshot PDF delivery and notification sending.",
    status: "operational",
    updatedAt,
  };

  return { web, email };
}

function overallMessageFor(status: SystemStatusLevel): string {
  if (status === "operational") {
    return "All systems operational.";
  }
  if (status === "degraded") {
    return "Degraded performance in one or more components.";
  }
  if (status === "partial_outage") {
    return "Partial outage affecting one or more components.";
  }
  return "Major outage affecting core services.";
}

export async function getLiveStatusPayload(): Promise<StatusPayload> {
  const updatedAt = nowIso();
  const alerts = await fetchRecentAlerts();

  const [analysis, billing] = await Promise.all([
    getAnalysisComponent(updatedAt),
    getBillingComponent(updatedAt),
  ]);

  let { web, email } = buildOperationalComponents(updatedAt);

  if (alerts === null) {
    web = {
      ...web,
      status: "degraded",
      detail: "Operational signals are temporarily limited.",
    };
    email = {
      ...email,
      status: "degraded",
      detail: "Operational signals are temporarily limited.",
    };
  } else {
    const recentAlertCutoff = sinceIso(60);
    for (const alert of alerts) {
      if (alert.created_at < recentAlertCutoff) {
        continue;
      }

      const componentKey = inferAlertComponent(alert.source);
      const level = levelFromAlert(alert);

      if (componentKey === "web" && LEVEL_ORDER[level] > LEVEL_ORDER[web.status]) {
        web = {
          ...web,
          status: level,
          detail: "Some users may experience temporary service disruption.",
        };
      }

      if (componentKey === "email" && LEVEL_ORDER[level] > LEVEL_ORDER[email.status]) {
        email = {
          ...email,
          status: level,
          detail: "Email delivery may be delayed for some requests.",
        };
      }
    }
  }

  const components = [web, analysis, billing, email];
  const overallStatus = worstLevel(components.map((component) => component.status));

  return {
    overall: {
      status: overallStatus,
      message: overallMessageFor(overallStatus),
      updatedAt,
    },
    components,
    incidents: (alerts ?? []).map(buildIncidentFromAlert),
    meta: {
      refreshSeconds: REFRESH_SECONDS,
      dataSourceNote: "Derived from internal health checks and operational monitoring.",
      support: {
        contactUrl: "/contact",
        email: "support@optivexiq.com",
        securityEmail: "security@optivexiq.com",
      },
    },
  };
}
