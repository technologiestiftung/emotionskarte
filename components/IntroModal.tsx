"use client";

import { useEffect } from "react";

const STORAGE_KEY = "emotionskarte_has_seen_intro";

export type ModalProps = {
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
};

import Icon from "../components/Icon";
import { type IconName } from "../icons";
const icons: IconName[] = [
  "tu",
  "hu",
  "charite",
  "bua",
  "eu",
  "stiftungUp",
  "tsb",
  "odis",
  "berlin",
];

export default function IntroModal(props: ModalProps) {
  const { modalVisible, setModalVisible } = props;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasSeen = window.localStorage.getItem(STORAGE_KEY) === "1";
    setModalVisible(!hasSeen);
  }, [setModalVisible]);

  const close = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
    setModalVisible(false);
  };

  if (!modalVisible) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={close}
    >
      {/* Outer frame */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative mx-4 my-8 w-full max-w-5xl max-h-[90vh] overflow-y-auto border rounded-sm border-emo-grey bg-emo-black text-slate-100"
      >
        {/* Close button */}
        <button
          onClick={close}
          className="absolute right-6 top-6 text-xl text-slate-300 hover:text-white"
          aria-label="Intro schließen"
        >
          ×
        </button>

        {/* Inner content */}
        <div className="grid gap-10 px-8 py-10 md:grid-cols-[100px,minmax(0,1fr)]">
          {/* LEFT COLUMN – logo + small footer */}
          <aside className="flex flex-col justify-between pb-8 md:pb-0">
            {/* Big logo placeholder */}
            <div className="flex items-start">
              <div className="flex h-64 w-full items-center justify-center rounded ">
                <span className="text-xs uppercase tracking-[0.35em]">
                  <Icon name={"emocity"} className={"w-40 h-40 text-white"} />
                </span>
              </div>
            </div>
          </aside>

          {/* RIGHT COLUMN – text, button, logos */}
          <section className="flex flex-col">
            {/* Headline & description */}
            <header className="space-y-4">
              <h1 className="text-3xl font-semibold md:text-4xl">
                Deine Emotionale Stadt
              </h1>

              <div className="space-y-3 text-sm leading-relaxed text-slate-200">
                <div>
                  <h2 className="mb-1 text-base font-semibold">
                    Was ist auf der Karte zu sehen?
                  </h2>
                  <p>
                    Diese interaktive Kartenvisualisierung stellt die Ergebnisse
                    einer App-basierten Datenerhebung im Rahmen des Projekts{" "}
                    <span className="font-semibold">
                      Deine Emotionale Stadt
                    </span>{" "}
                    dar. Über einen festgelegten Zeitraum hinweg wurden
                    Berliner:innen regelmäßig zu ihren Gefühlen und ihrer
                    Wahrnehmung der Umgebung befragt.
                  </p>
                </div>

                <div className="mt-4">
                  <h2 className="mb-1 text-base font-semibold">
                    Wie nutze ich die Karte?
                  </h2>
                  <p>
                    Die Karte visualisiert die Emotionsempfindungen der
                    Berliner:innen. In der linken Seitenleiste können
                    Nutzer:innen zwischen den fünf Emotionen – Angst, Stress,
                    Einsamkeit, Energie und Freude – wählen. Zusätzlich besteht
                    die Möglichkeit, verschiedene Umgebungen auszuwählen, in
                    denen die Teilnehmer:innen befragt wurden: Drinnen, draußen
                    oder im öffentlichen Nahverkehr (ÖPNV). Durch das Auswählen
                    einzelner Balken lassen sich die Werte von 1 bis 5 für jede
                    Emotion entweder einzeln oder in Kombination anzeigen. Die
                    Visualisierung der Umweltwahrnehmung kann in einem separaten
                    Tab nach derselben Logik erkundet werden. Bei Interesse
                    besteht die Möglichkeit, die Daten herunterzuladen.
                  </p>
                </div>

                <div className="mt-4">
                  <h2 className="mb-1 text-base font-semibold">
                    Das Team hinter der Karte
                  </h2>
                  <p>
                    Das Projekt wird in Zusammenarbeit von der Charité Berlin,
                    sowie dem Public Data Team des CityLAB Berlin konzipiert und
                    umgesetzt.
                  </p>
                </div>
              </div>
            </header>

            {/* CTA button */}
            <div className="mt-6">
              <button
                onClick={close}
                className="inline-flex items-center justify-center rounded-sm bg-white px-6 py-2.5 text-sm font-semibold text-black shadow-sm transition hover:bg-slate-100"
              >
                Jetzt Karte erkunden
              </button>
            </div>

            {/* Logos row */}
            <div className="mt-10 pt-6">
              <div className="flex flex-wrap items-center justify-center gap-4 md:justify-between">
                {icons.map((name, index) => (
                  <div
                    key={index}
                    className="flex h-12 w-32 items-center justify-center text-[10px] uppercase tracking-[0.25em] "
                  >
                    <Icon name={name} raw className={"w-34 h-34"} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="border-t border-slate-300 w-full mt-8"></div>

        <section className="flex flex-col px-8 py-4 md:px-8 md:pt-4">
          <div className="md:ml-[100px] text-sm text-slate-300">
            {" "}
            {/* or md:ml-[logoColumnWidth] */}
            <div className="flex flex-wrap gap-4">
              <a
                href="https://www.technologiestiftung-berlin.de/impressum"
                className="underline-offset-2 hover:underline"
              >
                Impressum
              </a>
              <a
                href="https://www.technologiestiftung-berlin.de/datenschutz"
                className="underline-offset-2 hover:underline"
              >
                Datenschutz
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
