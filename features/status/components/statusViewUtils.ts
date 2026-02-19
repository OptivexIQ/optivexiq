import type { StatusIncident, SystemStatusLevel } from "@/features/status/types/status.types";

export function toStatusLabel(status: SystemStatusLevel) {
  if (status === "operational") return "Operational";
  if (status === "degraded") return "Degraded performance";
  if (status === "partial_outage") return "Partial outage";
  return "Major outage";
}

export function statusBadgeTone(status: SystemStatusLevel) {
  if (status === "operational") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (status === "degraded") return "bg-amber-100 text-amber-700 border-amber-200";
  if (status === "partial_outage") return "bg-orange-100 text-orange-700 border-orange-200";
  return "bg-red-100 text-red-700 border-red-200";
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
