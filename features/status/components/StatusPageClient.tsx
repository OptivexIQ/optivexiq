"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getStatus } from "@/features/status/clients/statusClient";
import type { StatusPayload } from "@/features/status/types/status.types";
import {
  formatStatusTime,
  latestIncidentUpdate,
  statusBadgeTone,
  statusDotTone,
  toStatusLabel,
} from "@/features/status/components/statusViewUtils";

export default function StatusPageClient() {
  const [payload, setPayload] = useState<StatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadStatus() {
    setIsRefreshing(true);
    try {
      const next = await getStatus();
      setPayload(next);
      setError(null);
    } catch {
      setError("Unable to load status. Please refresh.");
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStatus();
    const timer = setInterval(() => {
      void loadStatus();
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="space-y-4">
          <div className="h-8 w-64 animate-pulse rounded bg-muted" />
          <div className="h-5 w-96 animate-pulse rounded bg-muted" />
        </div>
        <div className="mt-8 h-32 animate-pulse rounded-2xl bg-muted" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.8fr_1fr]">
          <div className="h-80 animate-pulse rounded-2xl bg-muted" />
          <div className="h-80 animate-pulse rounded-2xl bg-muted" />
        </div>
      </section>
    );
  }

  if (error || !payload) {
    return (
      <section className="mx-auto max-w-6xl px-6 py-16">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-xl">System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Unable to load status. Please refresh.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="relative mx-auto max-w-6xl px-6 py-42">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at top, hsl(210 60% 50% / 0.12), transparent 62%)",
        }}
      />

      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Public status
        </p>
        <h1 className="text-3xl font-semibold text-foreground">
          System Status
        </h1>
        <p className="text-sm text-muted-foreground">
          Current service availability and recent customer-impacting updates.
        </p>
      </header>

      <Card className="mt-8 border-border/70 bg-linear-to-r from-background to-muted/30">
        <CardContent className="flex flex-wrap items-start justify-between gap-5 py-6">
          <div className="flex items-start gap-4">
            <span
              className={`mt-1 inline-block h-3 w-3 rounded-full ${statusDotTone(payload.overall.status)} ${isRefreshing ? "animate-pulse" : ""}`}
              aria-label={
                isRefreshing ? "Refreshing live status" : "Live status current"
              }
            />
            <div className="space-y-1">
              <p className="text-xl font-semibold text-foreground">
                {toStatusLabel(payload.overall.status)}
              </p>
              <p className="text-sm text-muted-foreground">
                {payload.overall.message}
              </p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Last updated: {formatStatusTime(payload.overall.updatedAt)}</p>
            <p>Refresh cadence: every {payload.meta.refreshSeconds} seconds</p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.8fr_1fr]">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-lg">Live Component Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {payload.components.map((component, index) => (
              <div key={component.key} className="space-y-2">
                {index > 0 ? <Separator /> : null}
                <div className="flex items-start justify-between gap-3 pt-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {component.name}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {component.description}
                    </p>
                  </div>
                  <Badge className={statusBadgeTone(component.status)}>
                    {toStatusLabel(component.status)}
                  </Badge>
                </div>
                {component.detail ? (
                  <p className="text-sm text-muted-foreground">
                    {component.detail}
                  </p>
                ) : null}
                <p className="text-sm text-muted-foreground">
                  Updated: {formatStatusTime(component.updatedAt)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="text-lg">Reliability Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Reliability metrics will be published as we expand monitoring.
              </p>
              <p>{payload.meta.dataSourceNote}</p>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="text-lg">Support & Escalation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Support:{" "}
                <a
                  href={`mailto:${payload.meta.support.email}`}
                  className="text-primary underline underline-offset-4"
                >
                  {payload.meta.support.email}
                </a>
              </p>
              <p>
                Security:{" "}
                <a
                  href={`mailto:${payload.meta.support.securityEmail}`}
                  className="text-primary underline underline-offset-4"
                >
                  {payload.meta.support.securityEmail}
                </a>
              </p>
              <p>
                Contact:{" "}
                <Link
                  href={payload.meta.support.contactUrl}
                  className="text-primary underline underline-offset-4"
                >
                  Contact support
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-6 border-border/70">
        <CardHeader>
          <CardTitle className="text-lg">
            Recent Incidents (Last 30 days)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {payload.incidents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No incidents in the last 30 days.
            </p>
          ) : (
            payload.incidents.map((incident) => {
              const latest = latestIncidentUpdate(incident);
              return (
                <div
                  key={incident.id}
                  className="rounded-lg border border-border/60 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">
                      {incident.title}
                    </p>
                    <Badge variant="outline">{incident.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {incident.customerImpact}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Start: {formatStatusTime(incident.startedAt)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Resolved:{" "}
                    {incident.resolvedAt
                      ? formatStatusTime(incident.resolvedAt)
                      : "Ongoing"}
                  </p>
                  {latest ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Latest update ({formatStatusTime(latest.at)}):{" "}
                      {latest.message}
                    </p>
                  ) : null}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </section>
  );
}
