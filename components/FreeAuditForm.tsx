"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FreeAuditResult } from "@/features/free-audit/types/freeAudit.types";
import { runFreeAuditClient } from "@/features/free-audit/services/freeAuditClient";

const riskTone = {
  High: "border-destructive/40 bg-destructive/10 text-destructive",
  Medium: "border-chart-4/40 bg-chart-4/10 text-chart-4",
  Low: "border-chart-3/40 bg-chart-3/10 text-chart-3",
} as const;

const MAX_COMPETITORS = 5;

function normalizeUrlInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

function isValidUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function FreeAuditForm() {
  const [homepageUrl, setHomepageUrl] = useState("");
  const [pricingUrl, setPricingUrl] = useState("");
  const [competitorUrls, setCompetitorUrls] = useState("");
  const [result, setResult] = useState<FreeAuditResult | null>(null);
  const [homepageError, setHomepageError] = useState<string | null>(null);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [competitorError, setCompetitorError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [homepageTouched, setHomepageTouched] = useState(false);
  const [pricingTouched, setPricingTouched] = useState(false);
  const [competitorsTouched, setCompetitorsTouched] = useState(false);

  const homepageCandidate = normalizeUrlInput(homepageUrl);
  const isHomepageValid =
    homepageCandidate.length > 0 && isValidUrl(homepageCandidate);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }),
    [],
  );

  const validateHomepage = (value: string) => {
    const normalized = normalizeUrlInput(value);
    if (!normalized) {
      return "Homepage URL is required.";
    }

    if (!isValidUrl(normalized)) {
      return "Homepage URL must be a valid URL.";
    }

    return null;
  };

  const validatePricing = (value: string) => {
    const normalized = normalizeUrlInput(value);
    if (!normalized) {
      return null;
    }

    if (!isValidUrl(normalized)) {
      return "Pricing URL must be a valid URL.";
    }

    return null;
  };

  const validateCompetitors = (value: string) => {
    const normalizedCompetitors = value
      .split("\n")
      .map((url) => url.trim())
      .filter(Boolean)
      .map((url) => normalizeUrlInput(url))
      .filter(Boolean)
      .slice(0, MAX_COMPETITORS);

    const invalidCompetitor = normalizedCompetitors.find(
      (url) => !isValidUrl(url),
    );

    return invalidCompetitor
      ? "One or more competitor URLs are invalid."
      : null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);
    setResult(null);

    const nextHomepageError = validateHomepage(homepageUrl);
    const nextPricingError = validatePricing(pricingUrl);
    const nextCompetitorError = validateCompetitors(competitorUrls);

    setHomepageError(nextHomepageError);
    setPricingError(nextPricingError);
    setCompetitorError(nextCompetitorError);
    setHomepageTouched(true);
    setPricingTouched(true);
    setCompetitorsTouched(true);

    if (nextHomepageError || nextPricingError || nextCompetitorError) {
      setIsSubmitting(false);
      return;
    }

    const normalizedHomepage = normalizeUrlInput(homepageUrl);
    const normalizedPricing = pricingUrl ? normalizeUrlInput(pricingUrl) : "";
    const normalizedCompetitors = competitorUrls
      .split("\n")
      .map((url) => url.trim())
      .filter(Boolean)
      .map((url) => normalizeUrlInput(url))
      .filter(Boolean)
      .slice(0, MAX_COMPETITORS);

    setHomepageUrl(normalizedHomepage);
    setPricingUrl(normalizedPricing);
    setCompetitorUrls(normalizedCompetitors.join("\n"));

    try {
      const data = await runFreeAuditClient({
        homepage_url: normalizedHomepage,
        pricing_url: normalizedPricing || null,
        competitor_urls: normalizedCompetitors.length
          ? normalizedCompetitors
          : null,
      });
      setResult(data);
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to run the audit. Please try again.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="free-audit" className="relative py-24 md:py-32">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(210 45% 45% / 0.08) 0%, hsl(200 55% 40% / 0.04) 40%, transparent 72%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Free Conversion Audit
          </p>
          <h2 className="text-balance text-3xl font-bold leading-[1.15] tracking-tight text-foreground md:text-[2.75rem]">
            See your biggest conversion leaks in under 3 minutes.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
            Get a high-level risk preview before you commit to the full
            enterprise report. No credit card required.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-border/60 bg-card/70 p-8 shadow-xl shadow-black/20"
          >
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground">
                Run your preview audit
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Add your homepage and optional pricing plus competitor URLs.
              </p>
            </div>

            <div className="grid gap-5">
              <label className="grid gap-2 text-sm font-medium text-foreground">
                Homepage URL
                <Input
                  value={homepageUrl}
                  onChange={(event) => {
                    setHomepageUrl(event.target.value);
                    if (homepageTouched) {
                      setHomepageError(validateHomepage(event.target.value));
                    }
                  }}
                  onBlur={() => {
                    setHomepageTouched(true);
                    const normalized = normalizeUrlInput(homepageUrl);
                    setHomepageUrl(normalized);
                    setHomepageError(validateHomepage(normalized));
                  }}
                  placeholder="https://yourcompany.com"
                  required
                />
                {homepageTouched && !isHomepageValid && !homepageError && (
                  <span className="text-xs text-muted-foreground">
                    Add a full URL like https://yourcompany.com.
                  </span>
                )}
                {homepageTouched && homepageError && (
                  <span className="text-xs text-destructive">
                    {homepageError}
                  </span>
                )}
              </label>

              <label className="grid gap-2 text-sm font-medium text-foreground">
                Pricing page URL (optional)
                <Input
                  value={pricingUrl}
                  onChange={(event) => {
                    setPricingUrl(event.target.value);
                    if (pricingTouched) {
                      setPricingError(validatePricing(event.target.value));
                    }
                  }}
                  onBlur={() => {
                    setPricingTouched(true);
                    const normalized = normalizeUrlInput(pricingUrl);
                    setPricingUrl(normalized);
                    setPricingError(validatePricing(normalized));
                  }}
                  placeholder="https://yourcompany.com/pricing"
                />
                {pricingTouched && pricingError && (
                  <span className="text-xs text-destructive">
                    {pricingError}
                  </span>
                )}
              </label>

              <label className="grid gap-2 text-sm font-medium text-foreground">
                Competitor URLs (optional)
                <Textarea
                  value={competitorUrls}
                  onChange={(event) => {
                    setCompetitorUrls(event.target.value);
                    if (competitorsTouched) {
                      setCompetitorError(
                        validateCompetitors(event.target.value),
                      );
                    }
                  }}
                  onBlur={() => {
                    setCompetitorsTouched(true);
                    const normalizedList = competitorUrls
                      .split("\n")
                      .map((url) => normalizeUrlInput(url))
                      .filter(Boolean)
                      .slice(0, MAX_COMPETITORS);
                    setCompetitorUrls(normalizedList.join("\n"));
                    setCompetitorError(
                      validateCompetitors(normalizedList.join("\n")),
                    );
                  }}
                  placeholder="https://competitor-one.com\nhttps://competitor-two.com"
                  rows={4}
                />
                <span className="text-xs text-muted-foreground">
                  Up to 5 competitors, one per line.
                </span>
                {competitorsTouched && competitorError && (
                  <span className="text-xs text-destructive">
                    {competitorError}
                  </span>
                )}
              </label>
            </div>

            {submitError && (
              <div className="mt-5 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {submitError}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting || !isHomepageValid}
              >
                {isSubmitting ? "Running audit..." : "Run Free Audit"}
              </Button>
              <span className="text-xs text-muted-foreground">
                Takes about 90 seconds. We do not store this preview.
              </span>
            </div>
          </form>

          <div className="rounded-2xl border border-border/60 bg-secondary/40 p-8">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Preview output
              </p>
              <h3 className="mt-3 text-lg font-semibold text-foreground">
                Conversion risk snapshot
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Submit the form to reveal your initial risk rating and top
                insights.
              </p>
            </div>

            {result ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card/80 px-5 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Risk level
                    </p>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      {result.risk_level}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-4 py-2 text-xs font-semibold ${riskTone[result.risk_level]}`}
                  >
                    {result.risk_level} risk
                  </span>
                </div>

                <div className="rounded-xl border border-border/60 bg-card/80 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Revenue exposure
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-secondary/50 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Pipeline at risk
                      </p>
                      <p className="mt-2 text-xl font-semibold text-foreground">
                        {currencyFormatter.format(
                          result.revenue_impact.pipeline_at_risk,
                        )}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-secondary/50 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Estimated recovery
                      </p>
                      <p className="mt-2 text-xl font-semibold text-foreground">
                        {currencyFormatter.format(
                          result.revenue_impact.estimated_recovery,
                        )}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {result.revenue_impact.note}
                  </p>
                </div>

                <div className="rounded-xl border border-border/60 bg-card/80 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Top insights
                  </p>
                  <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                    {result.insights.map((insight, index) => (
                      <li
                        key={`${insight}-${index}`}
                        className="rounded-lg border border-border/60 bg-secondary/50 px-4 py-3"
                      >
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-border/60 bg-card/80 p-5">
                  <p className="text-sm font-semibold text-foreground">
                    {result.upgrade_cta}
                  </p>
                  <div className="mt-4">
                    <Button asChild size="lg" variant="secondary">
                      <a href="#pricing">Compare plans</a>
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-card/80 p-5">
                  <p className="text-sm font-semibold text-foreground">
                    Next actions
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Move from preview to a full conversion plan in minutes.
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <Button asChild size="lg">
                      <a href="#pricing">Run the full audit</a>
                    </Button>
                    <Button asChild size="lg" variant="outline">
                      <a href="#features">See sample outputs</a>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/60 bg-card/60 p-6 text-sm text-muted-foreground">
                Your preview appears here after you submit the form.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
