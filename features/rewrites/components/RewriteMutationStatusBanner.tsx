"use client";

import { Activity, AlertTriangle, CheckCircle2 } from "lucide-react";

type RewriteMutationStatusBannerProps = {
  status: "running" | "success" | "error";
  title: string;
  detail: string;
};

export function RewriteMutationStatusBanner({
  status,
  title,
  detail,
}: RewriteMutationStatusBannerProps) {
  const tone =
    status === "running"
      ? "border-amber-500/40 bg-amber-500/10 text-amber-100"
      : status === "success"
        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
        : "border-rose-500/40 bg-rose-500/10 text-rose-100";
  const Icon =
    status === "running"
      ? Activity
      : status === "success"
        ? CheckCircle2
        : AlertTriangle;

  return (
    <div className={`rounded-lg border px-3 py-2.5 ${tone}`}>
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-1 text-xs opacity-90">{detail}</p>
        </div>
      </div>
    </div>
  );
}
