"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { updateSettingsAction } from "@/app/actions/settings/updateSettings";
import type { UserSettingsRecord } from "@/features/settings/services/userSettingsService";
import type { UserSettingsPayload } from "@/features/settings/validators/userSettingsSchema";

type NotificationKey =
  | "weekly_exec_summary"
  | "completion_alerts"
  | "overlap_warnings";

type SettingsNotificationsPanelProps = {
  initialSettings: UserSettingsRecord;
  hasSubscription: boolean;
};

export function NotificationsPanel({
  initialSettings,
  hasSubscription,
}: SettingsNotificationsPanelProps) {
  const [settings, setSettings] = useState<UserSettingsRecord>(initialSettings);
  const [savingKey, setSavingKey] = useState<NotificationKey | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  const handleToggle = async (key: NotificationKey, value: boolean) => {
    setSavingKey(key);
    setSaveError(null);

    const payload = { [key]: value } as UserSettingsPayload;
    const result = await updateSettingsAction(payload);

    if (result.error || !result.settings) {
      const message = result.error ?? "Unable to update settings.";
      setSaveError(message);
      setSavingKey(null);
      return;
    }

    setSettings(result.settings as UserSettingsRecord);
    setSavingKey(null);
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Notifications
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasSubscription
              ? "Keep revenue stakeholders aligned with your audit cadence."
              : "Subscription required to enable notifications."}
          </p>
        </div>
        <Badge variant={hasSubscription ? "secondary" : "outline"}>
          {hasSubscription ? "Active" : "Inactive"}
        </Badge>
      </div>
      <div className="mt-4 space-y-4 text-sm text-foreground">
        <NotificationToggle
          label="Weekly executive summary"
          description="Summarize recent audits for stakeholders."
          checked={hasSubscription && settings.weekly_exec_summary}
          onChange={(value) => {
            void handleToggle("weekly_exec_summary", value);
          }}
          disabled={savingKey === "weekly_exec_summary"}
        />
        <NotificationToggle
          label="Report completion alerts"
          description="Notify when new conversion gap reports complete."
          checked={hasSubscription && settings.completion_alerts}
          onChange={(value) => {
            void handleToggle("completion_alerts", value);
          }}
          disabled={savingKey === "completion_alerts"}
        />
        <NotificationToggle
          label="Competitor overlap warnings"
          description="Highlight overlap spikes when audits run."
          checked={hasSubscription && settings.overlap_warnings}
          onChange={(value) => {
            void handleToggle("overlap_warnings", value);
          }}
          disabled={savingKey === "overlap_warnings"}
        />
        {!hasSubscription ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-medium text-foreground">
              Unlock notifications with a subscription
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Enable real-time alerts, weekly summaries, and stakeholder reports
              to stay aligned on conversion opportunities.
            </p>
            <Button asChild className="mt-3 w-full">
              <Link href="/dashboard/billing">View plans</Link>
            </Button>
          </div>
        ) : null}
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/40 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">
              Billing and usage thresholds
            </p>
            <p className="text-xs text-muted-foreground">
              Always enabled for account safety.
            </p>
          </div>
          <Switch checked disabled />
        </div>
        {saveError ? (
          <p className="text-xs text-destructive">{saveError}</p>
        ) : null}
      </div>
    </div>
  );
}

type NotificationToggleProps = {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
};

function NotificationToggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: NotificationToggleProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/40 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}
