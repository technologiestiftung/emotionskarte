import type { Metric, MetricGroupKey, Place } from "./types";

export const METRIC_GROUPS: Record<
  Exclude<MetricGroupKey, "daten">,
  Metric[]
> = {
  emotionen: ["Stress", "Happy", "Loneliness", "Anxiety", "Energy"],
  umwelt: [
    "EnvBeauty",
    "EnvInteresting",
    "EnvSafety",
    "EnvCrowded",
    "EnvironmentGreeness",
  ],
};

export const PLACE_LABELS: Record<Place, string> = {
  total: "Total",
  drinnen: "Drinnen",
  draussen: "Draußen",
  oepnv: "ÖPNV",
};

export const DEFAULT_PLACE: Place = "total";

export const METRIC_LABELS: Record<Metric, string> = {
  Stress: "Stress",
  Happy: "Freude",
  Loneliness: "Einsamkeit",
  Anxiety: "Angst",
  Energy: "Vitalität",
  EnvBeauty: "Schönheit",
  EnvInteresting: "Interessant",
  EnvSafety: "Sicherheit",
  EnvCrowded: "Andrang",
  EnvironmentGreeness: "Grünflächen",
};

export const METRIC_LABELS_VERBS: Record<Metric, string> = {
  Stress: "gestresst",
  Happy: "glücklich",
  Loneliness: "einsam",
  Anxiety: "ängstlich",
  Energy: "vital",
  EnvBeauty: "schön",
  EnvInteresting: "interessant",
  EnvSafety: "sicher",
  EnvCrowded: "überfüllt",
  EnvironmentGreeness: "grün",
};

export const DEFAULT_METRIC: Metric = "Happy";

export const PMTILES_ARCHIVE_PATH = "berlin-h3-res8.pmtiles";
export const PMTILES_ARCHIVE = `pmtiles:///${PMTILES_ARCHIVE_PATH}`;
export const PMTILES_BASE_PATH = PMTILES_ARCHIVE;
export const H3_SOURCE_ID = "h3";
export const H3_SOURCE_NAME = H3_SOURCE_ID;
export const H3_POLYGON_LAYER = "h3";
export const H3_HEX_LAYER = H3_POLYGON_LAYER;
export const H3_CENTROID_LAYER = "h3_centroids";

export const MAP_INITIAL_VIEW = {
  center: [13.404954, 52.520008] as [number, number],
  zoom: 10,
};

export const COLOR_RAMP_Energy: { value: number; color: string }[] = [
  { value: 1, color: "#CDFEF9" },
  { value: 2, color: "#91FDF2" },
  { value: 3, color: "#05F2DB" },
  { value: 4, color: "#04BEAC" },
  { value: 5, color: "#038276" },
];

export const COLOR_RAMP_Happy: { value: number; color: string }[] = [
  { value: 1, color: "#FFFAE5" },
  { value: 2, color: "#FFF3C2" },
  { value: 3, color: "#FBE792" },
  { value: 4, color: "#F8D130" },
  { value: 5, color: "#856C04" },
];

export const COLOR_RAMP_Stress: { value: number; color: string }[] = [
  { value: 1, color: "#FAE6DB" },
  { value: 2, color: "#F2BBA3" },
  { value: 3, color: "#EA7254" },
  { value: 4, color: "#CD3F32" },
  { value: 5, color: "#98231F" },
];

export const COLOR_RAMP_Anxiety: { value: number; color: string }[] = [
  { value: 1, color: "#E6DDFC" },
  { value: 2, color: "#D5C8F4" },
  { value: 3, color: "#A392D1" },
  { value: 4, color: "#65509E" },
  { value: 5, color: "#432F7C" },
];

export const COLOR_RAMP_Loneliness: { value: number; color: string }[] = [
  { value: 1, color: "#E0E4FF" },
  { value: 2, color: "#ADB8FF" },
  { value: 3, color: "#6679FF" },
  { value: 4, color: "#0F29DB" },
  { value: 5, color: "#071BAC" },
];

// 🔧 FIXED: make this a Record<Metric, ColorRamp[]>, not an array literal
export const COLOR_RAMP: Record<Metric, { value: number; color: string }[]> = {
  Stress: COLOR_RAMP_Stress,
  Happy: COLOR_RAMP_Happy,
  Loneliness: COLOR_RAMP_Loneliness,
  Anxiety: COLOR_RAMP_Anxiety,
  Energy: COLOR_RAMP_Energy,
  EnvBeauty: COLOR_RAMP_Stress,
  EnvInteresting: COLOR_RAMP_Happy,
  EnvSafety: COLOR_RAMP_Loneliness,
  EnvCrowded: COLOR_RAMP_Anxiety,
  EnvironmentGreeness: COLOR_RAMP_Energy,
};
