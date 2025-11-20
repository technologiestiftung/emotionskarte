"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import {
  METRIC_GROUPS,
  METRIC_LABELS,
  METRIC_LABELS_VERBS,
  PLACE_LABELS,
  SIDEBAR_WIDTH,
} from "../lib/constants";
import { metricClass } from "../lib/utils";
import type { Filters } from "../lib/aggregation";
import type { Metric, MetricGroupKey, Place, RadarData } from "../lib/types";
import { EmotionRadar } from "./EmotionRadar";
import { EmotionBars } from "./EmotionBars";

const TABS: { key: MetricGroupKey; label: string }[] = [
  { key: "emotionen", label: "Emotionen" },
  { key: "umwelt", label: "Umweltwahrnehmung" },
  { key: "daten", label: "Daten" },
];
import Icon from "./Icon";

const PLACE_OPTIONS: Place[] = ["drinnen", "draussen", "oepnv"];

export type SidebarProps = {
  tab: MetricGroupKey;
  onTabChange: (tab: MetricGroupKey) => void;
  metric: Metric;
  onMetricChange: (metric: Metric) => void;
  places: Place[];
  onPlacesChange: (places: Place[]) => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  hexData: RadarData;
  metricDistribution: number[];
};

function mockDistribution(tab: MetricGroupKey): number[] {
  switch (tab) {
    case "emotionen":
      return [60, 45, 12, 55, 90];
    case "umwelt":
      return [30, 50, 25, 70, 40];
    default:
      return [0, 0, 0, 0, 0];
  }
}

