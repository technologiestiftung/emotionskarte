"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { COLOR_RAMP } from "../lib/constants";

export type EmotionBarsProps = {
  /** controlled filter range (0..5), with a minimum gap of 1 in filter space */
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

  // NEW: remember range from before hover
  const hoverPrevRangeRef = useRef<[number, number] | null>(null);

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

  // ===== Range + slider mapping =====
  const FILTER_MIN = 0;
  const FILTER_MAX = 5;

  const SLIDER_MIN = 0;
  const SLIDER_MAX = 5;
  const STEP = 1;
  const MIN_GAP = 1; // minimum distance between slider thumbs

  // range is the filter range
  const [filterMinVal, filterMaxVal] = range;

  // Map filter range -> slider range
  function toSliderRange([min, max]: [number, number]): [number, number] {
    if (min === max) {
      const val = min;
      if (val > SLIDER_MIN) return [val - 1, val];
      if (val < SLIDER_MAX) return [val, val + 1];
      return [val - 1, val];
    }

    if (min <= FILTER_MIN) {
      return [SLIDER_MIN, max];
    }

    return [min - 1, max];
  }

  // Map slider range -> filter range
  function fromSliderRange([s, t]: [number, number]): [number, number] {
    if (t - s === 1) {
      const val = t;
      const clamped = Math.max(1, Math.min(FILTER_MAX, val));
      return [clamped, clamped];
    }

    let min: number;
    if (s <= SLIDER_MIN) {
      min = FILTER_MIN;
    } else {
      min = s + 1;
    }

    let max = t;

    min = Math.max(FILTER_MIN, Math.min(FILTER_MAX, min));
    max = Math.max(FILTER_MIN, Math.min(FILTER_MAX, max));

    if (max < min) max = min;

    return [min, max];
  }

  // Slider view of the current filter range
  const [sliderMinVal, sliderMaxVal] = useMemo(
    () => toSliderRange(range),
    [range]
  );

  // Slider fill band position (in %)
  const { selLeft, selRight } = useMemo(() => {
    const totalSteps = SLIDER_MAX - SLIDER_MIN; // 5
    const left = ((sliderMinVal - SLIDER_MIN) / totalSteps) * 100;
    const right = ((SLIDER_MAX - sliderMaxVal) / totalSteps) * 100;
    return { selLeft: left, selRight: right };
  }, [sliderMinVal, sliderMaxVal]);

  const tickRatios = [0.1, 0.5, 1];

  // Helpers for hover behavior
  const handleBarMouseEnter = (bin: number) => {
    // Save previous range only on first hover
    if (hoverPrevRangeRef.current === null) {
      hoverPrevRangeRef.current = range;
    }
    onRangeChange([bin, bin]);
  };

  const handleBarMouseLeave = () => {
    if (hoverPrevRangeRef.current !== null) {
      onRangeChange(hoverPrevRangeRef.current);
      hoverPrevRangeRef.current = null;
    }
  };

  return (
    <div className={clsx("w-full p-4", className)}>
      {/* ===== Chart ===== */}
      <div className="w-full overflow-visible mb-0">
        <svg viewBox="0 0 760 210" className="block w-full overflow-visible">
          {/* y-axis label */}
          <text x={10} y={0} fontSize="16" fill="rgb(203 213 225)">
            Abgegebene Stimmen
          </text>

          {/* y-axis line */}
          <line
            x1={56}
            y1={30}
            x2={56}
            y2={170}
            stroke="rgb(148 163 184)"
            strokeWidth={2}
          />

          {/* y-axis ticks + labels using animatedMax */}
          {tickRatios.map((r) => {
            const y = 170 - r * 140;
            const value = Math.round(r * animatedMax);
            return (
              <g key={r}>
                {/* tick line */}
                <line
                  x1={56}
                  y1={y}
                  x2={64}
                  y2={y}
                  stroke="rgb(148 163 184)"
                  strokeWidth={1.5}
                />
                <text
                  x={52}
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

            // faded based on FILTER RANGE, not slider range
            const faded = bin < filterMinVal || bin > filterMaxVal;

            return (
              <g
                key={i}
                opacity={faded ? 0.25 : 1}
                className="transition-opacity duration-300 cursor-pointer"
                onMouseEnter={() => handleBarMouseEnter(bin)}
                onMouseLeave={handleBarMouseLeave}
                role="button"
                tabIndex={0}
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
                  y={210}
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
            y={235}
            fontSize="16"
            fill="rgb(203 213 225)"
            textAnchor="end"
          >
            Intensität der Emotion
          </text>
        </svg>

        {/* ===== Inline range slider (directly under chart) ===== */}
        <div className="mt-0 ml-6 relative -top-[30px]">
          <div className="relative h-6 w-full">
            {/* track */}
            <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 transform rounded-full bg-emo-grey" />

            {/* selected range */}
            <div
              className="absolute top-1/2 h-1 -translate-y-1/2 transform rounded-full bg-white"
              style={{ left: `${selLeft}%`, right: `${selRight}%` }}
            />

            {/* Min thumb */}
            <input
              aria-label="Minimale Intensität"
              type="range"
              min={SLIDER_MIN}
              max={SLIDER_MAX}
              step={STEP}
              value={sliderMinVal}
              onChange={(e) => {
                const raw = Number(e.target.value);
                const nextSliderMin = Math.min(raw, sliderMaxVal - MIN_GAP);

                const [nextFilterMin, nextFilterMax] = fromSliderRange([
                  nextSliderMin,
                  sliderMaxVal,
                ]);

                onRangeChange([nextFilterMin, nextFilterMax]);
              }}
              className="range-thumb absolute inset-0 w-full appearance-none bg-transparent"
            />

            {/* Max thumb */}
            <input
              aria-label="Maximale Intensität"
              type="range"
              min={SLIDER_MIN}
              max={SLIDER_MAX}
              step={STEP}
              value={sliderMaxVal}
              onChange={(e) => {
                const raw = Number(e.target.value);
                const nextSliderMax = Math.max(raw, sliderMinVal + MIN_GAP);

                const [nextFilterMin, nextFilterMax] = fromSliderRange([
                  sliderMinVal,
                  nextSliderMax,
                ]);

                onRangeChange([nextFilterMin, nextFilterMax]);
              }}
              className="range-thumb absolute inset-0 w-full appearance-none bg-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
