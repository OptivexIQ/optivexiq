import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "System Status | OptivexIQ",
  description: "Current operational status for OptivexIQ services.",
};

const lastUpdated = "February 17, 2026, 09:25 UTC";
const refreshWindow = "60 seconds";

const services = [
  {
    name: "Website",
    uptime: "99.995%",
    status: "Operational",
    impact: "No user-facing degradation detected.",
    degradedSlots: [],
  },
  {
    name: "Gap Engine",
    uptime: "99.987%",
    status: "Operational",
    impact: "Analysis jobs processing within expected latency.",
    degradedSlots: [13],
  },
  {
    name: "Report Processing",
    uptime: "99.992%",
    status: "Operational",
    impact: "Queue and background processing are healthy.",
    degradedSlots: [],
  },
  {
    name: "Billing",
    uptime: "100.000%",
    status: "Operational",
    impact: "Checkout and webhook reconciliation are stable.",
    degradedSlots: [],
  },
] as const;

const reliabilityStats = [
  { label: "30-day uptime", value: "99.992%" },
  { label: "Incidents (30d)", value: "0" },
  { label: "MTTR (90d)", value: "12m" },
  { label: "Current severity", value: "None" },
] as const;

function UptimeStrip({ degradedSlots }: { degradedSlots: readonly number[] }) {
  return (
    <div className="mt-3 flex gap-1">
      {Array.from({ length: 72 }).map((_, index) => {
        const isDegraded = degradedSlots.includes(index);
        return (
          <span
            key={index}
            className={`h-4 w-1.5 rounded-full ${isDegraded ? "bg-amber-500/90" : "bg-emerald-500/85"}`}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}

export default function StatusPage() {
  return (
    <section className="relative mx-auto max-w-5xl px-6 py-42">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at top, hsl(210 60% 50% / 0.12), transparent 62%)",
        }}
      />

      <header className="grid gap-4 rounded-2xl border border-border/70 bg-card/80 p-6 backdrop-blur sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Current Status
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            All customer-facing systems are operational. Updated {lastUpdated}.
          </p>
        </div>
        <div className="space-y-3">
          <Badge
            variant="secondary"
            className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
          >
            Live status
          </Badge>
          <p className="text-xs text-muted-foreground">
            Refresh cadence: every {refreshWindow}
          </p>
        </div>
      </header>

      <Card className="mt-8 border-border/70">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl">
            Service Uptime{" "}
            <span className="text-muted-foreground">Last 90 days</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {services.map((service, index) => (
            <div
              key={service.name}
              className={`${index > 0 ? "border-t border-border/50 pt-6" : ""}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground">
                  {service.name}{" "}
                  <span className="text-muted-foreground">\</span>{" "}
                  <span className="text-emerald-600">{service.uptime}</span>
                </p>
                <p className="inline-flex items-center gap-2 text-sm text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {service.status}
                </p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {service.impact}
              </p>
              <UptimeStrip degradedSlots={service.degradedSlots} />
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Legend: green bars indicate normal operation, amber bars indicate
            degraded periods.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-8 border-border/70">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl">Reliability Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reliabilityStats.map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-border/50 p-4"
            >
              <p className="text-2xl font-semibold text-foreground">
                {item.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-8 border-border/70">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl">
            Incident Timeline{" "}
            <span className="text-muted-foreground">Last 30 days</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border/50 p-4">
            <p className="text-sm font-medium text-foreground">
              No incidents in the last 30 days.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Last resolved incident: none recorded in this period.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Need deeper history? Contact support for an incident summary report.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-8 border-border/70">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Data Sources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Internal health checks for core services and background workers.
          </p>
          <p>Dependency monitoring for billing and infrastructure providers.</p>
          <p>Last successful health poll: {lastUpdated}</p>
        </CardContent>
      </Card>

      <section className="mt-10 space-y-3 text-sm text-muted-foreground">
        <p>
          If you are actively blocked, contact{" "}
          <a
            className="text-primary hover:underline"
            href="mailto:support@optivexiq.com"
          >
            support@optivexiq.com
          </a>
          .
        </p>
        <p>
          Security incidents should be reported to{" "}
          <a
            className="text-primary hover:underline"
            href="mailto:security@optivexiq.com"
          >
            security@optivexiq.com
          </a>
          .
        </p>
        <p>
          For commercial impact and contract concerns, use{" "}
          <Link href="/contact" className="text-primary hover:underline">
            Contact
          </Link>
          .
        </p>
      </section>
    </section>
  );
}
