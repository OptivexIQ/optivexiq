"use client";

import { useEffect, useState } from "react";
import { Info, Loader2, Sparkles } from "lucide-react";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import type {
  RewriteEmphasis,
  RewriteGenerateRequest,
  RewriteHypothesis,
  RewriteHypothesisType,
  RewriteLength,
  RewriteStrategy,
  RewriteTreatmentVariable,
  RewriteControlledVariable,
  RewriteTone,
} from "@/features/rewrites/types/rewrites.types";
import {
  buildSectionTemplate,
  getAllowedSectionLabels,
  hasAnyAllowedSectionLabel,
} from "@/features/rewrites/services/sectionLabelUtils";

type RewriteInputPanelProps = {
  value: RewriteGenerateRequest;
  strategy: RewriteStrategy;
  hypothesis: RewriteHypothesis;
  refineMode: boolean;
  deltaInstructions: string;
  running: boolean;
  enforceSectionLabels: boolean;
  onChange: (value: RewriteGenerateRequest) => void;
  onStrategyChange: (value: RewriteStrategy) => void;
  onHypothesisChange: (value: RewriteHypothesis) => void;
  onEnforceSectionLabelsChange: (value: boolean) => void;
  onDeltaInstructionsChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

function updateField(
  value: RewriteGenerateRequest,
  key: keyof RewriteGenerateRequest,
  next: string,
) {
  return { ...value, [key]: next };
}

const TONE_OPTIONS: Array<{ value: RewriteTone; label: string }> = [
  { value: "neutral", label: "Neutral" },
  { value: "confident", label: "Confident" },
  { value: "technical", label: "Technical" },
  { value: "direct", label: "Direct" },
  { value: "founder-led", label: "Founder-led" },
  { value: "enterprise", label: "Enterprise" },
];

const LENGTH_OPTIONS: Array<{ value: RewriteLength; label: string }> = [
  { value: "short", label: "Short" },
  { value: "standard", label: "Standard" },
  { value: "long", label: "Long" },
];

const EMPHASIS_OPTIONS: Array<{ value: RewriteEmphasis; label: string }> = [
  { value: "clarity", label: "Clarity" },
  { value: "differentiation", label: "Differentiation" },
  { value: "objection-handling", label: "Objection handling" },
  { value: "pricing-clarity", label: "Pricing clarity" },
  { value: "proof-credibility", label: "Proof/credibility" },
];

const AUDIENCE_OPTIONS = [
  "Executive buyers",
  "Technical buyers",
  "Mixed buying committee",
] as const;

const HYPOTHESIS_TYPE_OPTIONS: Array<{
  value: RewriteHypothesisType;
  label: string;
}> = [
  { value: "positioning_shift", label: "Positioning shift" },
  { value: "objection_attack", label: "Objection attack" },
  { value: "differentiation_emphasis", label: "Differentiation emphasis" },
  { value: "risk_reduction", label: "Risk reduction" },
  { value: "authority_increase", label: "Authority increase" },
  { value: "clarity_simplification", label: "Clarity simplification" },
];

const MINIMUM_DELTA_OPTIONS: Array<{
  value: RewriteHypothesis["minimumDeltaLevel"];
  label: string;
}> = [
  { value: "light", label: "Light" },
  { value: "moderate", label: "Moderate" },
  { value: "strong", label: "Strong" },
];

const CONTROLLED_VARIABLE_OPTIONS: Array<{
  value: RewriteControlledVariable;
  label: string;
}> = [
  { value: "audience", label: "Audience" },
  { value: "tone", label: "Tone" },
  { value: "structure", label: "Structure" },
  { value: "value_prop", label: "Value proposition" },
  { value: "cta_type", label: "CTA type" },
  { value: "proof_points", label: "Proof points" },
  { value: "pricing_frame", label: "Pricing frame" },
];

const TREATMENT_VARIABLE_OPTIONS: Array<{
  value: RewriteTreatmentVariable;
  label: string;
}> = [
  { value: "headline", label: "Headline" },
  { value: "primary_cta", label: "Primary CTA" },
  { value: "objection_handling", label: "Objection handling" },
  { value: "differentiators", label: "Differentiators" },
  { value: "risk_reversal", label: "Risk reversal" },
  { value: "proof_depth", label: "Proof depth" },
  { value: "pricing_anchor", label: "Pricing anchor" },
];

export function RewriteInputPanel({
  value,
  strategy,
  hypothesis,
  refineMode,
  deltaInstructions,
  running,
  enforceSectionLabels,
  onChange,
  onStrategyChange,
  onHypothesisChange,
  onEnforceSectionLabelsChange,
  onDeltaInstructionsChange,
  onSubmit,
  onCancel,
}: RewriteInputPanelProps) {
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);

  const toggleEmphasis = (value: RewriteEmphasis) => {
    const exists = strategy.emphasis.includes(value);
    const next = exists
      ? strategy.emphasis.filter((item) => item !== value)
      : [...strategy.emphasis, value];
    onStrategyChange({ ...strategy, emphasis: next });
  };

  const toggleControlledVariable = (value: RewriteControlledVariable) => {
    const exists = hypothesis.controlledVariables.includes(value);
    const next = exists
      ? hypothesis.controlledVariables.filter((item) => item !== value)
      : [...hypothesis.controlledVariables, value];
    onHypothesisChange({ ...hypothesis, controlledVariables: next });
  };

  const toggleTreatmentVariable = (value: RewriteTreatmentVariable) => {
    const exists = hypothesis.treatmentVariables.includes(value);
    const next = exists
      ? hypothesis.treatmentVariables.filter((item) => item !== value)
      : [...hypothesis.treatmentVariables, value];
    onHypothesisChange({ ...hypothesis, treatmentVariables: next });
  };

  const InfoHelp = ({ label, hint }: { label: string; hint: string }) => (
    <span className="inline-flex items-center gap-1">
      <span>{label}</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex h-4 w-4 items-center justify-center text-muted-foreground hover:text-foreground focus-visible:outline-none"
            aria-label={`${label} help`}
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">{hint}</TooltipContent>
      </Tooltip>
    </span>
  );
  const sectionTemplate = buildSectionTemplate();
  const starterLabels = [
    "Hero",
    "Problem / Solution",
    "Features",
    "How It Works",
    "Testimonials / Case Studies",
    "Pricing",
    "FAQ",
    "Final CTA",
  ];
  const additionalSupportedLabels = getAllowedSectionLabels().filter(
    (label) => !starterLabels.includes(label),
  );
  const sectionLabelHint = [
    `Starter labels: ${starterLabels.map((label) => `${label}:`).join(" ")}`,
    additionalSupportedLabels.length > 0
      ? `Additional supported labels: ${additionalSupportedLabels.join(", ")}.`
      : null,
    "You can also use other section names if they fit your page.",
  ]
    .filter(Boolean)
    .join(" ");
  const hasSectionLabels = hasAnyAllowedSectionLabel(value.content ?? "");
  const showSectionLabelWarning =
    (value.content ?? "").trim().length > 0 &&
    !hasSectionLabels &&
    !enforceSectionLabels;
  const hasAdditionalValues =
    (strategy.audience ?? "").trim().length > 0 ||
    (strategy.constraints ?? "").trim().length > 0 ||
    (value.notes ?? "").trim().length > 0 ||
    refineMode;

  useEffect(() => {
    if (hasAdditionalValues) {
      setShowAdditionalFields(true);
    }
  }, [hasAdditionalValues]);

  return (
    <TooltipProvider>
      <div className="rounded-xl bg-transparent">
        <div className="grid gap-4">
          <div>
            <p className="mb-2 text-sm font-medium text-foreground/85">
              Website URL
            </p>
            <Input
              disabled={running}
              placeholder="https://example.com"
              value={value.websiteUrl ?? ""}
              onChange={(event) =>
                onChange(updateField(value, "websiteUrl", event.target.value))
              }
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground/85">
              Pasted content
            </p>
            <div className="mb-3 flex flex-wrap items-center gap-3 rounded-md border border-border/60 bg-secondary/20 p-3">
              <p className="text-xs text-muted-foreground">
                <InfoHelp
                  label="Use labeled sections for higher compare quality"
                  hint={sectionLabelHint}
                />
              </p>
              <Button
                type="button"
                size="xs"
                variant="outline"
                disabled={running}
                onClick={() => {
                  const current = value.content ?? "";
                  const next =
                    current.trim().length > 0
                      ? `${current.trimEnd()}\n\n${sectionTemplate}`
                      : sectionTemplate;
                  onChange(updateField(value, "content", next));
                }}
              >
                Insert section template
              </Button>
              <label className="inline-flex items-center gap-2 text-xs text-foreground/85">
                <Switch
                  checked={enforceSectionLabels}
                  disabled={running}
                  onCheckedChange={(checked) =>
                    onEnforceSectionLabelsChange(Boolean(checked))
                  }
                />
                Enforce section labels (recommended for team workflows)
              </label>
            </div>
            <Textarea
              disabled={running}
              rows={10}
              placeholder="Paste current homepage or pricing copy."
              value={value.content ?? ""}
              onChange={(event) =>
                onChange(updateField(value, "content", event.target.value))
              }
            />
            {showSectionLabelWarning ? (
              <p className="mt-2 text-xs text-amber-500">
                Section labels not detected. Compare quality may be reduced.
              </p>
            ) : null}
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground/90">
                Rewrite Strategy
              </p>
              <Button
                type="button"
                variant="outline"
                size="xs"
                disabled={running}
                onClick={() =>
                  setShowAdditionalFields((previous) => !previous)
                }
                aria-expanded={showAdditionalFields}
                aria-controls="rewrite-additional-fields"
              >
                {showAdditionalFields
                  ? "Hide additional fields"
                  : "Show additional fields"}
              </Button>
            </div>
            <div className="mt-3 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground/85">
                    Tone
                  </p>
                  <Select
                    value={strategy.tone}
                    onValueChange={(next) =>
                      onStrategyChange({
                        ...strategy,
                        tone: next as RewriteTone,
                      })
                    }
                    disabled={running}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground/85">
                    Audience (optional)
                  </p>
                  <Select
                    value={
                      strategy.audience && strategy.audience.length > 0
                        ? strategy.audience
                        : "unspecified"
                    }
                    onValueChange={(next) =>
                      onStrategyChange({
                        ...strategy,
                        audience: next === "unspecified" ? "" : next,
                      })
                    }
                    disabled={running}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unspecified">Not specified</SelectItem>
                      {AUDIENCE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-foreground/85">
                  Length
                </p>
                <div className="flex flex-wrap gap-2">
                  {LENGTH_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={
                        strategy.length === option.value ? "default" : "outline"
                      }
                      size="sm"
                      disabled={running}
                      onClick={() =>
                        onStrategyChange({ ...strategy, length: option.value })
                      }
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-foreground/85">
                  Emphasis
                </p>
                <div className="flex flex-wrap gap-2">
                  {EMPHASIS_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      size="sm"
                      variant={
                        strategy.emphasis.includes(option.value)
                          ? "default"
                          : "outline"
                      }
                      disabled={running}
                      onClick={() => toggleEmphasis(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 rounded-md border border-border/60 bg-secondary/15 p-3">
                <p className="text-sm font-semibold text-foreground/90">
                  Hypothesis
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-2 text-sm font-medium text-foreground/85">
                      Type
                    </p>
                    <Select
                      value={hypothesis.type}
                      onValueChange={(next) =>
                        onHypothesisChange({
                          ...hypothesis,
                          type: next as RewriteHypothesisType,
                        })
                      }
                      disabled={running}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HYPOTHESIS_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-foreground/85">
                      Minimum delta
                    </p>
                    <Select
                      value={hypothesis.minimumDeltaLevel}
                      onValueChange={(next) =>
                        onHypothesisChange({
                          ...hypothesis,
                          minimumDeltaLevel:
                            next as RewriteHypothesis["minimumDeltaLevel"],
                        })
                      }
                      disabled={running}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MINIMUM_DELTA_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground/85">
                    Controlled variables (keep fixed)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {CONTROLLED_VARIABLE_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        size="sm"
                        variant={
                          hypothesis.controlledVariables.includes(option.value)
                            ? "default"
                            : "outline"
                        }
                        disabled={running}
                        onClick={() => toggleControlledVariable(option.value)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Select at least 2 controlled variables.
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground/85">
                    Treatment variables (must change)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TREATMENT_VARIABLE_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        size="sm"
                        variant={
                          hypothesis.treatmentVariables.includes(option.value)
                            ? "default"
                            : "outline"
                        }
                        disabled={running}
                        onClick={() => toggleTreatmentVariable(option.value)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Select at least 1 treatment variable.
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground/85">
                    Success criteria
                  </p>
                  <Input
                    disabled={running}
                    maxLength={280}
                    placeholder="Describe what this treatment should improve."
                    value={hypothesis.successCriteria}
                    onChange={(event) =>
                      onHypothesisChange({
                        ...hypothesis,
                        successCriteria: event.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {showAdditionalFields ? (
                <div
                  id="rewrite-additional-fields"
                  className="space-y-4 rounded-md border border-border/60 bg-secondary/15 p-3"
                >
                  <div>
                    <p className="mb-2 text-sm font-medium text-foreground/85">
                      <InfoHelp
                        label="Constraints (optional, hard requirements)"
                        hint='Non-negotiables the rewrite must follow. Example: "Avoid discount language. Keep claims under 12 words."'
                      />
                    </p>
                    <p className="mb-2 text-xs text-muted-foreground">
                      Non-negotiables the rewrite must follow (must include/avoid).
                    </p>
                    <Textarea
                      disabled={running}
                      rows={3}
                      maxLength={500}
                      placeholder="Must include/avoid..."
                      value={strategy.constraints ?? ""}
                      onChange={(event) =>
                        onStrategyChange({
                          ...strategy,
                          constraints: event.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium text-foreground/85">
                      <InfoHelp
                        label="Context notes (optional, guidance)"
                        hint='Background context to guide tone and emphasis. Example: "Launching to RevOps teams after Product Hunt week."'
                      />
                    </p>
                    <p className="mb-2 text-xs text-muted-foreground">
                      Background context and priorities to guide tone and emphasis.
                    </p>
                    <Textarea
                      disabled={running}
                      rows={3}
                      placeholder="Business context, goals, objections, or campaign nuance."
                      value={value.notes ?? ""}
                      onChange={(event) =>
                        onChange(updateField(value, "notes", event.target.value))
                      }
                    />
                  </div>

                  {refineMode ? (
                    <div id="rewrite-delta-instructions">
                      <p className="mb-2 text-sm font-medium text-foreground/85">
                        Delta instructions (refine)
                      </p>
                      <Textarea
                        disabled={running}
                        rows={3}
                        placeholder="Specify exactly what to improve from the current rewrite."
                        value={deltaInstructions}
                        onChange={(event) =>
                          onDeltaInstructionsChange(event.target.value)
                        }
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={onSubmit} disabled={running}>
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {running ? "Generating..." : "Generate rewrite"}
          </Button>
          {running ? (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
        </div>
      </div>
    </TooltipProvider>
  );
}
