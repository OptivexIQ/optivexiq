"use client";

import Link from "next/link";
import type { SaasProfileFormValues } from "@/features/saas-profile/types/profile.types";
import { formatConversionGoalLabel } from "@/features/saas-profile/utils/conversionGoal";
import { formatRevenueStageLabel } from "@/features/saas-profile/utils/revenueStage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Pencil,
  Users,
  DollarSign,
  Euro,
  TrendingUp,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Target,
  Zap,
  Shield,
  Award,
  Globe,
  BarChart3,
  MessageSquare,
  Lightbulb,
  Flag,
} from "lucide-react";

type ProfileViewProps = {
  profile: SaasProfileFormValues;
};

function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return "Never";
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function calculateProfileCompleteness(profile: SaasProfileFormValues): {
  percentage: number;
  completed: number;
  total: number;
  missing: string[];
} {
  const fields = [
    { key: "icpRole", label: "ICP Role", value: profile.icpRole },
    { key: "primaryPain", label: "Primary Pain", value: profile.primaryPain },
    {
      key: "buyingTrigger",
      label: "Buying Trigger",
      value: profile.buyingTrigger,
    },
    { key: "websiteUrl", label: "Website URL", value: profile.websiteUrl },
    { key: "acvRange", label: "ACV Range", value: profile.acvRange },
    {
      key: "revenueStage",
      label: "Revenue Stage",
      value: profile.revenueStage,
    },
    { key: "salesMotion", label: "Sales Motion", value: profile.salesMotion },
    {
      key: "conversionGoal",
      label: "Conversion Goal",
      value: profile.conversionGoal,
    },
    {
      key: "pricingModel",
      label: "Pricing Model",
      value: profile.pricingModel,
    },
    {
      key: "keyObjections",
      label: "Key Objections",
      value: profile.keyObjections.filter((o) => o.value.trim()).length > 0,
    },
    {
      key: "proofPoints",
      label: "Proof Points",
      value: profile.proofPoints.filter((p) => p.value.trim()).length > 0,
    },
    {
      key: "differentiationMatrix",
      label: "Competitive Differentiation",
      value:
        profile.differentiationMatrix.filter(
          (d) => d.competitor.trim() || d.ourAdvantage.trim(),
        ).length > 0,
    },
  ];

  const completed = fields.filter((f) => {
    if (typeof f.value === "string") return f.value.trim().length > 0;
    return f.value === true;
  }).length;

  const missing = fields
    .filter((f) => {
      if (typeof f.value === "string") return f.value.trim().length === 0;
      return f.value === false;
    })
    .map((f) => f.label);

  return {
    percentage: Math.round((completed / fields.length) * 100),
    completed,
    total: fields.length,
    missing,
  };
}

