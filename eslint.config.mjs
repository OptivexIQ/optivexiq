import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const config = [
  {
    ignores: ["node_modules/**", ".next/**", "dist/**"],
  },
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs,cjs}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/features/conversion-gap/services/gapDetectionService",
              message:
                "gapDetectionService is removed from primary execution path and must not be reintroduced.",
            },
            {
              name: "@/features/objection-engine/services/objectionEngineService",
              message:
                "objectionEngineService is removed; use AI-backed objectionAnalysisModule only.",
            },
            {
              name: "@/features/differentiation-builder/ai/positioningAnalysisModule",
              message:
                "positioningAnalysisModule is removed; use competitiveInsightsSynthesisModule via differentiationBuilderService.",
            },
            {
              name: "@/features/positioning-map/prompts/positioningMapModule",
              message:
                "positioningMapModule prompt stub is removed; use canonical positioning map generation services.",
            },
          ],
        },
      ],
    },
  },
  ...compat.extends("next", "next/core-web-vitals"),
];

export default config;
