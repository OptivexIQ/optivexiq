import type { StatusIncident, SystemStatusLevel } from "@/features/status/types/status.types";

export function toStatusLabel(status: SystemStatusLevel) {
  if (status === "operational") return "Operational";
  if (status === "degraded") return "Degraded performance";
  if (status === "partial_outage") return "Partial outage";
  return "Major outage";
}

export function statusBadgeTone(status: SystemStatusLevel) {
  if (status === "operational")
    return "border-emerald-500/40 bg-emerald-500/15 text-emerald-200";
  if (status === "degraded")
    return "border-amber-500/40 bg-amber-500/15 text-amber-200";
  if (status === "partial_outage")
    return "border-orange-500/40 bg-orange-500/15 text-orange-200";
  return "border-red-500/40 bg-red-500/15 text-red-200";
}

export function statusDotTone(status: SystemStatusLevel) {
  if (status === "operational") return "bg-emerald-500";
  if (status === "degraded") return "bg-amber-500";
  if (status === "partial_outage") return "bg-orange-500";
  return "bg-red-600";
}

export function formatStatusTime(iso: string) {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return parsed.toLocaleString();
}

export function latestIncidentUpdate(incident: StatusIncident) {
  return incident.updates.length > 0
    ? incident.updates[incident.updates.length - 1]
    : null;
}
