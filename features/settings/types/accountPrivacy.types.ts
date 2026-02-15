import type { UserSettingsPayload } from "@/features/settings/validators/userSettingsSchema";

type SettingsFieldKey = keyof UserSettingsPayload;

export type SettingsItem = {
  key: SettingsFieldKey;
  label: string;
  value: string;
  helper?: string;
  type: "text" | "email" | "number" | "boolean";
  rawValue: string | number | boolean;
  description?: string;
  placeholder?: string;
};

export type SettingsSection = {
  title: string;
  description: string;
  items: SettingsItem[];
};

export type SettingsFieldKeyType = SettingsFieldKey;
