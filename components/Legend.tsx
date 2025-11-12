import { COLOR_RAMP } from "../lib/constants";

import type { Metric } from "../lib/types";
import { METRIC_LABELS } from "../lib/constants";
export type LegendProps = {
  metric: Metric;
};

export default function Legend(props: LegendProps) {
  const { metric } = props;

  return (
    <div className="pointer-events-auto w-[300px] rounded-3xl border border-primary-500/60 bg-emo-black p-4 text-xs text-slate-100 shadow-glow backdrop-blur">
      {/* Header */}
      <div className="flex items-center">
        <h3 className="flex-1 text-center text-sm font-semibold">
          Intensitätsskala von{" "}
          <span className="text-teal-300">{METRIC_LABELS[metric]}</span>
        </h3>
        <span className="ml-2 text-lg leading-none text-slate-200">⌃</span>
      </div>

      {/* Intensity scale */}
      <div className="mt-4">
        <div className="flex overflow-hidden rounded-full bg-slate-900/70">
          {COLOR_RAMP.map((item) => (
            <div
              key={item.value}
              className="flex-1 py-2"
              style={{ background: item.color }}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-slate-100">
          {COLOR_RAMP.map((item) => (
            <span key={item.value}>{item.value}</span>
          ))}
        </div>
      </div>

      {/* Participants label + toggle */}
      <div className="mt-5 flex items-center justify-between">
        <p className="text-[13px] text-slate-50">Teilnehmer:innen-Anzahl</p>
        <div className="relative h-5 w-10 rounded-full bg-slate-500">
          <div className="absolute right-[2px] top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow" />
        </div>
      </div>

      {/* Circle scale */}
      <div className="mt-6">
        <div className="flex items-end justify-between">
          {[1, 2, 3, 4, 5].map((step) => {
            const size = 6 + step * 8; // increasing circle sizes
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
    </div>
  );
}
