"use client";

import { useEffect, useMemo, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { updateSettingsAction } from "@/app/actions/settings/updateSettings";
import type { UserSettingsRecord } from "@/features/settings/services/userSettingsService";
import type { UserSettingsPayload } from "@/features/settings/validators/userSettingsSchema";
import {
  type SettingsFieldKeyType,
  type SettingsSection,
} from "@/features/settings/types/accountPrivacy.types";
import { SettingsItem } from "@/features/settings/components/SettingsItem";
import { MARKET_REGIONS } from "@/lib/constants/marketRegions";
import { BILLING_CURRENCIES } from "@/features/billing/types/billing.types";

type SettingsAccountPrivacyPanelProps = {
  initialSettings: UserSettingsRecord;
};

function formatRetentionHelper(days: number) {
  return `Stored reports are auto-archived after ${days} days.`;
}

function formatWorkspaceAccessHelper(restricted: boolean) {
  return restricted
    ? "Only admins can export reports."
    : "Exports are available to workspace members.";
}

function toInputString(value: string | null) {
  return value ?? "";
}

function toNullableString(value: string) {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function AccountPrivacyPanel({
  initialSettings,
}: SettingsAccountPrivacyPanelProps) {
  const [settings, setSettings] = useState<UserSettingsRecord>(initialSettings);
  const [savingKey, setSavingKey] = useState<SettingsFieldKeyType | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  const sections = useMemo<SettingsSection[]>(() => {
    const retentionDays = Math.max(1, settings.report_retention_days);

    return [
      {
        title: "Account",
        description: "Identity and workspace defaults for OptivexIQ.",
        items: [
          {
            key: "workspace_name",
            label: "Workspace name",
            value: settings.workspace_name ?? "",
            helper: "Shown on reports and executive summaries.",
            type: "text",
            rawValue: toInputString(settings.workspace_name),
            placeholder: "",
          },
          {
            key: "primary_contact",
            label: "Primary contact",
            value: settings.primary_contact ?? "",
            helper: "Used for billing and operational alerts.",
            type: "email",
            rawValue: toInputString(settings.primary_contact),
            placeholder: "",
          },
          {
            key: "region",
            label: "Primary market region",
            value: settings.region ?? "Not set",
            helper:
              "Used for market messaging, compliance framing, and conversion modeling.",
            type: "select",
            rawValue: toInputString(settings.region),
            placeholder: "Select primary market region",
            options: MARKET_REGIONS,
          },
          {
            key: "currency",
            label: "Primary currency",
            value: settings.currency,
            helper:
              "Used to format ACV and revenue range labels across profile and reports.",
            type: "select",
            rawValue: settings.currency,
            placeholder: "Select primary currency",
            options: BILLING_CURRENCIES,
          },
        ],
      },
      {
        title: "Data & privacy",
        description:
          "Control data retention and how your audits are stored and shared.",
        items: [
          {
            key: "report_retention_days",
            label: "Report retention",
            value: `${retentionDays} days`,
            helper: formatRetentionHelper(retentionDays),
            type: "number",
            rawValue: retentionDays,
            description: "Retention days must be between 1 and 3650.",
          },
          {
            key: "export_restricted",
            label: "Workspace access",
            value: settings.export_restricted ? "Restricted" : "Open",
            helper: formatWorkspaceAccessHelper(settings.export_restricted),
            type: "boolean",
            rawValue: settings.export_restricted,
          },
        ],
      },
    ];
  }, [settings]);

  const handleSave = async (
    key: SettingsFieldKeyType,
    value: string | number | boolean,
  ) => {
    setSavingKey(key);
    setSaveError(null);

    let payload: UserSettingsPayload = {};

    if (
      key === "workspace_name" ||
      key === "primary_contact" ||
      key === "region"
    ) {
      payload = { [key]: toNullableString(String(value)) };
    } else if (key === "currency") {
      payload = { [key]: String(value).toUpperCase() as UserSettingsPayload["currency"] };
    } else if (key === "report_retention_days") {
      const numeric = Number(value);
      if (!Number.isFinite(numeric) || numeric < 1) {
        const message = "Retention days must be at least 1.";
        setSaveError(message);
        setSavingKey(null);
        return message;
      }
      payload = { [key]: Math.round(numeric) };
    } else if (key === "export_restricted") {
      payload = { [key]: Boolean(value) };
    }

    const result = await updateSettingsAction(payload);

    if (result.error || !result.settings) {
      const message = result.error ?? "Unable to update settings.";
      setSaveError(message);
      setSavingKey(null);
      return message;
    }

    setSettings(result.settings as UserSettingsRecord);
    setSavingKey(null);
    return null;
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <div className="space-y-5">
        {sections.map((section, index) => (
          <div key={section.title} className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {section.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {section.description}
              </p>
            </div>
            <div className="grid gap-3">
              {section.items.map((item) => (
                <SettingsItem
                  key={item.label}
                  item={item}
                  onSave={handleSave}
                  saving={savingKey === item.key}
                />
              ))}
            </div>
            {index < sections.length - 1 ? (
              <Separator className="bg-border/60" />
            ) : null}
          </div>
        ))}
      </div>
      {saveError ? (
        <p className="mt-4 text-xs text-destructive">{saveError}</p>
      ) : null}
    </div>
  );
}
