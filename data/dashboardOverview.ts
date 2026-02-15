export type OverviewReport = {
  id: string;
  site: string;
  score: number;
  status: "Complete" | "Running" | "Queued" | "Failed";
  date: string;
};

export type OverviewData = {
  headline: string;
  summary: {
    gapScore: number;
    activeReports: number;
    competitorCoverage: string;
    conversionFocus: string;
    usageUsed: number;
    usageLimit: number;
    usageUnlimited: boolean;
    hasSubscription: boolean;
  };
  reports: OverviewReport[];
  nextAction: {
    title: string;
    description: string;
  };
};

export const mockOverviewData: OverviewData = {
  headline: "Your SaaS Conversion Overview",
  summary: {
    gapScore: 34,
    activeReports: 6,
    competitorCoverage: "5 of 8",
    conversionFocus: "Trials",
    usageUsed: 7,
    usageLimit: 12,
    usageUnlimited: false,
    hasSubscription: true,
  },
  reports: [
    {
      id: "rep_112",
      site: "acme-saas.com",
      score: 34,
      status: "Complete",
      date: "Feb 08, 2026",
    },
    {
      id: "rep_111",
      site: "northwind.ai",
      score: 47,
      status: "Complete",
      date: "Feb 06, 2026",
    },
    {
      id: "rep_110",
      site: "vectorpay.io",
      score: 29,
      status: "Running",
      date: "Feb 06, 2026",
    },
    {
      id: "rep_109",
      site: "signalops.co",
      score: 52,
      status: "Complete",
      date: "Feb 03, 2026",
    },
    {
      id: "rep_108",
      site: "gridline.dev",
      score: 41,
      status: "Queued",
      date: "Feb 02, 2026",
    },
  ],
  nextAction: {
    title: "Pricing overlap detected",
    description:
      "Your pricing page overlaps with two competitors. Run a pricing rewrite to clarify your value anchors.",
  },
};

export function getDashboardOverviewData(): OverviewData {
  return mockOverviewData;
}
