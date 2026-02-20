"use client";

import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { RewriteGenerateRequest, RewriteType } from "@/features/rewrites/types/rewrites.types";
import { RewriteTypePicker } from "@/features/rewrites/components/RewriteTypePicker";

type RewriteInputPanelProps = {
  value: RewriteGenerateRequest;
  running: boolean;
  error: string | null;
  onChange: (value: RewriteGenerateRequest) => void;
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

export function RewriteInputPanel({
  value,
  running,
  error,
  onChange,
  onSubmit,
  onCancel,
}: RewriteInputPanelProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <p className="text-sm font-semibold text-foreground/85">Rewrite request</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Provide a website URL, pasted copy, or both. URL or content is required.
      </p>

      <div className="mt-4">
        <RewriteTypePicker
          value={(value.rewriteType ?? "homepage") as RewriteType}
          onChange={(rewriteType) => onChange({ ...value, rewriteType })}
          disabled={running}
        />
      </div>

      <div className="mt-4 grid gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-foreground/85">Website URL</p>
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
      </div>

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <Button onClick={onSubmit} disabled={running}>
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
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

