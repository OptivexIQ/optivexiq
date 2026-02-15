export type SettingsSectionItem = {
  label: string;
  value: string;
  helper?: string;
};

export type SettingsSection = {
  title: string;
  description: string;
  items: SettingsSectionItem[];
};

export type SettingsData = {
  headline: string;
  sections: SettingsSection[];
  security: {
    status: string;
    note: string;
  };
  notifications: {
    title: string;
    description: string;
    items: string[];
  };
};
