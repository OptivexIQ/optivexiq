export type ReleaseCategory = "New" | "Improved" | "Fixed" | "Security" | "Operational";

export type ReleaseSection = {
  label: ReleaseCategory;
  items: string[];
};

export type ReleaseEntry = {
  version: string;
  date: string;
  summary: string;
  sections: ReleaseSection[];
};

export const whatsNewReleases: ReleaseEntry[] = [
  {
    version: "v1.9.0",
    date: "February 17, 2026",
    summary: "Clearer public documentation and stronger contact reliability",
    sections: [
      {
        label: "New",
        items: [
          "Published customer-facing pages for Help Center, Terms, Privacy, Status, About, and Contact.",
          "Improved access to core policy and support information across the marketing site.",
        ],
      },
      {
        label: "Improved",
        items: [
          "Refined contact submission flow to improve request quality and reduce failed submissions.",
        ],
      },
      {
        label: "Operational",
        items: [
          "Added stronger abuse protections to keep contact channels reliable for legitimate users.",
        ],
      },
    ],
  },
  {
    version: "v1.8.0",
    date: "February 16, 2026",
    summary: "More dependable Free Conversion Audit experience",
    sections: [
      {
        label: "Improved",
        items: [
          "Users now get clearer analysis progress and more reliable status updates during snapshot generation.",
          "Completion and failure handling were refined to reduce confusion during long-running requests.",
        ],
      },
      {
        label: "Fixed",
        items: [
          "Improved reliability for snapshot PDF delivery and follow-up email delivery.",
        ],
      },
    ],
  },
  {
    version: "v1.7.0",
    date: "February 14, 2026",
    summary: "Improved report consistency across new and existing analyses",
    sections: [
      {
        label: "Improved",
        items: [
          "Report output structure is now more consistent across the dashboard and related report views.",
          "Compatibility handling for historical report records was improved to reduce read inconsistencies.",
        ],
      },
      {
        label: "Fixed",
        items: [
          "Resolved data-shape issues that could cause unexpected differences between older and newer reports.",
        ],
      },
    ],
  },
  {
    version: "v1.6.0",
    date: "February 10, 2026",
    summary: "Higher reliability for report generation under load",
    sections: [
      {
        label: "Improved",
        items: [
          "Report processing is now more dependable during peak usage and longer-running analyses.",
          "Status updates are more predictable from submission through completion.",
        ],
      },
      {
        label: "Fixed",
        items: [
          "Reduced likelihood of stalled analyses by improving processing continuity and failure handling.",
        ],
      },
      {
        label: "Operational",
        items: [
          "Improved internal processing resilience to support more stable day-to-day report delivery.",
        ],
      },
    ],
  },
];
