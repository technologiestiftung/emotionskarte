// @ts-ignore – no type definitions for papaparse
import Papa from "papaparse";
import type { HexData, HexPlaceData, Metric, Place } from "./types";

const CSV_SOURCES: Record<Place, string> = {
  drinnen: "/berlin_drinnen.csv",
  draussen: "/berlin_draussen.csv",
  oepnv: "/berlin_oepnv.csv",
};

const METRIC_KEYS: Metric[] = [
  "Stress",
  "Happy",
  "Loneliness",
  "Anxiety",
  "Energy",
  "EnvBeauty",
  "EnvInteresting",
  "EnvSafety",
  "EnvCrowded",
  "EnvironmentGreeness",
];

type CsvRow = {
  hex_id: string;
} & Record<Metric | "DataPointCount", string>;

function parseValue(value: string | undefined): number | null {
  if (value == null || value.trim() === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseRow(row: CsvRow): HexPlaceData {
  const metrics: Record<Metric, number | null> = METRIC_KEYS.reduce(
    (acc, metric) => {
      acc[metric] = parseValue(row[metric]);
      return acc;
    },
    {} as Record<Metric, number | null>
  );
  const n = parseValue(row.DataPointCount ?? "");
  return { metrics, n: n ?? null };
}

export async function loadHexData(
  signal?: AbortSignal
): Promise<Record<string, HexData>> {
  const data: Record<string, HexData> = {};

  await Promise.all(
    (Object.entries(CSV_SOURCES) as [Place, string][]).map(
      async ([place, url]) => {
        const response = await fetch(url, { signal });
        if (!response.ok) {
          throw new Error(`CSV ${url} konnte nicht geladen werden.`);
        }
        const text = await response.text();
        const parsed = Papa.parse<CsvRow>(text, {
          header: true,
          skipEmptyLines: true,
        });
        if (parsed.errors.length > 0) {
          throw new Error(parsed.errors[0].message);
        }
        for (const row of parsed.data) {
          if (!row?.hex_id) continue;
          const existing = data[row.hex_id] ?? {};
          existing[place] = parseRow(row);
          data[row.hex_id] = existing;
        }
      }
    )
  );

  return data;
}
