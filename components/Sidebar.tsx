"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import { METRIC_GROUPS, METRIC_LABELS, PLACE_LABELS } from "../lib/constants";
import type { Filters } from "../lib/aggregation";
import type { Metric, MetricGroupKey, Place } from "../lib/types";

const TABS: { key: MetricGroupKey; label: string }[] = [
  { key: "emotionen", label: "Emotionen" },
  { key: "umwelt", label: "Umweltwahrnehmung" },
  { key: "daten", label: "Daten" },
];

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
};

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
  } = props;
  const [mobileOpen, setMobileOpen] = useState(false);

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
    <div className="flex h-full w-[23rem] flex-col overflow-hidden rounded-r-3xl bg-panel-gradient text-slate-100 shadow-sidebar ring-1 ring-white/10 backdrop-blur-xl">
      <header className="border-b border-white/5 px-6 pb-6 pt-7">
        <p className="text-[11px] uppercase tracking-[0.45em] text-primary-100">
          Emotionale Stadt
        </p>
        <h2 className="mt-3 font-display text-2xl font-semibold leading-tight">
          Wo ist Berlin vital?
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          Verteilung der Emotion{" "}
          <span className="text-primary-50">{METRIC_LABELS[metric]}</span> nach
          Ort und Intensität.
        </p>
      </header>

      <nav className="flex gap-2 border-b border-white/5 px-6 pb-4 pt-5 text-sm font-medium">
        {TABS.map((item) => (
          <button
            key={item.key}
            onClick={() => onTabChange(item.key)}
            className={clsx(
              "flex-1 rounded-2xl border px-3 py-2 transition",
              tab === item.key
                ? "border-primary-200 bg-primary-200 text-night-950 shadow-glow"
                : "border-white/5 bg-slate-900/30 text-slate-300 hover:border-white/20"
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto px-6 pb-10 pt-6">
        {tab !== "daten" && (
          <div className="flex flex-col gap-7">
            <section className="space-y-4 rounded-3xl border border-white/5 bg-slate-900/30 p-5">
              <header className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
                  Orte
                </h3>
              </header>
              <div className="flex flex-wrap gap-2">
                {PLACE_OPTIONS.map((place) => {
                  const active = places.includes(place);
                  return (
                    <button
                      key={place}
                      className={clsx(
                        "rounded-full px-4 py-2 text-sm font-medium transition",
                        active
                          ? "bg-primary-300 text-night-950 shadow-glow"
                          : "bg-slate-800/60 text-slate-300 hover:bg-slate-800"
                      )}
                      onClick={() => selectPlace(place)}
                    >
                      {PLACE_LABELS[place]}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-400">
                Hexagone spiegeln den gewählten Ort wider. Es kann immer nur ein
                Ort aktiv sein.
              </p>
            </section>

            <section className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
                  Emotionen
                </h3>
                <p className="text-xs text-slate-400">
                  Wähle eine Kennzahl aus, um die Karte entsprechend zu färben.
                  Die Intensität reicht von 1 bis 5.
                </p>
              </div>
              <div className="grid gap-3">
                {metricOptions.map((option) => (
                  <MetricCard
                    key={option}
                    label={METRIC_LABELS[option]}
                    description="Hexagonaler Durchschnitt 1–5"
                    active={metric === option}
                    onSelect={() => onMetricChange(option)}
                  />
                ))}
              </div>
            </section>

            <section className="space-y-5 rounded-3xl border border-white/5 bg-slate-900/30 p-5">
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
              />

              {/* @todo */}
              {/* <label className="flex items-center gap-3 rounded-2xl border border-white/5 bg-slate-950/60 px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={filters.hideNoData}
                  onChange={(event) => updateFilter({ hideNoData: event.target.checked })}
                  className="h-4 w-4 rounded border-slate-500 text-primary-300 focus:ring-primary-200"
                />
                <span className="text-slate-200">Hexagone ohne Daten ausblenden</span>
              </label> */}
            </section>

            <section className="grid gap-4 rounded-3xl border border-white/5 bg-slate-900/30 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
                  Emotionenverteilung
                </h3>
                <span className="text-xs text-slate-400">Beispielhexagon</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <Sparkline />
                  <div className="flex justify-between text-[11px] uppercase tracking-widest text-slate-500">
                    <span>1</span>
                    <span>3</span>
                    <span>5</span>
                  </div>
                </div>
                <RadarPlaceholder />
              </div>
              <p className="text-xs text-slate-400">
                Darstellung exemplarisch: reale Werte hängen von der Auswahl auf
                der Karte ab.
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
      <button
        className="fixed left-4 top-4 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-primary-200/50 bg-night-900/80 text-primary-100 shadow-glow transition hover:border-primary-200 md:hidden"
        onClick={() => setMobileOpen((value) => !value)}
        aria-label="Sidebar umschalten"
      >
        {mobileOpen ? "×" : "≡"}
      </button>

      <div className="pointer-events-none fixed inset-y-0 left-0 z-20 flex md:pointer-events-auto">
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
      <section className="space-y-3 rounded-3xl border border-white/5 bg-slate-900/30 p-6">
        <h3 className="text-lg font-semibold text-primary-100">
          Über die Daten
        </h3>
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
      <section className="grid gap-3 rounded-3xl border border-white/5 bg-slate-900/30 p-6">
        <h4 className="text-base font-semibold text-primary-100">
          Variablen & Skalen
        </h4>
        <p>
          Skala 1 (niedrig) bis 5 (hoch) für Emotionen wie Stress, Glück oder
          Energie sowie für Umweltfaktoren wie Sicherheit oder Urbanes Grün.
          Zusätzlich wird die Anzahl der Teilnehmer:innen je Hexagon erfasst.
        </p>
      </section>
      <section className="grid gap-3 rounded-3xl border border-white/5 bg-slate-900/30 p-6">
        <h4 className="text-base font-semibold text-primary-100">Methodik</h4>
        <p>
          Teilnehmende ordneten Wahrnehmungen konkreten Orten zu. Pro Ort und
          Kontext wurden Mittelwerte gebildet, anschließend in H3-Zellen
          aggregiert und mit Feature States dynamisch in die Karte gespielt.
        </p>
      </section>
      <section className="space-y-4 rounded-3xl border border-white/5 bg-slate-900/30 p-6">
        <h4 className="text-base font-semibold text-primary-100">Downloads</h4>
        <ul className="space-y-2 text-primary-100 underline-offset-2">
          <li>
            <a href="/berlin_drinnen.csv" download className="hover:underline">
              berlin_drinnen.csv
            </a>
          </li>
          <li>
            <a href="/berlin_draussen.csv" download className="hover:underline">
              berlin_draussen.csv
            </a>
          </li>
          <li>
            <a href="/berlin_oepnv.csv" download className="hover:underline">
              berlin_oepnv.csv
            </a>
          </li>
        </ul>
      </section>
      <section className="space-y-2 rounded-3xl border border-white/5 bg-slate-900/30 p-6 text-xs text-slate-400">
        <p>
          Datenschutz: Alle Daten wurden aggregiert, sodass keine Rückschlüsse
          auf Einzelpersonen möglich sind.
        </p>
        <p>Lizenz: CC BY 4.0 · Kontakt: emotionskarte@berlin.de</p>
      </section>
    </div>
  );
}

type MetricCardProps = {
  label: string;
  description: string;
  active: boolean;
  onSelect: () => void;
};

function MetricCard({ label, description, active, onSelect }: MetricCardProps) {
  return (
    <button
      onClick={onSelect}
      className={clsx(
        "group flex items-center justify-between gap-4 rounded-3xl border px-4 py-3 text-left transition",
        active
          ? "border-primary-200 bg-metric-card text-night-950 shadow-glow"
          : "border-white/5 bg-slate-900/30 text-slate-200 hover:border-primary-100/60"
      )}
    >
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <div className="hidden h-12 w-24 items-end justify-between gap-1 sm:flex">
        <Sparkline active={active} />
      </div>
    </button>
  );
}

function Sparkline({ active }: { active?: boolean }) {
  const bars = [3, 5, 2, 4, 1.5, 3.5, 4.5];
  return (
    <div className="flex h-full w-full items-end gap-1">
      {bars.map((value, index) => (
        <div
          key={index}
          className={clsx(
            "w-[6px] rounded-full bg-gradient-to-t from-primary-300/30 to-primary-200/80",
            active ? "shadow-glow" : "opacity-70"
          )}
          style={{ height: `${value * 8}px` }}
        />
      ))}
    </div>
  );
}

function RadarPlaceholder() {
  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      <div className="absolute inset-0 rounded-full border border-white/10" />
      <div className="absolute h-20 w-20 rounded-full border border-primary-200/30" />
      <div className="absolute h-14 w-14 rounded-full border border-primary-200/20" />
      <div className="absolute h-8 w-8 rounded-full bg-primary-200/40" />
      <span className="text-[11px] uppercase tracking-widest text-primary-100">
        Demo
      </span>
    </div>
  );
}
