import { DEFAULT_PLACE, METRIC_GROUPS, PLACE_LABELS } from "./constants";
import type { HexAggregated, HexData, Metric, MetricGroupKey, Place } from "./types";

export type Filters = {
  minValue: number;
  maxValue: number;
  minParticipants: number;
  hideNoData: boolean;
};

export function ensurePlaces(selected: Place[]): Place[] {
  const unique = Array.from(new Set(selected));
  const fallback = DEFAULT_PLACE;
  if (unique.length === 0) {
    return [fallback];
  }
  return [unique[0]];
}

export function ensureMetricForTab(metric: Metric, tab: MetricGroupKey): Metric {
  if (tab === "daten") {
    return metric;
  }
  const allowed = METRIC_GROUPS[tab];
  if (allowed.includes(metric)) {
    return metric;
  }
  return allowed[0];
}

export function aggregateHexes(
  data: Record<string, HexData>,
  metric: Metric,
  places: Place[],
  filters: Filters
): Record<string, HexAggregated> {
  const safePlaces = ensurePlaces(places);
  const result: Record<string, HexAggregated> = {};

  for (const [hexId, hexData] of Object.entries(data)) {
    const values: number[] = [];
    let nSum = 0;
    const placeDetails: Record<Place, { value: number | null; n: number | null }> = {
      drinnen: { value: null, n: null },
      draussen: { value: null, n: null },
      oepnv: { value: null, n: null }
    };

    for (const place of ["drinnen", "draussen", "oepnv"] as Place[]) {
      const placeData = hexData[place];
      if (!placeData) continue;
      const v = placeData.metrics[metric];
      placeDetails[place] = { value: v, n: placeData.n ?? null };
      if (safePlaces.includes(place)) {
        if (v != null) {
          values.push(v);
        }
        if (placeData.n != null) {
          nSum += placeData.n;
        }
      }
    }

    const hasData = values.length > 0;
    const value = hasData ? average(values) : null;
    const passesFilter = hasData
      ? value! >= filters.minValue && value! <= filters.maxValue && nSum >= filters.minParticipants
      : false;

    const visible = hasData ? passesFilter : !filters.hideNoData;

    result[hexId] = {
      hexId,
      value,
      n: nSum,
      hasData,
      passesFilter,
      visible,
      places: placeDetails
    };
  }

  return result;
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const total = values.reduce((sum, val) => sum + val, 0);
  return Number((total / values.length).toFixed(2));
}

export function formatPlacesList(places: Place[]): string {
  const [activePlace] = ensurePlaces(places);
  return PLACE_LABELS[activePlace];
}
