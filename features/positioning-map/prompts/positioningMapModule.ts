import type { PositioningMapData } from "@/features/positioning-map/types/positioningMap.types";

export function positioningMapModule(input: unknown) {
  const schema: PositioningMapData = {
    axes: {
      xLabel: "Clarity",
      yLabel: "Differentiation",
      xMin: 0,
      xMax: 100,
      yMin: 0,
      yMax: 100,
    },
    points: [{ label: "Your brand", x: 50, y: 50, summary: "" }],
    insights: [""],
  };

  return {
    name: "positioning-map",
    system:
      "You are a positioning strategist. Return ONLY valid JSON matching the schema.",
    user: JSON.stringify({ input, schema }),
    schema,
  };
}
