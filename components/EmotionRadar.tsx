import { useEffect, useState } from "react";
import clsx from "clsx";
import type { RadarData } from "../lib/types";
import { COLOR_RAMP } from "../lib/constants";

type EmotionRadarProps = {
  data: RadarData;
  maxValue?: number;
  className?: string;
  metric: string;
};

export function EmotionRadar({
  data,
  maxValue = 5,
  className,
  metric,
}: EmotionRadarProps) {
  // normalise input so we never get undefined/NaN
  const entries = Object.entries(data || {});
  const labels = entries.map(([label]) => label);
  const targetValues = entries.map(([_, v]) => Number(v) || 0);

  // we actually render this; it will animate towards targetValues
  const [values, setValues] = useState<number[]>(() => targetValues);

  // make a stable string signature so effect only runs when data really changes
  const targetSignature = targetValues.map((v) => v.toFixed(3)).join("|");

  // animate values -> targetValues whenever data changes
  useEffect(() => {
    // if the number of points changes, just jump (animation would be messy)
    if (values.length !== targetValues.length) {
      setValues(targetValues);
      return;
    }

    const from = values.slice();
    const to = targetValues.slice();
    const duration = 400; // ms
    const start = performance.now();
    let frameId: number;

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);

      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);

      const next = from.map((startVal, i) => {
        const endVal = to[i] ?? 0;
        return startVal + (endVal - startVal) * eased;
      });

      setValues(next);

      if (t < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetSignature]); // depend on data/values change

  // debug – remove later
  useEffect(() => {
    console.log("EmotionRadar labels:", labels);
    console.log(
      "EmotionRadar values used for drawing:",
      values.map((v) => v.toFixed(3))
    );
  }, [labels.join("|"), values.map((v) => v.toFixed(3)).join("|")]);

  // no data at all → show hex outline icon
  if (entries.length === 0) {
    return (
      <div className="flex gap-2">
        <svg
          width="42"
          height="37"
          viewBox="0 0 42 37"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6.125 9.59961L6.12598 9.59766L11.0771 1.00098L20.999 1.01074H21.001L30.9219 1.00098L35.874 9.59766L35.875 9.59961L40.8447 18.1865L35.875 26.7734L35.874 26.7754L30.9219 35.373L21.001 35.3623H20.999L11.0771 35.373L6.12598 26.7754L6.125 26.7734L1.1543 18.1865L6.125 9.59961Z"
            stroke="#F4F4F6"
            strokeWidth="2"
          />
        </svg>
        <p className="text-sm">
          Noch nichts ausgewählt. Tippe ein Hexagon an und entdecke die
          Emotionen dahinter.
        </p>
      </div>
    );
  }

  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 100;

  const levels = maxValue;
  const angleStep = (Math.PI * 2) / labels.length;

  const clamp = (v: number) => Math.max(0, Math.min(v, maxValue));

  const getPoint = (value: number, index: number) => {
    const angle = -Math.PI / 2 + index * angleStep; // start at top
    const r = (clamp(value) / maxValue) * radius;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return [x, y] as const;
  };

  const polygonPoints = values
    .map((value, i) => getPoint(value, i))
    .map(([x, y]) => `${x},${y}`)
    .join(" ");

  return (
    <div className={clsx("relative h-64 w-64", className)}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full">
        {/* gradient definition */}
        <defs>
          <radialGradient id="radarGradient" cx="50%" cy="50%" r="60%">
            <stop
              offset="0%"
              // @ts-ignore
              stopColor={COLOR_RAMP[metric][0].color}
              stopOpacity="0.6"
            />
            <stop
              offset="100%"
              // @ts-ignore
              stopColor={COLOR_RAMP[metric][3].color}
              stopOpacity="0.6"
            />
          </radialGradient>
        </defs>

        {/* concentric rings */}
        {Array.from({ length: levels }, (_, i) => {
          const r = radius * ((i + 1) / levels);
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              className="stroke-white/25"
              fill="none"
              strokeWidth={1}
            />
          );
        })}

        {/* axes */}
        {labels.map((_, i) => {
          const [x, y] = getPoint(maxValue, i);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              className="stroke-white/25"
              strokeWidth={1}
            />
          );
        })}

        {/* data shape */}
        <polygon
          points={polygonPoints}
          fill="url(#radarGradient)"
          // @ts-ignore
          stroke={COLOR_RAMP[metric][3].color}
          strokeWidth={2}
        />

        {/* value labels 1..max on vertical axis */}
        {Array.from({ length: levels }, (_, i) => {
          const v = i + 1;
          const [x, y] = getPoint(v, 0);
          return (
            <text
              key={v}
              x={cx}
              y={y + 4}
              textAnchor="middle"
              className="fill-white/70 text-[10px]"
            >
              {v}
            </text>
          );
        })}

        {/* category labels around the circle */}
        {/* category labels around the circle */}
        {labels.map((label, i) => {
          // shift labels 5px further out
          const extraOffset = 15;
          const [baseX, baseY] = getPoint(maxValue + 0.5, i);

          // move outward along the radial direction
          const angle = -Math.PI / 2 + i * angleStep;
          const x = baseX + Math.cos(angle) * extraOffset;
          const y = baseY + Math.sin(angle) * extraOffset;

          // convert angle → degrees
          const degrees = (angle * 180) / Math.PI;

          // tangent rotation
          let textRotation = degrees + 90;

          // keep labels upright
          if (textRotation > 90) textRotation -= 180;
          if (textRotation < -90) textRotation += 180;

          // special case: last label should flip the other way
          if (i === labels.length - 1) {
            textRotation += 180; // reverse direction
          }

          return (
            <text
              key={label}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-white text-[11px]"
              transform={`rotate(${textRotation}, ${x}, ${y})`}
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
