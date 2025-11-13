import { useState } from "react";
import { COLOR_RAMP, METRIC_LABELS } from "../lib/constants";
import { metricClass } from "../lib/utils";

import type { Metric } from "../lib/types";

export type LegendProps = {
  metric: Metric;
};

export default function Legend({ metric }: LegendProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="pointer-events-none absolute bottom-6 right-6 z-30">
      <div
        className="
      pointer-events-auto
      w-[300px]
      rounded-3xl
      border border-primary-500/60
      bg-emo-black
      p-4
      text-xs text-slate-100
      shadow-glow
      backdrop-blur
    "
      >
        {/* Header — click to toggle */}
        <div
          className="flex items-center cursor-pointer select-none"
          onClick={() => setOpen(!open)}
        >
          <h3 className="flex-1 text-center text-sm font-semibold">
            Intensitätsskala von{" "}
            <span className={metricClass(metric, "text")}>
              {METRIC_LABELS[metric]}
            </span>
          </h3>

          <span
            className={`ml-2 text-lg leading-none text-slate-200 transition-transform ${
              open ? "rotate-180" : "rotate-0"
            }`}
          >
            ⌃
          </span>
        </div>

        {/* Collapsible content */}
        {open && (
          <>
            {/* Intensity scale */}
            <div className="mt-4">
              <div className="flex overflow-hidden rounded-full bg-slate-900/70">
                {COLOR_RAMP[metric].map((item) => (
                  <div
                    key={item.value}
                    className="flex-1 py-2"
                    style={{ background: item.color }}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-slate-100">
                {COLOR_RAMP[metric].map((item) => (
                  <span key={item.value}>{item.value}</span>
                ))}
              </div>
            </div>

            {/* Circle scale */}
            <div className="mt-4">
              <p className="text-[13px] text-slate-50">Anzahl an Einträgen</p>
              <div className="flex items-end justify-between">
                {[1, 2, 3, 4, 5].map((step) => {
                  const size = 6 + step * 8;
                  return (
                    <div
                      key={step}
                      className="rounded-full bg-slate-400/90"
                      style={{ width: size, height: size }}
                    />
                  );
                })}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-slate-300">
                <span>Min. 1 TN</span>
                <span>Max. 250 TN</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
