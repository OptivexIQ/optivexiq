import type { PositioningMapData } from "@/features/positioning-map/types/positioningMap.types";

export const mockPositioningMap: PositioningMapData = {
  axes: {
    xLabel: "Messaging clarity",
    yLabel: "Differentiation strength",
    xMin: 0,
    xMax: 100,
    yMin: 0,
    yMax: 100,
  },
  points: [
    {
      label: "OptivexIQ",
      x: 72,
      y: 81,
      summary: "Clear revenue outcome framing with strong proof density.",
    },
    {
      label: "Northwind",
      x: 54,
      y: 46,
      summary: "Feature-led narrative with limited differentiation signals.",
    },
    {
      label: "VectorPay",
      x: 43,
      y: 39,
      summary: "Pricing clarity is solid, but category language is generic.",
    },
    {
      label: "SignalOps",
      x: 61,
      y: 52,
      summary:
        "Strong positioning wedge, but benefits are diluted by copy volume.",
    },
  ],
  insights: [
    "Differentiation is strongest when you lead with revenue protection and risk reduction.",
    "Competitors cluster in the middle of the map with generic AI copy framing.",
    "Positioning clarity climbs when you anchor proof and buyer role above the fold.",
  ],
};

export function getPositioningMapData(): PositioningMapData {
  return mockPositioningMap;
}
