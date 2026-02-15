export type PositioningMapAxes = {
  xLabel: string;
  yLabel: string;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

export type PositioningMapPoint = {
  label: string;
  x: number;
  y: number;
  summary?: string;
};

export type PositioningMapData = {
  axes: PositioningMapAxes;
  points: PositioningMapPoint[];
  insights: string[];
};

export type PositioningMapResponse = {
  reportId: string;
  status: string;
  positioning: PositioningMapData | null;
};