export default function Sidebar(props: SidebarProps) {
  const {
    tab,
    onTabChange,
    metric,
    onMetricChange,
    places,
    onPlacesChange,
    filters,
    onFiltersChange,
    hexData,
    metricDistribution,
  } = props;
  const [mobileOpen, setMobileOpen] = useState(false);

  // const [distribution, setDistribution] = useState(() => mockDistribution(tab));

  // useEffect(() => {
  //   setDistribution(metricDistribution);
  // }, [metricDistribution]);

  useEffect(() => {
    if (tab === "daten") {
      setMobileOpen(true);
    }
  }, [tab]);

  const updateFilter = (patch: Partial<Filters>) => {
    onFiltersChange({ ...filters, ...patch });
  };

  const selectPlace = (place: Place) => {
    if (places[0] === place) {
      return;
    }
    onPlacesChange([place]);
  };

  const metricOptions = tab === "daten" ? [] : METRIC_GROUPS[tab];

  const sidebarContent = (
    <div
      className={`flex h-full w-[${SIDEBAR_WIDTH}px] flex-col overflow-y-auto bg-emo-black  backdrop-blur-xl border-r border-emo-grey`}
    >
      {" "}
      <nav
        className="sticky top-0 z-10 bg-emo-black px-1 text-sm font-medium 
                border-b border-emo-grey pt-2"
      >
        <div className="flex w-full gap-1">
          {TABS.map((item) => {
            const isActive = tab === item.key;

            return (
              <button
                key={item.key}
                onClick={() => onTabChange(item.key)}
                className={clsx(
                  "flex-1 text-center px-4 py-3 border-x border-t rounded-t-md transition",

                  isActive
                    ? "border-emo-grey bg-emo-black text-white border-b-0 -mb-[1px]"
                    : "border-emo-grey text-emo-grey hover:text-white"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
      <div className="flex-1  px-6 pb-10 pt-6">
        {tab !== "daten" && (
          <div className="flex min-h-full flex-col gap-7">
            <header className="border-b border-emo-grey pb-6">
              <h2 className="mt-3 font-display text-2xl font-semibold leading-tight">
                Wo ist Berlin{" "}
                <span className={metricClass(metric, "text")}>
                  {METRIC_LABELS_VERBS[metric]}
                </span>{" "}
                ?
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Verteilung der Emotion{" "}
                <span className="italic">{METRIC_LABELS[metric]}</span> in
                Berlin.
              </p>
            </header>

            <section className="space-y-2">
              {/* ORTE */}
              <header>
                <h3 className="text-xl font-semibold text-slate-100 pb-2">
                  Orte
                </h3>
              </header>

              <div className="flex justify-center">
                <div className="inline-flex overflow-hidden rounded-full border border-white/40 bg-black/40 text-sm">
                  {PLACE_OPTIONS.map((place, index) => {
                    const active = places.includes(place);

                    return (
                      <button
                        key={place}
                        onClick={() => selectPlace(place)}
                        className={clsx(
                          "flex items-center justify-center gap-2 px-5 py-2 font-medium transition",
                          index !== 0 && "border-l border-white/25",
                          active
                            ? "bg-white text-black"
                            : "bg-transparent text-slate-100 hover:bg-white/10"
                        )}
                      >
                        <Icon
                          name={place}
                          className={clsx(
                            "w-5 h-5",
                            active ? "text-black" : "text-white"
                          )}
                        />
                        <span>{PLACE_LABELS[place]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
            <section className="space-y-2">
              <header>
                <h3 className="text-xl font-semibold text-slate-100 pb-2">
                  Emotionen
                </h3>
              </header>

              <div className="flex justify-center overflow-x-auto ">
                <div className="inline-flex min-w-max overflow-hidden rounded-3xl border border-white/40 bg-black/40 text-sm">
                  {metricOptions.map((option, index) => {
                    const active = metric === option;

                    return (
                      <button
                        key={option}
                        onClick={() => onMetricChange(option)}
                        className={clsx(
                          "flex items-center justify-center gap-2 px-3 py-2 font-medium transition",
                          index !== 0 && "border-l border-white/25",
                          active
                            ? metricClass(metric, "bg", true)
                            : "bg-transparent text-slate-100 hover:bg-white/10"
                        )}
                      >
                        {METRIC_LABELS[option]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
            <section className="space-y-2">
              {/* ORTE */}
              <header>
                <h3 className="text-xl font-semibold text-slate-100 pb-2">
                  Verteilung in Berlin
                </h3>
              </header>

              <div className="">
                <EmotionBars
                  range={[filters.minValue, filters.maxValue]}
                  onRangeChange={([minValue, maxValue]) =>
                    updateFilter({
                      minValue: Math.min(minValue, maxValue),
                      maxValue: Math.max(maxValue, minValue),
                    })
                  }
                  metric={metric}
                  metricDistribution={metricDistribution}
                />
              </div>
            </section>
            {/* <section className="space-y-5 rounded-3xl border border-white/5 bg-slate-900/30 p-5">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
                  Filter
                </h3>
                <p className="text-xs text-slate-400">
                  Verfeinere die Anzeige für dein Analyseziel. Filter wirken
                  sich auf Opazität und Tooltip aus.
                </p>
              </div>

              <FilterSlider
                label="Minimaler Wert"
                min={1}
                max={filters.maxValue}
                step={0.5}
                value={filters.minValue}
                onChange={(value) =>
                  updateFilter({ minValue: Math.min(value, filters.maxValue) })
                }
              />
              <FilterSlider
                label="Maximaler Wert"
                min={filters.minValue}
                max={5}
                step={0.5}
                value={filters.maxValue}
                onChange={(value) =>
                  updateFilter({ maxValue: Math.max(value, filters.minValue) })
                }
              />
              <FilterSlider
                label="Mindestens Teilnehmer:innen"
                min={0}
                max={50}
                step={1}
                value={filters.minParticipants}
                onChange={(value) => updateFilter({ minParticipants: value })}
              />*/}

            <section className="grid gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-100 pb-2">
                  Emotionenverteilung im Hexagon
                </h3>
              </div>

              <div className="flex justify-center">
                <EmotionRadar data={hexData} metric={metric} />
              </div>
            </section>

            <section className="mt-auto border-t border-emo-grey pt-6">
              <p className="text-xs text-emo-grey">
                Der Datensatz umfasst den Zeitraum von Januar 2020 bis Dezember
                2025. Die Karten-Visualisierung basiert auf den App-Daten mit
                Stand vom 15. Oktober 2025. Mehr erfahren
              </p>
            </section>
          </div>
        )}

        {tab === "daten" && <DataTabContent />}
      </div>
    </div>
  );

  return (
    <>
      {/* MOBILE TOGGLE BUTTON – moved below header */}
      <button
        className="fixed left-4 top-20 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-primary-200/50 bg-emo-black  shadow-glow transition hover:border-primary-200 md:hidden"
        onClick={() => setMobileOpen((value) => !value)}
        aria-label="Sidebar umschalten"
      >
        {mobileOpen ? "×" : "≡"}
      </button>

      {/* SIDEBAR – offset by header height (top-16) */}
      <div className="pointer-events-none fixed left-0 top-16 bottom-0 z-20 flex md:pointer-events-auto">
        <div
          className={clsx(
            "pointer-events-auto h-full transition-transform duration-300",
            mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
        >
          {sidebarContent}
        </div>
        {mobileOpen && (
          <div
            className="pointer-events-auto fixed inset-0 bg-slate-950/50 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </div>
    </>
  );
}

type SliderProps = {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
};

function FilterSlider({ label, min, max, step, value, onChange }: SliderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-slate-400">
        <span>{label}</span>
        <span className="rounded-full bg-slate-900/60 px-3 py-1 text-xs font-semibold text-primary-50">
          {value}
        </span>
      </div>
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-slate-800/70" />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="relative w-full appearance-none bg-transparent"
        />
      </div>
    </div>
  );
}

function DataTabContent() {
  return (
    <div className="space-y-8 text-sm text-slate-200">
      <section className="">
        <h3 className="text-lg font-semibold pb-2">Über die Daten</h3>
        <p>
          Die Emotionen und Umweltwahrnehmungen stammen aus einer Befragung
          Berliner Bürger:innen. Alle Antworten wurden anonymisiert und auf
          H3-Hexagone aggregiert.
        </p>
        <p>
          Drei Kontexte stehen zur Verfügung: Drinnen, Draußen und ÖPNV. Bei der
          Visualisierung werden sie mit einer OR-Logik kombiniert, sodass
          bereits ein Kontext genügt, um Daten für ein Hexagon anzuzeigen.
        </p>
      </section>
      <section className="">
        <h4 className="text-base font-semibold pb-2 ">Variablen & Skalen</h4>
        <p>
          Skala 1 (niedrig) bis 5 (hoch) für Emotionen wie Stress, Glück oder
          Energie sowie für Umweltfaktoren wie Sicherheit oder Urbanes Grün.
          Zusätzlich wird die Anzahl der Teilnehmer:innen je Hexagon erfasst.
        </p>
      </section>
      <section className="">
        <h4 className="text-base font-semibold pb-2 ">Methodik</h4>
        <p>
          Teilnehmende ordneten Wahrnehmungen konkreten Orten zu. Pro Ort und
          Kontext wurden Mittelwerte gebildet, anschließend in H3-Zellen
          aggregiert und mit Feature States dynamisch in die Karte gespielt.
        </p>
      </section>
      {/* <section className="">
        <h4 className="text-base font-semibold pb-2 ">Downloads</h4>
        <ul className="space-y-2  underline-offset-2">
          <li>
            <a
              href="/indoors_by_hex_id_res8.csv"
              download
              className="hover:underline"
            >
              indoors_by_hex_id_res8.csv
            </a>
          </li>
          <li>
            <a
              href="/outdoors_by_hex_id_res8.csv"
              download
              className="hover:underline"
            >
              outdoors_by_hex_id_res8.csv
            </a>
          </li>
          <li>
            <a
              href="/transit_by_hex_id_res8.csv"
              download
              className="hover:underline"
            >
              transit_by_hex_id_res8.csv
            </a>
          </li>
        </ul>
      </section> */}
      <section className="">
        <h4 className="text-base font-semibold pb-2 ">Datenschutz</h4>
        <p>
          Alle Daten wurden aggregiert, sodass keine Rückschlüsse auf
          Einzelpersonen möglich sind.
        </p>
      </section>
      <section className="">
        <h4 className="text-base font-semibold pb-2 ">Lizenz</h4>

        <p>CC BY 4.0 · Kontakt: emotionskarte@berlin.de</p>
      </section>
    </div>
  );
}
