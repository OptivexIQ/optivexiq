"use client";

import { Loader2, Sparkles } from "lucide-react";
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
import type {
  RewriteEmphasis,
  RewriteGenerateRequest,
  RewriteLength,
  RewriteStrategy,
  RewriteTone,
} from "@/features/rewrites/types/rewrites.types";

type RewriteInputPanelProps = {
  value: RewriteGenerateRequest;
  strategy: RewriteStrategy;
  refineMode: boolean;
  deltaInstructions: string;
  running: boolean;
  onChange: (value: RewriteGenerateRequest) => void;
  onStrategyChange: (value: RewriteStrategy) => void;
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

export function RewriteInputPanel({
  value,
  strategy,
  refineMode,
  deltaInstructions,
  running,
  onChange,
  onStrategyChange,
  onDeltaInstructionsChange,
  onSubmit,
  onCancel,
}: RewriteInputPanelProps) {
  const toggleEmphasis = (value: RewriteEmphasis) => {
    const exists = strategy.emphasis.includes(value);
    const next = exists
      ? strategy.emphasis.filter((item) => item !== value)
      : [...strategy.emphasis, value];
    onStrategyChange({ ...strategy, emphasis: next });
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <p className="text-sm font-semibold text-foreground/85">
        Rewrite request
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Provide a website URL, pasted copy, or both. URL or content is required.
      </p>

      <div className="mt-4 grid gap-4">
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
          <Textarea
            disabled={running}
            rows={10}
            placeholder="Paste current homepage or pricing copy."
            value={value.content ?? ""}
            onChange={(event) =>
              onChange(updateField(value, "content", event.target.value))
            }
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground/90">
            Rewrite Strategy
          </p>
          <div className="mt-3 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-medium text-foreground/85">
                  Tone
                </p>
                <Select
                  value={strategy.tone}
                  onValueChange={(next) =>
                    onStrategyChange({ ...strategy, tone: next as RewriteTone })
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

            <div>
              <p className="mb-2 text-sm font-medium text-foreground/85">
                Constraints (optional)
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

          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-foreground/85">
            Notes (optional)
          </p>
          <Textarea
            disabled={running}
            rows={3}
            placeholder="Any constraints, tone requirements, or messaging goals."
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
              onChange={(event) => onDeltaInstructionsChange(event.target.value)}
            />
          </div>
        ) : null}
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
  );
}
