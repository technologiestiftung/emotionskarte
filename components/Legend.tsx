import { COLOR_RAMP } from "../lib/constants";

export default function Legend() {
  return (
    <div className="pointer-events-auto w-[260px] rounded-3xl border border-white/10 bg-night-900/80 p-5 text-xs text-slate-100 shadow-glow backdrop-blur">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-300">Legende</h3>
        <span className="rounded-full border border-primary-200/40 bg-primary-200/10 px-2 py-1 text-[10px] uppercase tracking-[0.3em] text-primary-100">
          1 – 5
        </span>
      </div>

      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Emotionale Intensität</p>
          <div className="h-12 w-full overflow-hidden rounded-2xl border border-white/10">
            <div className="flex h-full w-full">
              {COLOR_RAMP.map((item, index) => (
                <div
                  key={item.value}
                  className="flex-1"
                  style={{ background: item.color }}
                >
                  <div className="flex h-full items-end justify-center pb-1 text-[10px] font-semibold text-night-950/80">
                    {index % 2 === 0 ? item.value : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <div className="h-3 w-8 rounded bg-[#B0B0B0] opacity-60" />
            <span>keine Daten</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Teilnehmer:innen</p>
          <div className="flex items-end gap-4">
            {[5, 25, 50].map((n) => {
              const size = Math.max(6, Math.sqrt(n) * 2 + 6);
              return (
                <div key={n} className="flex flex-col items-center gap-1 text-slate-300">
                  <div
                    className="flex items-center justify-center rounded-full border border-primary-200/50 bg-slate-900/80"
                    style={{ width: `${size}px`, height: `${size}px` }}
                  >
                    <span className="text-[9px] text-primary-100">{n}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
