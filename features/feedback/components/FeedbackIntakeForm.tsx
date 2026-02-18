"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  submitFeedbackAction,
  type FeedbackActionState,
} from "@/app/actions/feedback/submitFeedback";

const INITIAL_STATE: FeedbackActionState = {
  success: false,
  error: null,
  referenceId: null,
  duplicate: false,
};

const REQUEST_TYPES = [
  { value: "feature", label: "Request a Feature" },
  { value: "bug", label: "Report a Bug" },
] as const;

const PRODUCT_AREAS = [
  { value: "dashboard", label: "Dashboard" },
  { value: "gap_engine", label: "Gap Engine" },
  { value: "reports", label: "Reports" },
  { value: "billing", label: "Billing" },
  { value: "free_audit", label: "Free Conversion Audit" },
  { value: "marketing_site", label: "Marketing Site" },
  { value: "api", label: "API" },
  { value: "other", label: "Other" },
] as const;

const IMPACT_LEVELS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
] as const;

export function FeedbackIntakeForm() {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<FeedbackActionState>(INITIAL_STATE);

  const [requestType, setRequestType] = useState<(typeof REQUEST_TYPES)[number]["value"]>("feature");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [productArea, setProductArea] = useState<(typeof PRODUCT_AREAS)[number]["value"]>("dashboard");
  const [impact, setImpact] = useState<(typeof IMPACT_LEVELS)[number]["value"]>("medium");
  const [pageUrl, setPageUrl] = useState("");
  const [reproductionSteps, setReproductionSteps] = useState("");
  const [expectedBehavior, setExpectedBehavior] = useState("");
  const [actualBehavior, setActualBehavior] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");

  const isBug = requestType === "bug";
  const canSubmit = useMemo(() => {
    if (title.trim().length < 6 || summary.trim().length < 30 || email.trim().length < 5) {
      return false;
    }
    if (!isBug) {
      return true;
    }
    return (
      reproductionSteps.trim().length >= 10 &&
      expectedBehavior.trim().length >= 10 &&
      actualBehavior.trim().length >= 10
    );
  }, [title, summary, email, isBug, reproductionSteps, expectedBehavior, actualBehavior]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState(INITIAL_STATE);

    const formData = new FormData();
    formData.set("requestType", requestType);
    formData.set("title", title);
    formData.set("summary", summary);
    formData.set("productArea", productArea);
    formData.set("impact", impact);
    formData.set("pageUrl", pageUrl);
    formData.set("reproductionSteps", reproductionSteps);
    formData.set("expectedBehavior", expectedBehavior);
    formData.set("actualBehavior", actualBehavior);
    formData.set("name", name);
    formData.set("email", email);
    formData.set("company", company);
    formData.set("website", "");

    startTransition(async () => {
      const result = await submitFeedbackAction(INITIAL_STATE, formData);
      setState(result);
      if (!result.success || result.duplicate) {
        return;
      }

      setTitle("");
      setSummary("");
      setPageUrl("");
      setReproductionSteps("");
      setExpectedBehavior("");
      setActualBehavior("");
      setName("");
      setEmail("");
      setCompany("");
      setRequestType("feature");
      setProductArea("dashboard");
      setImpact("medium");
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-border/70 bg-card/70 p-6 shadow-sm backdrop-blur">
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Request type</span>
          <Select value={requestType} onValueChange={(value) => setRequestType(value as (typeof REQUEST_TYPES)[number]["value"])}>
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REQUEST_TYPES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="grid gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Product area</span>
          <Select value={productArea} onValueChange={(value) => setProductArea(value as (typeof PRODUCT_AREAS)[number]["value"])}>
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_AREAS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>

      <label className="grid gap-2 text-sm">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Title</span>
        <Input className="h-11" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Short, specific summary" required />
      </label>

      <label className="grid gap-2 text-sm">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Details</span>
        <Textarea
          className="min-h-[140px]"
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          placeholder={isBug ? "Describe the issue and business impact." : "Describe the feature, use case, and expected business impact."}
          required
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Impact</span>
          <Select value={impact} onValueChange={(value) => setImpact(value as (typeof IMPACT_LEVELS)[number]["value"])}>
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {IMPACT_LEVELS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="grid gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Affected URL (optional)</span>
          <Input className="h-11" value={pageUrl} onChange={(event) => setPageUrl(event.target.value)} placeholder="https://app.optivexiq.com/..." />
        </label>
      </div>

      {isBug ? (
        <div className="grid gap-4">
          <label className="grid gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Reproduction steps</span>
            <Textarea
              value={reproductionSteps}
              onChange={(event) => setReproductionSteps(event.target.value)}
              placeholder="Step-by-step instructions to reproduce."
              rows={4}
              required
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Expected behavior</span>
              <Textarea value={expectedBehavior} onChange={(event) => setExpectedBehavior(event.target.value)} rows={3} required />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Actual behavior</span>
              <Textarea value={actualBehavior} onChange={(event) => setActualBehavior(event.target.value)} rows={3} required />
            </label>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Name (optional)</span>
          <Input className="h-11" value={name} onChange={(event) => setName(event.target.value)} placeholder="Jane Doe" />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Work email</span>
          <Input className="h-11" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="jane@company.com" required />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Company (optional)</span>
          <Input className="h-11" value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Company name" />
        </label>
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success && !state.duplicate ? (
        <p className="text-sm text-emerald-600">
          We have received your submission and queued it for product triage.
          {state.referenceId
            ? ` Reference ID: ${state.referenceId}. Please keep this for support follow-up.`
            : ""}
        </p>
      ) : null}
      {state.success && state.duplicate ? (
        <p className="text-sm text-amber-600">
          A matching submission was already received in the last 24 hours.
          {state.referenceId
            ? ` Reference ID: ${state.referenceId}. Please use this for follow-up.`
            : ""}
        </p>
      ) : null}

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-xs leading-relaxed text-muted-foreground">
          We review all submissions in weekly product triage. Critical bug reports are prioritized first.
        </p>
        <Button type="submit" className="h-11 px-5" disabled={!canSubmit || isPending}>
          {isPending ? "Submitting..." : isBug ? "Submit Bug Report" : "Submit Feature Request"}
        </Button>
      </div>
    </form>
  );
}
