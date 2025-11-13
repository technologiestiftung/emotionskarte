"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { COLOR_RAMP } from "../lib/constants";

export type EmotionBarsProps = {
  tab: "emotionen" | "umwelt" | "daten";
  /** controlled filter range (1..5) */
  range: [number, number];
  onRangeChange: (next: [number, number]) => void;
  className?: string;
};

export function EmotionBars({
  tab,
  range,
  onRangeChange,
  className,
}: EmotionBarsProps) {
  const [distribution, setDistribution] = useState<number[]>([]);

  // simple static mock data based on tab
  useEffect(() => {
    if (tab === "emotionen") setDistribution([60, 45, 12, 55, 90]);
    else if (tab === "umwelt") setDistribution([30, 50, 25, 70, 40]);
    else setDistribution([0, 0, 0, 0, 0]);
  }, [tab]);

  const maxVal = Math.max(...distribution, 1);

  // slider helpers
  const [minVal, maxValSlider] = range;
  const minAllowed = 1;
  const maxAllowed = 5;
  const step = 1;

  // for the filled selection bar
  const selLeft = useMemo(
    () => ((minVal - minAllowed) / (maxAllowed - minAllowed)) * 100,
    [minVal]
  );
  const selRight = useMemo(
    () => (1 - (maxValSlider - minAllowed) / (maxAllowed - minAllowed)) * 100,
    [maxValSlider]
  );

  return (
    <div
      className={clsx(
        "w-full rounded-3xl border border-white/10 bg-slate-900/30 p-4",
        className
      )}
    >
      {/* ===== Chart ===== */}
      <div className="w-full overflow-x-auto">
        <svg viewBox="0 0 760 200" className="block w-full">
          {/* y-axis label */}
          <text x={10} y={16} fontSize="13" fill="rgb(203 213 225)">
            Abgegebene Stimmen
          </text>

          {/* grid */}
          {[0, 25, 50, 75, 100].map((t) => {
            const y = 170 - (t / 100) * 140;
            return (
              <g key={t}>
                <line
                  x1={64}
                  y1={y}
                  x2={740}
                  y2={y}
                  stroke="rgba(255,255,255,0.08)"
                />
                <text
                  x={56}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="rgb(203 213 225)"
                >
                  {t}
                </text>
              </g>
            );
          })}

          {/* bars */}
          {distribution.map((v, i) => {
            const h = (v / maxVal) * 140;
            const x = 64 + i * (128 + 10);
            const y = 170 - h;
            const bin = i + 1; // 1..5
            const faded = bin < minVal || bin > maxValSlider;
            return (
              <g key={i} opacity={faded ? 0.25 : 1}>
                <rect
                  x={x}
                  y={y}
                  width={128}
                  height={h}
                  rx={10}
                  ry={10}
                  //   fill="url(#grad)"
                  fill={COLOR_RAMP[i].color}
                >
                  <title>{`Wert ${bin}: ${v}`}</title>
                </rect>
                <text
                  x={x + 64}
                  y={190}
                  textAnchor="middle"
                  fontSize="13"
                  fill="rgb(203 213 225)"
                >
                  {bin}
                </text>
              </g>
            );
          })}

          {/* x label */}
          <text
            x={740}
            y={196}
            fontSize="13"
            fill="rgb(203 213 225)"
            textAnchor="end"
          >
            Intensität der Emotion
          </text>

          <defs>
            <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#0d9488" />
              <stop offset="100%" stopColor="#99f6e4" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* ===== Inline range slider (dual thumb) ===== */}
      <div className="mt-3">
        <div className="relative h-8">
          {/* track */}
          <div className="absolute inset-y-3 rounded-full bg-slate-800/70" />
          {/* selected range fill */}
          <div
            className="absolute inset-y-3 rounded-full bg-primary-200/30"
            style={{ left: `${selLeft}%`, right: `${selRight}%` }}
          />
          {/* low thumb */}
          <input
            aria-label="Minimale Intensität"
            type="range"
            min={minAllowed}
            max={maxAllowed}
            step={step}
            value={minVal}
            onChange={(e) => {
              const nextMin = Math.min(Number(e.target.value), maxValSlider);
              onRangeChange([nextMin, maxValSlider]);
            }}
            className="absolute inset-0 w-full appearance-none bg-transparent"
          />
          {/* high thumb (on top) */}
          <input
            aria-label="Maximale Intensität"
            type="range"
            min={minAllowed}
            max={maxAllowed}
            step={step}
            value={maxValSlider}
            onChange={(e) => {
              const nextMax = Math.max(Number(e.target.value), minVal);
              onRangeChange([minVal, nextMax]);
            }}
            className="absolute inset-0 w-full appearance-none bg-transparent"
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-slate-400">
          <span>Bereich</span>
          <span className="rounded-full bg-slate-900/60 px-3 py-1 text-xs font-semibold text-primary-50">
            {minVal} – {maxValSlider}
          </span>
        </div>
      </div>
    </div>
  );
}
