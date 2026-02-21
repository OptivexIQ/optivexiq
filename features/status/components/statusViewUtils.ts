import type {
  StatusIncident,
  SystemStatusLevel,
} from "@/features/status/types/status.types";

export function toStatusLabel(status: SystemStatusLevel) {
  if (status === "operational") return "Operational";
  if (status === "degraded") return "Degraded performance";
  if (status === "partial_outage") return "Partial outage";
  return "Major outage";
}

export function statusBadgeTone(status: SystemStatusLevel) {
  if (status === "operational") return "text-sm text-emerald-500";
  if (status === "degraded") return "text-sm text-amber-500";
  if (status === "partial_outage") return "text-sm text-orange-500";
  return "text-sm text-red-500";
}

export function statusDotTone(status: SystemStatusLevel) {
  if (status === "operational") return "bg-emerald-500";
  if (status === "degraded") return "bg-amber-500";
  if (status === "partial_outage") return "bg-orange-500";
  return "bg-red-600";
}

export function statusDotRingTone(status: SystemStatusLevel) {
  if (status === "operational") return "bg-emerald-500/25";
  if (status === "degraded") return "bg-amber-500/25";
  if (status === "partial_outage") return "bg-orange-500/25";
  return "bg-red-600/25";
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
