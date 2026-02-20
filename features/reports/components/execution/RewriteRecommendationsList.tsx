"use client";

import { useEffect, useState } from "react";
import type { RewriteRecommendationCard } from "@/features/reports/components/execution/RewriteRecommendations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CircleDollarSign,
  FileText,
  Home,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";

const DEFAULT_SLUG = "";

type RewriteRecommendationsListProps = {
  cards: RewriteRecommendationCard[];
};

function getPreview(copy: string) {
  const trimmed = copy.trim();
  if (!trimmed) {
    return "";
  }

  const sentences = trimmed.split(/(?<=\.)\s+/);
  const first = sentences[0]?.trim() ?? trimmed;

  return first.length < trimmed.length ? `${first}...` : first;
}

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

export function RewriteRecommendationsList({
  cards,
}: RewriteRecommendationsListProps) {
  const [activeSlug, setActiveSlug] = useState(DEFAULT_SLUG);

  useEffect(() => {
    const updateActiveSlug = () => {
      const hash = window.location.hash.replace("#", "");
      setActiveSlug(hash);
    };

    updateActiveSlug();
    window.addEventListener("hashchange", updateActiveSlug);

    return () => {
      window.removeEventListener("hashchange", updateActiveSlug);
    };
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {cards.map((card) => {
        const Icon = iconForCategory(card.category, card.iconName);
        const isActive = card.slug === activeSlug;

        return (
          <section
            key={card.title}
            id={card.slug}
            className={`rounded-2xl border bg-card p-6 transition ${
              isActive
                ? "border-primary/60 shadow-[0_0_0_1px_hsl(var(--primary)/0.3)]"
                : "border-border/60"
            }`}
            style={{ scrollMarginTop: "96px" }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-secondary/60 text-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground/85">
                  {card.title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Impact metric: {card.metric}
                </p>
              </div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="mt-5 w-full rounded-xl border border-border/60 bg-secondary/30 p-4 text-left transition hover:border-border"
                >
                  <p className="text-sm font-semibold text-foreground/85">
                    Suggested copy
                  </p>
                  <p className="mt-2 text-sm text-foreground/90">
                    {getPreview(card.copy)}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-primary">
                    View full copy
                  </p>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{card.title}</DialogTitle>
                  <DialogDescription>Suggested copy</DialogDescription>
                </DialogHeader>
                <div className="rounded-xl border border-border/60 bg-secondary/30 p-4">
                  <p className="text-sm text-foreground/90">{card.copy}</p>
                </div>
              </DialogContent>
            </Dialog>
          </section>
        );
      })}
    </div>
  );
}
