import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  SnapshotPdfTemplate,
  type SnapshotPdfProps,
} from "@/features/free-snapshot/pdf/SnapshotPdfTemplate";

export function renderSnapshotHtml(props: SnapshotPdfProps): string {
  const markup = renderToStaticMarkup(
    React.createElement(SnapshotPdfTemplate, props),
  );

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>OptivexIQ Free Conversion Audit</title>
    <style>
      @page { margin: 20mm; size: A4; }

      :root {
        color-scheme: light;
      }

      * {
        box-sizing: border-box;
      }

      html, body {
        margin: 0;
        padding: 0;
      }

      body {
        font-family:
          "IBM Plex Sans",
          "Inter",
          "Segoe UI",
          -apple-system,
          BlinkMacSystemFont,
          "Helvetica Neue",
          Arial,
          sans-serif;
        background: #ffffff;
        color: #0f172a;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .snapshot-root {
        width: 100%;
        max-width: 800px;
        margin: 0 auto;
      }

      .page-break {
        break-before: page;
        page-break-before: always;
      }

      @media print {
        body {
          margin: 0;
        }
      }
    </style>
  </head>
  <body>
    <div class="snapshot-root">
      ${markup}
    </div>
  </body>
</html>`;
}
