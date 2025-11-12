export type Metric =
  | "Stress"
  | "Happy"
  | "Loneliness"
  | "Anxiety"
  | "Energy"
  | "EnvBeauty"
  | "EnvInteresting"
  | "EnvSafety"
  | "EnvCrowded"
  | "EnvironmentGreeness";

export type Place = "drinnen" | "draussen" | "oepnv";

export type RadarData = Record<string, number>;

export type HexPlaceData = {
  metrics: Record<Metric, number | null>;
  n: number | null;
};

export type HexData = Partial<Record<Place, HexPlaceData>>;

export type HexAggregated = {
  hexId: string;
  value: number | null;
  n: number;
  hasData: boolean;
  passesFilter: boolean;
  visible: boolean;
  places: Record<Place, { value: number | null; n: number | null }>;
};

export type MetricGroupKey = "emotionen" | "umwelt" | "daten";
