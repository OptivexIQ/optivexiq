"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, Play, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  isApiError,
  runGapEngine,
} from "@/features/conversion-gap/gapEngineClient";
import { useGapEngineLiveStatus } from "@/features/conversion-gap/components/GapEngineLiveStatusProvider";

const competitorSchema = z.object({
  value: z.string().url().or(z.literal("")),
});

const gapEngineFormSchema = z.object({
  homepageUrl: z.string().url(),
  pricingUrl: z.string().url().optional().or(z.literal("")),
  competitorUrls: z.array(competitorSchema),
});

type GapEngineFormValues = z.infer<typeof gapEngineFormSchema>;

type GapEngineFormProps = {
  defaultValues: {
    homepageUrl: string;
    pricingUrl: string;
    competitorUrls: string[];
  };
  output: {
    etaMinutes: number;
  };
  usageBlocked: boolean;
  hasSubscription: boolean;
};

export function GapEngineForm({
  defaultValues,
  output,
  usageBlocked,
  hasSubscription,
}: GapEngineFormProps) {
  const {
    liveStatus,
    reportId,
    reportStatus,
    startNewAnalysis,
    bindRunningReport,
    restoreLatestReport,
  } = useGapEngineLiveStatus();
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null);

  const formDefaults = useMemo<GapEngineFormValues>(() => {
    const competitorUrls = defaultValues.competitorUrls.length
      ? defaultValues.competitorUrls
      : [""];
    return {
      homepageUrl: defaultValues.homepageUrl,
      pricingUrl: defaultValues.pricingUrl,
      competitorUrls: competitorUrls.map((value) => ({ value })),
    };
  }, [defaultValues]);

  const form = useForm<GapEngineFormValues>({
    resolver: zodResolver(gapEngineFormSchema),
    defaultValues: formDefaults,
    mode: "onChange",
  });

  const { control, handleSubmit } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "competitorUrls",
  });

  const onSubmit = handleSubmit((values) => {
    setSubmitError(null);
    setSubmitSuccess(null);
    startNewAnalysis();

    const competitorUrls = values.competitorUrls
      .map((item) => item.value.trim())
      .filter((value) => value.length > 0);

    startTransition(async () => {
      try {
        const payload = await runGapEngine({
          homepage_url: values.homepageUrl,
          pricing_url: values.pricingUrl?.trim() || null,
          competitor_urls: competitorUrls,
        });

        if (payload?.reportId) {
          setSubmittedReportId(payload.reportId);
          bindRunningReport(payload.reportId);
          toast({
            title: "Analysis queued",
            description: "Analysis is running. You will be redirected on completion.",
          });
          return;
        }

        setSubmitSuccess("Analysis queued. You will see results shortly.");
      } catch (error) {
        setSubmittedReportId(null);
        restoreLatestReport();
        setSubmitError(
          isApiError(error) ? error.message : "Unable to run analysis.",
        );
      }
    });
  });

  useEffect(() => {
    if (!submittedReportId) {
      return;
    }
    if (reportId !== submittedReportId) {
      return;
    }
    if (reportStatus === "completed") {
      router.push(`/dashboard/reports/${submittedReportId}`);
      return;
    }
    if (reportStatus === "failed") {
      setSubmittedReportId(null);
    }
  }, [reportId, reportStatus, router, submittedReportId]);

  const submitLabel =
    liveStatus === "complete" || liveStatus === "failed"
      ? "Run new analysis"
      : "Run analysis";

  return (
    <Form {...form}>
      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-border/60 bg-card p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Analysis inputs
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Confirm the URLs used to benchmark your positioning.
            </p>
          </div>
          <Button type="submit" disabled={isPending || usageBlocked}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isPending ? "Running..." : submitLabel}
          </Button>
        </div>

        {usageBlocked ? (
          <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-border/60 bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>
              {hasSubscription
                ? "Usage limit reached. Upgrade or wait for the next cycle."
                : "Subscription required to run analyses."}
            </span>
          </div>
        ) : null}

        <div className="mt-6 grid gap-4">
          <FormField
            control={control}
            name="homepageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Homepage URL
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="pricingUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Pricing page URL
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-2">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Competitor URLs
            </p>
            <div className="grid gap-2">
              {fields.map((field, index) => (
                <FormField
                  key={field.id}
                  control={control}
                  name={`competitorUrls.${index}.value`}
                  render={({ field: inputField }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Input {...inputField} className="pr-10" />
                          {index > 0 ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                              aria-label={`Remove competitor URL ${index + 1}`}
                              onClick={() => remove(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              <Button
                type="button"
                variant="outline"
                className="justify-start"
                onClick={() => append({ value: "" })}
              >
                Add competitor
              </Button>
            </div>
          </div>
        </div>

        {submitError ? (
          <div className="mt-4 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{submitError}</span>
          </div>
        ) : null}
        {submitSuccess ? (
          <div className="mt-4 rounded-md border border-border/60 bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
            {submitSuccess}
          </div>
        ) : null}

        <div className="mt-6 rounded-lg border border-border/60 bg-secondary/40 p-4">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Expected output
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <div className="rounded-full border border-border/60 bg-card px-3 py-1">
              {output.etaMinutes} min average runtime
            </div>
            <div className="rounded-full border border-border/60 bg-card px-3 py-1">
              Executive report + rewrite pack
            </div>
            <div className="rounded-full border border-border/60 bg-card px-3 py-1">
              Competitive benchmarking
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
