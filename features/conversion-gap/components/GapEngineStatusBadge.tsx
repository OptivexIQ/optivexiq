"use client";

import { AlertCircle, CheckCircle2, Clock3, Radar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useGapEngineLiveStatus } from "@/features/conversion-gap/components/GapEngineLiveStatusProvider";

export function GapEngineStatusBadge() {
  const { liveStatus } = useGapEngineLiveStatus();

  const badgeState =
    liveStatus === "running"
      ? {
          label: "Running analysis",
          icon: Radar,
          tone: "text-primary",
        }
      : liveStatus === "complete"
        ? {
            label: "Analysis complete",
            icon: CheckCircle2,
            tone: "text-chart-3",
          }
        : liveStatus === "failed"
          ? {
              label: "Analysis failed",
              icon: AlertCircle,
              tone: "text-destructive",
            }
          : {
              label: "Idle",
              icon: Clock3,
              tone: "text-muted-foreground",
            };

  return (
    <Badge variant="outline" className="gap-2">
      <span className={`flex items-center gap-1 ${badgeState.tone}`}>
        <badgeState.icon className="h-3.5 w-3.5" />
        {badgeState.label}
      </span>
    </Badge>
  );
}
