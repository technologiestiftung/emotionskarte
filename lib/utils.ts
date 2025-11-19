import type { Metric } from "./types";

function getTextColor(key: string) {
  if (
    [
      "stress",
      "loneliness",
      "anxiety",
      "envbeauty",
      "envsafety",
      "envcrowded",
    ].includes(key)
  ) {
    return " text-white";
  }
  return " text-black";
}

export function metricClass(
  metric: Metric,
  prefix: "bg" | "text" | "border",
  textColor?: boolean
) {
  const key = metric.toLocaleLowerCase(); // or .toLowerCase()
  return `${prefix}-emo-${key} ${textColor ? getTextColor(key) : ""}`;
}
