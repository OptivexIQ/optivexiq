"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CompletionState } from "@/features/free-snapshot/components/CompletionState";
import { FailureState } from "@/features/free-snapshot/components/FailureState";
import { RunningState } from "@/features/free-snapshot/components/RunningState";
import {
  startFreeSnapshot,
  unlockFreeSnapshot,
} from "@/features/free-snapshot/services/freeSnapshotClient";
import { useFreeSnapshotStatus } from "@/features/free-snapshot/hooks/useFreeSnapshotStatus";

const MAX_COMPETITORS = 2;
const STORAGE_KEY = "free_snapshot_active";

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

function parseCompetitorUrls(raw: string) {
  return raw
    .split(/[\n,;]+/)
    .map((url) => normalizeUrlInput(url))
    .filter((url) => url.length > 0)
    .slice(0, MAX_COMPETITORS);
}

function getDomain(value: string): string {
  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
}

export function FreeSnapshotForm() {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [competitorUrlsInput, setCompetitorUrlsInput] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [contextInput, setContextInput] = useState("");

  const [websiteError, setWebsiteError] = useState<string | null>(null);
  const [competitorError, setCompetitorError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [snapshotId, setSnapshotId] = useState<string | null>(null);
  const {
    statusPayload,
    setStatusPayload,
    viewState,
    progress,
    pollError,
    pollFailureCount,
  } =
    useFreeSnapshotStatus(snapshotId);

  const websiteCandidate = normalizeUrlInput(websiteUrl);
  const isWebsiteValid =
    websiteCandidate.length > 0 && isValidUrl(websiteCandidate);

  const competitorUrls = useMemo(
    () => parseCompetitorUrls(competitorUrlsInput),
    [competitorUrlsInput],
  );

  const domain = getDomain(
    statusPayload?.websiteUrl || websiteCandidate || websiteUrl || "your site",
  );

  const competitorCount =
    statusPayload?.competitorCount ?? competitorUrls.length;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as { snapshotId?: string };
      if (parsed?.snapshotId) {
        setSnapshotId(parsed.snapshotId);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!statusPayload || typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ snapshotId: statusPayload.snapshotId }),
    );
  }, [statusPayload]);

  const resetFlow = () => {
    setSubmitError(null);
    setWebsiteError(null);
    setCompetitorError(null);
    setSnapshotId(null);
    setStatusPayload(null);
    setContextInput("");

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const normalizedWebsite = normalizeUrlInput(websiteUrl);
    const websiteValidationError = !normalizedWebsite
      ? "Website URL is required."
      : !isValidUrl(normalizedWebsite)
        ? "Website URL must be a valid URL."
        : null;

    const invalidCompetitor = competitorUrls.find((url) => !isValidUrl(url));
    const competitorsValidationError = invalidCompetitor
      ? "One or more competitor URLs are invalid."
      : null;

    setWebsiteError(websiteValidationError);
    setCompetitorError(competitorsValidationError);

    if (websiteValidationError || competitorsValidationError) {
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await startFreeSnapshot({
        websiteUrl: normalizedWebsite,
        competitorUrls,
        email: leadEmail.trim().length > 0 ? leadEmail.trim() : undefined,
        context:
          contextInput.trim().length > 0 ? contextInput.trim() : undefined,
        honeypot: "",
      });

      setWebsiteUrl(normalizedWebsite);
      setSnapshotId(created.snapshotId);
      setStatusPayload({
        snapshotId: created.snapshotId,
        status: created.status,
        executionStage: null,
        snapshot: null,
        error: null,
        websiteUrl: normalizedWebsite,
        competitorCount: competitorUrls.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ snapshotId: created.snapshotId }),
        );
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to run the audit. Please try again.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (input: { email: string; consent: boolean }) => {
    if (!snapshotId) {
      throw new Error("Snapshot ID is missing.");
    }

    const pdf = await unlockFreeSnapshot({
      snapshotId,
      email: input.email,
      consent: input.consent,
      honeypot: "",
    });

    const url = URL.createObjectURL(pdf);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `optivexiq-free-snapshot-${snapshotId}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    setLeadEmail(input.email);
  };

  return (
    <section id="free-snapshot" className="relative py-24 md:py-32">
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

        {viewState === "form" ? (
          <form
            onSubmit={handleSubmit}
            className="mx-auto max-w-3xl rounded-2xl border border-border/60 bg-card/70 p-8 shadow-xl shadow-black/20"
          >
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground">
                Run your Free Conversion Audit
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter your website and optional competitors to run live AI
                analysis.
              </p>
            </div>

            <div className="grid gap-5">
              <label className="grid gap-2 text-sm font-medium text-foreground">
                Website URL
                <Input
                  value={websiteUrl}
                  onChange={(event) => {
                    setWebsiteUrl(event.target.value);
                    setWebsiteError(null);
                  }}
                  onBlur={() => setWebsiteUrl(normalizeUrlInput(websiteUrl))}
                  placeholder="https://yourcompany.com"
                  required
                />
                {websiteError ? (
                  <span className="text-xs text-destructive">
                    {websiteError}
                  </span>
                ) : null}
              </label>

              <label className="grid gap-2 text-sm font-medium text-foreground">
                Competitor URLs (optional)
                <Textarea
                  value={competitorUrlsInput}
                  onChange={(event) => {
                    setCompetitorUrlsInput(event.target.value);
                    setCompetitorError(null);
                  }}
                  placeholder="https://competitor-one.com, https://competitor-two.com"
                  rows={3}
                />
                <span className="text-xs text-muted-foreground">
                  Up to 2 competitors, separated by commas or new lines.
                </span>
                {competitorError ? (
                  <span className="text-xs text-destructive">
                    {competitorError}
                  </span>
                ) : null}
              </label>

              <label className="grid gap-2 text-sm font-medium text-foreground">
                Email (optional)
                <Input
                  type="email"
                  value={leadEmail}
                  onChange={(event) => setLeadEmail(event.target.value)}
                  placeholder="you@company.com"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-foreground">
                Context (optional)
                <Textarea
                  value={contextInput}
                  onChange={(event) => setContextInput(event.target.value)}
                  placeholder="What conversion problem are you trying to solve?"
                  rows={2}
                />
              </label>
            </div>

            {submitError ? (
              <div className="mt-5 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {submitError}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting || !isWebsiteValid}
              >
                {isSubmitting
                  ? "Starting snapshot..."
                  : "Run Free Conversion Audit"}
              </Button>
              <span className="text-xs text-muted-foreground">
                This snapshot was generated using live AI analysis of your
                website.
              </span>
            </div>
          </form>
        ) : null}

        {viewState === "running" ? (
          <div className="mx-auto max-w-3xl">
            <RunningState
              domain={domain}
              competitorCount={competitorCount}
              startedAtIso={statusPayload?.createdAt ?? new Date().toISOString()}
              stageLabel={progress.label}
              progressValue={progress.value}
              activeStageIndex={progress.activeStageIndex}
              pollError={pollError}
              pollFailureCount={pollFailureCount}
            />
          </div>
        ) : null}

        {viewState === "completed" && statusPayload?.snapshot ? (
          <div className="mx-auto max-w-3xl">
            <CompletionState
              domain={domain}
              snapshot={statusPayload.snapshot}
              initialEmail={leadEmail}
              onDownload={handleDownload}
            />
          </div>
        ) : null}

        {(viewState === "failed" ||
          (viewState === "completed" && !statusPayload?.snapshot)) && (
          <div className="mx-auto max-w-3xl space-y-4">
            <FailureState onRetry={resetFlow} />
            {statusPayload?.error ? (
              <p className="text-center text-xs text-muted-foreground">
                {statusPayload.error}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
