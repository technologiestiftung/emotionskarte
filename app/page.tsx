"use client";

import { useEffect, useMemo, useState } from "react";
import IntroModal from "../components/IntroModal";
import Legend from "../components/Legend";
import MapView from "../components/MapView";
import Sidebar from "../components/Sidebar";
import {
  aggregateHexes,
  ensureMetricForTab,
  ensurePlaces,
  type Filters,
} from "../lib/aggregation";
import {
  DEFAULT_METRIC,
  DEFAULT_PLACE,
  METRIC_GROUPS,
  METRIC_LABELS,
} from "../lib/constants";

import { loadHexData } from "../lib/dataLoader";
import type {
  HexData,
  Metric,
  MetricGroupKey,
  Place,
  RadarData,
} from "../lib/types";

const DEFAULT_FILTERS: Filters = {
  minValue: 1,
  maxValue: 5,
  minParticipants: 1,
  hideNoData: false,
};

export default function HomePage() {
  const [tab, setTab] = useState<MetricGroupKey>("emotionen");
  const [metric, setMetric] = useState<Metric>(DEFAULT_METRIC);
  const [places, setPlaces] = useState<Place[]>([DEFAULT_PLACE]);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [rawData, setRawData] = useState<Record<string, HexData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hexId, setHexId] = useState<string | null>(null);
  const [hexData, setHexData] = useState<RadarData>({});

  useEffect(() => {
    setLoading(true);
    loadHexData()
      .then((result) => {
        console.log(
          "loadHexData resolved with",
          Object.keys(result).length,
          "hexes"
        );

        setRawData(result);
        setError(null);
      })
      .catch((err: unknown) => {
        console.error(err);
        setError("Daten konnten nicht geladen werden.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setMetric((current) => ensureMetricForTab(current, tab));
  }, [tab]);

  const safePlaces = useMemo(() => ensurePlaces(places), [places]);

  const aggregated = useMemo(
    () => aggregateHexes(rawData, metric, safePlaces, filters),
    [rawData, metric, safePlaces, filters]
  );

  useEffect(() => {
    const place = places[0];
    const selectedHexData = hexId ? rawData[hexId] : undefined;
    const selectedHexDataPlace = selectedHexData?.[place]?.metrics;

    if (!hexId || !selectedHexDataPlace) {
      setHexData({});
      return;
    }

    const buildRadar = (group: readonly Metric[]): RadarData => {
      const out: RadarData = {};
      for (const m of group) {
        const label = METRIC_LABELS[m];
        // numbers or fallback to 0
        out[label] = selectedHexDataPlace[m] ?? 0;
      }
      return out;
    };

    if (tab === "emotionen") {
      setHexData(buildRadar(METRIC_GROUPS.emotionen));
    } else if (tab === "umwelt") {
      setHexData(buildRadar(METRIC_GROUPS.umwelt));
    }
  }, [hexId, places, rawData, tab]);

  return (
    <main className="relative flex h-screen flex-col bg-emo-black text-slate-100">
      <IntroModal />
      <div className="relative flex h-full w-full">
        <Sidebar
          tab={tab}
          onTabChange={setTab}
          metric={metric}
          onMetricChange={setMetric}
          places={places}
          onPlacesChange={setPlaces}
          filters={filters}
          onFiltersChange={setFilters}
          hexData={hexData}
        />

        <div className="relative flex-1">
          <MapView
            mapData={aggregated}
            metric={metric}
            activePlaces={safePlaces}
            loading={loading}
            error={error}
            setHexId={setHexId}
          />
          <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between">
            {/* @todo */}
            {/* <div className="flex justify-end px-6 pt-6">
              <div className="pointer-events-auto hidden max-w-sm flex-col gap-2 rounded-2xl border border-white/10 bg-emo-blacktext/85 p-4 text-sm backdrop-blur md:flex">
                <label
                  className="text-[11px] uppercase tracking-[0.35em] text-slate-400"
                  htmlFor="map-search"
                >
                  Ortssuche
                </label>
                <div className="flex items-center gap-2 rounded-full bg-slate-900/80 px-4 py-2 ring-1 ring-white/10">
                  <span className="text-primary-200">⌕</span>
                  <input
                    id="map-search"
                    placeholder="Ort oder Adresse eingeben"
                    className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                    disabled
                  />
                </div>
                <p className="text-xs text-slate-400">
                  Die Suche ist in dieser Demo deaktiviert.
                </p>
              </div>
            </div> */}
            {/* @todo */}
            {/* <div className="pointer-events-none px-6 pb-8">
              <div className="pointer-events-auto inline-flex max-w-md flex-col gap-3 rounded-3xl border border-white/5 bg-emo-blacktext/80 p-4 text-xs shadow-glow backdrop-blur">
                <p className="text-[11px] uppercase tracking-[0.4em] text-primary-100">
                  Aktives Hexagon
                </p>
                <div className="flex items-center justify-between text-sm font-semibold text-slate-100">
                  <span>{metric}</span>
                  <span>
                    {filters.minValue.toFixed(1)} –{" "}
                    {filters.maxValue.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 rounded-xl bg-metric-card p-3">
                    <p className="text-[11px] uppercase tracking-widest text-slate-400">
                      Teilnehmer:innen
                    </p>
                    <p className="mt-1 text-lg font-semibold text-primary-50">
                      ≥ {filters.minParticipants}
                    </p>
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-primary-200/50 bg-slate-900/60 text-center text-[11px] uppercase tracking-wide text-primary-100">
                    {safePlaces.length ? PLACE_LABELS[safePlaces[0]] : "Ort"}
                    <span className="sr-only">aktiver Ort</span>
                  </div>
                </div>
              </div>
            </div> */}
          </div>
          <Legend metric={metric} />
        </div>
      </div>

      <footer className="pointer-events-none hidden" id="impressum">
        <div id="datenschutz" />
      </footer>
    </main>
  );
}
