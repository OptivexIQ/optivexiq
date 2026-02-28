"use client";
import * as React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RewriteGenerateRequest } from "@/features/rewrites/types/rewrites.types";

export type StudioGoal = "conversion" | "clarity" | "differentiation";
type StudioTarget = RewriteGenerateRequest["rewriteType"];
type StudioSelectValue = StudioTarget | StudioGoal;
type IcpSelectValue = "profile" | "custom" | "add_custom";

const GOAL_OPTIONS: Array<{ value: StudioGoal; label: string }> = [
  { value: "conversion", label: "Conversion" },
  { value: "clarity", label: "Clarity" },
  { value: "differentiation", label: "Differentiation" },
];

const TARGET_OPTIONS: Array<{ value: StudioTarget; label: string }> = [
  { value: "homepage", label: "Homepage" },
  { value: "pricing", label: "Pricing" },
];

const DEFAULT_CONTEXT = {
  rewriteType: "homepage" as StudioTarget,
  useCustomIcp: false,
  goal: "conversion" as StudioGoal,
  differentiationFocus: true,
  objectionFocus: false,
};

type ControlSelectProps<T extends StudioSelectValue> = {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  disabled?: boolean;
  onChange: (value: T) => void;
};

function ControlSelect<T extends StudioSelectValue>({
  label,
  value,
  options,
  disabled,
  onChange,
}: ControlSelectProps<T>) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border/60 bg-card px-2.5 py-1.5">
      <span className="text-[11px] font-semibold capitalize tracking-[0.12em] text-[hsl(216_28%_63%)]">
        {label}
      </span>
      <Select
        value={value}
        disabled={disabled}
        onValueChange={(next) => onChange(next as T)}
      >
        <SelectTrigger className="h-6 min-w-32 border-0 bg-transparent px-0 py-0 text-[13px] font-semibold text-foreground shadow-none focus:ring-0 focus:ring-offset-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

type RewriteStudioControlBarProps = {
  profileIcp: string;
  rewriteType: RewriteGenerateRequest["rewriteType"];
  useCustomIcp: boolean;
  customIcp: string;
  goal: StudioGoal;
  differentiationFocus: boolean;
  objectionFocus: boolean;
  disabled?: boolean;
  onRewriteTypeChange: (value: RewriteGenerateRequest["rewriteType"]) => void;
  onUseCustomIcpChange: (value: boolean) => void;
  onCustomIcpChange: (value: string) => void;
  onGoalChange: (value: StudioGoal) => void;
  onDifferentiationFocusChange: (value: boolean) => void;
  onObjectionFocusChange: (value: boolean) => void;
  onResetContext: () => void;
};

