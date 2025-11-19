"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { COLOR_RAMP } from "../lib/constants";

export type EmotionBarsProps = {
  /** controlled filter range (1..5) */
  range: [number, number];
  onRangeChange: (next: [number, number]) => void;
  className?: string;
  metric: string;
  metricDistribution: number[];
};

export function EmotionBars({
  range,
  onRangeChange,
  className,
  metric,
  metricDistribution,
}: EmotionBarsProps) {
  // --- ANIMATED VALUES + ANIMATED MAX ---
  const [animatedValues, setAnimatedValues] = useState(metricDistribution);
  const [animatedMax, setAnimatedMax] = useState(
    Math.max(...metricDistribution, 1)
  );

  const prevValuesRef = useRef(metricDistribution);
  const prevMaxRef = useRef(Math.max(...metricDistribution, 1));

  useEffect(() => {
    const fromVals = prevValuesRef.current;
    const toVals = metricDistribution;

    const fromMax = prevMaxRef.current || Math.max(...fromVals, 1);
    const toMax = Math.max(...metricDistribution, 1);

    const duration = 350; // ms
    const start = performance.now();

    const maxLen = Math.max(fromVals.length, toVals.length);
    const fromSafe = Array.from({ length: maxLen }, (_, i) => fromVals[i] ?? 0);
    const toSafe = Array.from({ length: maxLen }, (_, i) => toVals[i] ?? 0);

    let frameId: number;

    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out

      const nextVals = toSafe.map((target, i) => {
        const startVal = fromSafe[i];
        return startVal + (target - startVal) * eased;
      });

      const nextMax = fromMax + (toMax - fromMax) * eased;

      setAnimatedValues(nextVals);
      setAnimatedMax(nextMax);

      if (t < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        prevValuesRef.current = metricDistribution;
        prevMaxRef.current = toMax;
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [metricDistribution]);

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

  // const tickRatios = [0, 0.25, 0.5, 0.75, 1];
  const tickRatios = [0.1, 0.5, 1];

  return (
    <div className={clsx("w-full p-4", className)}>
      {/* ===== Chart ===== */}
      <div className="w-full overflow-x-auto mb-2">
        <svg viewBox="0 0 760 210" className="block w-full">
          {/* y-axis label */}
          <text x={10} y={6} fontSize="16" fill="rgb(203 213 225)">
            Abgegebene Stimmen
          </text>

          {/* grid using animatedMax */}
          {tickRatios.map((r) => {
            const y = 170 - r * 140;
            const value = Math.round(r * animatedMax);
            return (
              <g key={r}>
                {/* <line
                  x1={64}
                  y1={y}
                  x2={740}
                  y2={y}
                  stroke="rgba(255,255,255,0.08)"
                /> */}
                <text
                  x={56}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="18"
                  fill="rgb(203 213 225)"
                >
                  {value}
                </text>
              </g>
            );
          })}

          {/* bars */}
          {metricDistribution.map((targetValue, i) => {
            const v = animatedValues[i] ?? 0;
            const h = (v / (animatedMax || 1)) * 140;
            const x = 64 + i * (128 + 10);
            const y = 170 - h;
            const bin = i + 1; // 1..5
            const faded = bin < minVal || bin > maxValSlider;

            return (
              <g
                key={i}
                opacity={faded ? 0.25 : 1}
                className="transition-opacity duration-300"
              >
                <rect
                  x={x}
                  y={y}
                  width={128}
                  height={h}
                  rx={10}
                  ry={10}
                  // @ts-ignore
                  fill={COLOR_RAMP[metric][i].color}
                >
                  <title>{`Wert ${bin}: ${Math.round(targetValue)}`}</title>
                </rect>
                <text
                  x={x + 64}
                  y={190}
                  textAnchor="middle"
                  fontSize="16"
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
            y={205}
            fontSize="16"
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
            className="absolute inset-y-3 rounded-full bg-emo-greytext"
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
            className="range-thumb absolute inset-0 w-full appearance-none bg-transparent"
          />

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
            className="range-thumb absolute inset-0 w-full appearance-none bg-transparent"
          />
        </div>
      </div>
    </div>
  );
}
