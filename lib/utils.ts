import type { Metric } from "./types";

export function metricClass(metric: Metric, prefix: "bg" | "text" | "border") {
  const key = metric.toLocaleLowerCase(); // or .toLowerCase()
  return `${prefix}-emo-${key}`;
}
