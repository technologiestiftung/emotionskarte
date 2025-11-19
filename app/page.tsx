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

import Icon from "../components/Icon";

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
  const [modalVisible, setModalVisible] = useState(false);
  const [metricDistribution, setMetricDistribution] = useState([]);

  useEffect(() => {
    setLoading(true);
    loadHexData()
      .then((result) => {
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

  useEffect(() => {
    if (!rawData || !metric) return;

    // counter array for values 1..5
    const result = [0, 0, 0, 0, 0];

    Object.values(rawData).forEach((entry) => {
      // check if places[0] exists
      const place = places[0];
      if (!entry[place]) return;

      console.log("Ö");

      // get the metric value
      const value = entry[place]?.metrics?.[metric];
      if (!value) return;

      // round to nearest integer (1–5)
      const rounded = Math.round(value);

      // count n times this entry
      if (rounded >= 1 && rounded <= 5) {
        result[rounded - 1] += entry.n ?? 1;
      }
    });

    console.log(result); // example: [30, 50, 25, 70, 40]
    setMetricDistribution(result); // if you store it in state
  }, [metric, places, rawData]);

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
    <main className="relative flex min-h-screen flex-col bg-emo-black text-slate-100">
      <IntroModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
      />

      {/* FIXED TOP HEADER */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between bg-white px-6 shadow-md text-slate-900">
        <div className="flex items-center gap-3">
          <Icon name={"logoEmo"} className={"w-20 h-20 text-black"} />
        </div>

        <div className="flex items-center gap-4 text-sm">
          <button
            className="underline-offset-2 hover:underline"
            onClick={() => setModalVisible(true)}
          >
            Über das Projekt
          </button>
          {/* <button className="rounded border border-slate-300 px-3 py-1 text-xs font-medium">
            DE 
          </button> */}
        </div>
      </header>

      {/* CONTENT BELOW FIXED HEADER */}
      <div className="relative flex w-full flex-1 pt-16">
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
          metricDistribution={metricDistribution}
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
          <Legend metric={metric} />
        </div>
      </div>
    </main>
  );
}
