"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "emotionskarte_has_seen_intro";

export default function IntroModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasSeen = window.localStorage.getItem(STORAGE_KEY) === "1";
    setVisible(!hasSeen);
  }, []);

  const close = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-emo-black backdrop-blur">
      <div className="mx-4 w-full max-w-4xl overflow-hidden rounded-[32px] border border-white/10 bg-panel-gradient p-0 shadow-[0_35px_120px_-45px_rgba(0,0,0,0.9)]">
        <div className="grid gap-8 px-8 py-10 text-slate-100 md:grid-cols-[3fr,2fr]">
          <div className="space-y-5">
            <p className="text-[12px] uppercase tracking-[0.45em] text-primary-100">
              Deine Emotionale Stadt
            </p>
            <h1 className="font-display text-3xl font-semibold leading-snug md:text-4xl">
              Was ist auf der Karte zu sehen?
            </h1>
            <p className="text-sm text-slate-300">
              Entdecke die emotionale und sensorische Vielfalt Berlins. Wir
              zeigen, wie Menschen Orte als vital, ruhig oder energiegeladen
              erleben. Die Hexagone visualisieren Mittelwerte, die aus mehreren
              Stimmen pro Ort hervorgehen.
            </p>
            <div className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/40 p-5">
              <h2 className="text-lg font-semibold text-primary-50">
                Wie lese ich die Karte?
              </h2>
              <ul className="list-disc space-y-2 pl-6 text-sm text-slate-300">
                <li>
                  Wähle Emotionen oder Umweltwahrnehmungen im linken Panel.
                </li>
                <li>
                  Aktiviere Orte (Drinnen, Draußen, ÖPNV) – alle gelten mit
                  OR-Logik.
                </li>
                <li>
                  Die Farbskala reicht von 1 (niedrig) bis 5 (hoch); Kreise
                  zeigen Teilnehmendenzahlen.
                </li>
              </ul>
            </div>
            <p className="text-xs text-slate-500">
              Datenschutz: Aggregierte, anonymisierte Angaben · Lizenz: CC BY
              4.0 · Kontakt: emotionskarte@berlin.de
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-primary-200/40 bg-metric-card p-6 text-sm text-emo-textblack shadow-glow">
              <p className="text-[11px] uppercase tracking-[0.35em] text-emo-blacktext">
                Das Team hinter der Karte
              </p>
              <p className="mt-3 text-base text-emo-blacktext">
                Ein Projekt von Charité Berlin, studio-b und der Stadt Berlin.
                Datenbasis: Citizen-Science-Erhebung 2023–2024.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center text-xs uppercase tracking-[0.25em] text-slate-400 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="flex h-20 items-center justify-center rounded-2xl border border-dashed border-white/20 bg-slate-900/30"
                >
                  Logo
                </div>
              ))}
            </div>

            <button
              className="mt-2 inline-flex items-center justify-center rounded-full bg-primary-300 px-6 py-3 text-base font-semibold text-emo-textblack transition hover:bg-primary-400"
              onClick={close}
            >
              Jetzt Karte erkunden
            </button>

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
              <a
                className="underline-offset-2 hover:underline"
                href="#impressum"
              >
                Impressum
              </a>
              <a
                className="underline-offset-2 hover:underline"
                href="#datenschutz"
              >
                Datenschutz
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
