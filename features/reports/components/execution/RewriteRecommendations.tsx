import Link from "next/link";
import type { ConversionGapReport } from "@/features/reports/types/report.types";
import {
  FileText,
  CircleDollarSign,
  Home,
  ShieldCheck,
  MessageCircle,
  ArrowUpRight,
} from "lucide-react";

type RewriteRecommendationsProps = {
  report: ConversionGapReport;
};

export type RewriteRecommendationCard = {
  title: string;
  slug: string;
  iconName?: "home" | "pricing" | "trust" | "objection" | "default";
  category: string;
  metric: string;
  copy: string;
};

function iconForCategory(
  category: string,
  iconName?: RewriteRecommendationCard["iconName"],
) {
  if (iconName === "home") {
    return Home;
  }

  if (iconName === "pricing") {
    return CircleDollarSign;
  }

  if (iconName === "trust") {
    return ShieldCheck;
  }

  if (iconName === "objection") {
    return MessageCircle;
  }

  if (iconName === "default") {
    return FileText;
  }

  const normalized = category.toLowerCase();

  if (normalized.includes("home") || normalized.includes("hero")) {
    return Home;
  }

  if (normalized.includes("price") || normalized.includes("pricing")) {
    return CircleDollarSign;
  }

  if (normalized.includes("trust") || normalized.includes("proof")) {
    return ShieldCheck;
  }

  if (normalized.includes("objection") || normalized.includes("faq")) {
    return MessageCircle;
  }

  return FileText;
}

export function getRewriteRecommendationCards(
  report: ConversionGapReport,
): RewriteRecommendationCard[] {
  return report.rewriteRecommendations.map((recommendation) => ({
    title: recommendation.title,
    slug: recommendation.slug,
    iconName: recommendation.iconName,
    category: recommendation.category,
    metric: recommendation.metric,
    copy: recommendation.copy,
  }));
}

export function RewriteRecommendations({
  report,
}: RewriteRecommendationsProps) {
  const cards = getRewriteRecommendationCards(report);

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <p className="text-sm font-semibold text-foreground/85">
        Rewrite recommendations
      </p>
      {cards.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No rewrite recommendations are available for this report.
        </p>
      ) : null}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {cards.map((card) => {
          const Icon = iconForCategory(card.category, card.iconName);
          return (
            <div
              key={`${card.slug}:${card.title}`}
              className="rounded-2xl border border-border/60 bg-secondary/30 p-5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-secondary/60 text-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-foreground/85">
                  {card.title}
                </p>
              </div>
              <p className="mt-4 text-sm text-foreground/90">{card.copy}</p>
              <div className="mt-5 h-px bg-border/60" />
              <div className="mt-3 flex items-center justify-between text-sm">
                <Link
                  href={`/dashboard/reports/${report.id}/rewrite-recommendations#${card.slug}`}
                  className="inline-flex items-center gap-2 font-semibold text-primary"
                >
                  See suggested copy
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
                <span className="text-muted-foreground">{card.metric}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