export function ProfileView({ profile }: ProfileViewProps) {
  const objections = profile.keyObjections
    .map((item) => item.value)
    .filter((v) => v.trim().length > 0);

  const proofPoints = profile.proofPoints
    .map((item) => item.value)
    .filter((v) => v.trim().length > 0);

  const competitors = profile.differentiationMatrix.filter(
    (row) =>
      row.competitor.trim().length > 0 ||
      row.ourAdvantage.trim().length > 0 ||
      row.theirAdvantage.trim().length > 0,
  );

  const completeness = calculateProfileCompleteness(profile);
  const isComplete = completeness.percentage === 100;

  return (
    <div className="space-y-6">
      {/* Profile Status & Actions */}
      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Profile completeness
                </p>
                {isComplete ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Complete
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {completeness.missing.length} missing
                  </Badge>
                )}
              </div>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-3xl font-semibold text-foreground">
                  {completeness.percentage}%
                </span>
                <span className="mb-1 text-xs text-muted-foreground">
                  {completeness.completed} of {completeness.total} fields
                </span>
              </div>
              <Progress
                value={completeness.percentage}
                variant={isComplete ? "info" : "warning"}
                className="mt-3 h-2"
              />
              {!isComplete && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Missing: {completeness.missing.join(", ")}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:min-w-50">
          <Button asChild size="lg" className="w-full">
            <Link href="/dashboard/profile/edit">
              <Pencil className="h-4 w-4" />
              Edit profile
            </Link>
          </Button>
          <div className="rounded-lg border border-border/60 bg-secondary/40 p-3">
            <p className="text-xs text-muted-foreground">Last updated</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {formatDate(profile.updatedAt)}
            </p>
          </div>
        </div>
      </div>

      {/* ICP & Messaging */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            ICP & Messaging
          </h2>
        </div>
        <div className="grid gap-4">
          <div className="rounded-xl border border-border/60 bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  ICP Role
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {profile.icpRole || "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Primary Pain
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">
                  {profile.primaryPain || "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Lightbulb className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Buying Trigger
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">
                  {profile.buyingTrigger || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Market & Revenue Foundation */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Market & Revenue Foundation
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Website URL
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {profile.websiteUrl ? (
                    <a
                      href={profile.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {profile.websiteUrl}
                    </a>
                  ) : (
                    "—"
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Revenue Stage
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {formatRevenueStageLabel(profile.revenueStage, "—")}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Euro className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  ACV Range
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {profile.acvRange || "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Sales Motion
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {profile.salesMotion || "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Flag className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Conversion Goal
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {formatConversionGoalLabel(profile.conversionGoal, "—")}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Pricing Model
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {profile.pricingModel || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Intelligence */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Conversion Intelligence
          </h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Key Objections */}
          <div className="rounded-xl border border-border/60 bg-card p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Key Objections
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Barriers to conversion
                  </p>
                </div>
              </div>
              {objections.length > 0 && (
                <Badge variant="secondary">{objections.length}</Badge>
              )}
            </div>
            {objections.length > 0 ? (
              <ul className="mt-4 space-y-2.5">
                {objections.map((objection, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2.5 rounded-lg border border-border/40 bg-secondary/20 p-3 text-sm text-foreground"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-xs font-semibold text-destructive">
                      {index + 1}
                    </span>
                    <span className="flex-1">{objection}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No objections configured
              </p>
            )}
          </div>

          {/* Proof Points */}
          <div className="rounded-xl border border-border/60 bg-card p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Proof Points
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Trust & credibility signals
                  </p>
                </div>
              </div>
              {proofPoints.length > 0 && (
                <Badge variant="secondary">{proofPoints.length}</Badge>
              )}
            </div>
            {proofPoints.length > 0 ? (
              <ul className="mt-4 space-y-2.5">
                {proofPoints.map((point, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2.5 rounded-lg border border-border/40 bg-secondary/20 p-3 text-sm text-foreground"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="flex-1">{point}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No proof points configured
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Competitive Positioning */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Competitive Positioning
          </h2>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Differentiation Matrix
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                How you stack up against key competitors
              </p>
            </div>
            {competitors.length > 0 && (
              <Badge variant="secondary">
                {competitors.length} competitors
              </Badge>
            )}
          </div>
          {competitors.length > 0 ? (
            <div className="mt-5 space-y-4">
              {competitors.map((row, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-border/60 bg-linear-to-br from-secondary/40 to-secondary/20 p-5"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-card">
                      <span className="text-sm font-bold text-primary">
                        {index + 1}
                      </span>
                    </div>
                    <h4 className="text-base font-semibold text-foreground">
                      {row.competitor || "Unnamed competitor"}
                    </h4>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                          Our Advantage
                        </p>
                      </div>
                      <p className="mt-2 text-sm text-foreground">
                        {row.ourAdvantage || "—"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/40 bg-muted/30 p-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Their Advantage
                        </p>
                      </div>
                      <p className="mt-2 text-sm text-foreground">
                        {row.theirAdvantage || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              No competitors configured
            </p>
          )}
        </div>
      </div>
    </div>
  );
}


