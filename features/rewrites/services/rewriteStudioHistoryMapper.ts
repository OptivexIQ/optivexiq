import type { RewriteStudioInitialData } from "@/features/rewrites/types/rewrites.types";
import type { RewriteHistoryRecord } from "@/features/rewrites/services/rewriteHistoryReadService";

export function extractUserNotesFromHistoryNotes(notes: string | null | undefined) {
  const safe = notes ?? "";
  const marker = "\n\nUser notes:\n";
  const markerIndex = safe.indexOf(marker);
  if (markerIndex >= 0) {
    return safe.slice(markerIndex + marker.length).trim();
  }
  return safe.trim();
}

export function mapRewriteHistoryRecordToStudioVersion(
  item: RewriteHistoryRecord,
): NonNullable<RewriteStudioInitialData["historyVersions"]>[number] {
  const strategy = item.strategyContext;
  return {
    requestRef: item.requestRef,
    isControl: item.isControl,
    controlRequestRef: item.controlRequestRef,
    experimentGroupId: item.experimentGroupId ?? undefined,
    parentRequestRef: item.parentRequestRef ?? undefined,
    versionNumber: item.versionNumber,
    isWinner: item.isWinner,
    winnerLabel: item.winnerLabel ?? undefined,
    winnerMarkedAt: item.winnerMarkedAt ?? undefined,
    rewriteType: item.rewriteType,
    createdAt: item.createdAt,
    outputMarkdown: item.outputMarkdown,
    websiteUrl: item.websiteUrl,
    sourceContent: item.sourceContent,
    userNotes: extractUserNotesFromHistoryNotes(item.notes),
    strategicContext: {
      goal: strategy.goal,
      icp: strategy.icp,
      differentiationFocus: strategy.focus.differentiation,
      objectionFocus: strategy.focus.objection,
    },
    tone: strategy.tone || undefined,
    length: strategy.length || undefined,
    emphasis: strategy.emphasis,
    constraints: strategy.constraints || undefined,
    audience: strategy.audience || undefined,
    idempotencyKey: item.idempotencyKey,
    hypothesis: item.hypothesis,
    promptVersion: item.promptVersion,
    systemTemplateVersion: item.systemTemplateVersion,
    modelTemperature: item.modelTemperature,
    deltaMetrics: item.deltaMetrics,
    strategyContext: {
      target: strategy.target,
      goal: strategy.goal,
      icp: strategy.icp,
      tone: strategy.tone as
        | "neutral"
        | "confident"
        | "technical"
        | "direct"
        | "founder-led"
        | "enterprise",
      length: strategy.length as "short" | "standard" | "long",
      emphasis: strategy.emphasis as (
        | "clarity"
        | "differentiation"
        | "objection-handling"
        | "pricing-clarity"
        | "proof-credibility"
      )[],
      constraints: strategy.constraints,
      audience: strategy.audience,
      focus: strategy.focus,
      schemaVersion: strategy.schemaVersion,
    },
  };
}