export function RewriteStudioControlBar({
  profileIcp,
  rewriteType,
  useCustomIcp,
  customIcp,
  goal,
  differentiationFocus,
  objectionFocus,
  disabled,
  onRewriteTypeChange,
  onUseCustomIcpChange,
  onCustomIcpChange,
  onGoalChange,
  onDifferentiationFocusChange,
  onObjectionFocusChange,
  onResetContext,
}: RewriteStudioControlBarProps) {
  const [customIcpDialogOpen, setCustomIcpDialogOpen] = React.useState(false);
  const [customIcpDraft, setCustomIcpDraft] = React.useState(customIcp);
  const selectedTargetLabel =
    TARGET_OPTIONS.find((option) => option.value === rewriteType)?.label ??
    "Homepage";
  const selectedIcpLabel = useCustomIcp
    ? customIcp.trim() || "Custom ICP"
    : profileIcp;
  const selectedGoalLabel =
    GOAL_OPTIONS.find((option) => option.value === goal)?.label ?? "Conversion";
  const isDefaultContext =
    rewriteType === DEFAULT_CONTEXT.rewriteType &&
    useCustomIcp === DEFAULT_CONTEXT.useCustomIcp &&
    goal === DEFAULT_CONTEXT.goal &&
    differentiationFocus === DEFAULT_CONTEXT.differentiationFocus &&
    objectionFocus === DEFAULT_CONTEXT.objectionFocus;
  const hasCustomIcp = customIcp.trim().length > 0;
  const selectedIcpValue: IcpSelectValue =
    useCustomIcp && hasCustomIcp ? "custom" : "profile";

  React.useEffect(() => {
    if (!customIcpDialogOpen) {
      return;
    }
    setCustomIcpDraft(customIcp);
  }, [customIcp, customIcpDialogOpen]);

  const handleIcpSelection = (value: IcpSelectValue) => {
    if (value === "add_custom") {
      setCustomIcpDialogOpen(true);
      return;
    }

    if (value === "profile") {
      onUseCustomIcpChange(false);
      return;
    }

    if (value === "custom" && hasCustomIcp) {
      onUseCustomIcpChange(true);
    }
  };

  const handleAddCustomIcp = () => {
    const normalized = customIcpDraft.trim().replace(/\s+/g, " ");
    if (normalized.length === 0) {
      return;
    }

    onCustomIcpChange(normalized);
    onUseCustomIcpChange(true);
    setCustomIcpDialogOpen(false);
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card p-3">
      <div className="flex flex-wrap items-center gap-3">
        <ControlSelect
          label="Target"
          value={rewriteType}
          options={TARGET_OPTIONS}
          disabled={disabled}
          onChange={onRewriteTypeChange}
        />
        <ControlSelect
          label="Goal"
          value={goal}
          options={GOAL_OPTIONS}
          disabled={disabled}
          onChange={onGoalChange}
        />

        <div className="flex items-center gap-2 rounded-md border border-border/60 bg-card px-2.5 py-1.5">
          <span className="text-[11px] font-semibold capitalize tracking-[0.12em] text-[hsl(216_28%_63%)]">
            ICP
          </span>
          <Select
            value={selectedIcpValue}
            disabled={disabled}
            onValueChange={(next) => handleIcpSelection(next as IcpSelectValue)}
          >
            <SelectTrigger className="h-6 min-w-40 border-0 bg-transparent px-0 py-0 text-[13px] font-semibold text-foreground shadow-none focus:ring-0 focus:ring-offset-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="profile">{profileIcp}</SelectItem>
              {hasCustomIcp ? (
                <SelectItem value="custom">{customIcp}</SelectItem>
              ) : null}
              <SelectItem value="add_custom">+ Add custom ICP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-5">
          <label className="inline-flex items-center gap-2 text-[13px] font-medium text-[hsl(214_30%_90%)]">
            <Switch
              checked={differentiationFocus}
              disabled={disabled}
              onCheckedChange={onDifferentiationFocusChange}
              aria-label="Toggle differentiation focus"
            />
            Differentiation
          </label>
          <label className="inline-flex items-center gap-2 text-[13px] font-medium text-[hsl(214_30%_90%)]">
            <Switch
              checked={objectionFocus}
              disabled={disabled}
              onCheckedChange={onObjectionFocusChange}
              aria-label="Toggle objection focus"
            />
            Objection Focus
          </label>
        </div>
      </div>

      {!isDefaultContext ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/50 pt-3">
          <span className="text-xs font-medium text-muted-foreground">
            Active context:
          </span>
          <Badge variant="secondary" className="text-xs">
            Target: {selectedTargetLabel}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            ICP: {selectedIcpLabel}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Goal: {selectedGoalLabel}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Differentiation: {differentiationFocus ? "On" : "Off"}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Objection Focus: {objectionFocus ? "On" : "Off"}
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            className="ml-auto h-7 px-2 text-xs"
            onClick={onResetContext}
          >
            Reset
          </Button>
        </div>
      ) : null}

      <Dialog open={customIcpDialogOpen} onOpenChange={setCustomIcpDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add custom ICP</DialogTitle>
            <DialogDescription>
              Add a one-off ICP override for this rewrite run.
            </DialogDescription>
          </DialogHeader>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              ICP
            </label>
            <Input
              value={customIcpDraft}
              maxLength={100}
              placeholder="e.g. Head of Revenue Operations at B2B SaaS"
              onChange={(event) => setCustomIcpDraft(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCustomIcpDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddCustomIcp}
              disabled={customIcpDraft.trim().length === 0}
            >
              Add ICP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
