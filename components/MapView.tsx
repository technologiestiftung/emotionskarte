"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import clsx from "clsx";
import maplibregl, {
  Map as MapLibreMap,
  MapMouseEvent,
  MapSourceDataEvent,
} from "maplibre-gl";
import { PMTiles, Protocol } from "pmtiles";
import { useEffect, useMemo, useRef, useState } from "react";
import createBaseMapStyle from "../lib/mapStyle";
import {
  COLOR_RAMP,
  H3_CENTROID_LAYER,
  H3_HEX_LAYER,
  H3_SOURCE_NAME,
  MAP_INITIAL_VIEW,
  PLACE_LABELS,
  PMTILES_ARCHIVE,
  PMTILES_ARCHIVE_PATH,
} from "../lib/constants";
import type { HexAggregated, Metric, Place } from "../lib/types";
import { METRIC_LABELS } from "../lib/constants";

let featureStateWarningShown = false;
let protocol: Protocol | null = null;

function ensureProtocol() {
  if (!protocol) {
    protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
  }
  return protocol;
}

const COLOR_STOP_VALUES = COLOR_RAMP.flatMap(({ value, color }) => [
  value,
  color,
]);

// @ts-ignore – MapLibre expression typings don't allow null but runtime does.
const COLOR_EXPRESSION: maplibregl.ExpressionSpecification = [
  "case",
  ["==", ["feature-state", "value"], null],
  "rgba(176,176,176,0.3)",
  ["interpolate", ["linear"], ["feature-state", "value"], ...COLOR_STOP_VALUES],
];

const CIRCLE_RADIUS_EXPRESSION: maplibregl.ExpressionSpecification = [
  "case",
  ["boolean", ["feature-state", "visible"], false],
  [
    "interpolate",
    ["linear"],
    ["coalesce", ["feature-state", "n"], 0],
    0,
    0,
    5,
    4,
    10,
    8,
    25,
    14,
    50,
    18,
  ],
  0,
];

const CIRCLE_OPACITY_EXPRESSION: maplibregl.ExpressionSpecification = [
  "coalesce",
  ["feature-state", "circleOpacity"],
  0,
];

type MapViewProps = {
  mapData: Record<string, HexAggregated>;
  metric: Metric;
  activePlaces: Place[];
  loading: boolean;
  error?: string | null;
  setHexId: (hexId: string | null) => void;
};

type TooltipState = {
  hexId: string;
  x: number;
  y: number;
  info: HexAggregated;
};

export default function MapView({
  mapData,
  metric,
  activePlaces,
  loading,
  error,
  setHexId,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dataRef = useRef(mapData);
  const metricRef = useRef<Metric>(metric);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [tileError, setTileError] = useState<string | null>(null);

  // keep refs in sync with latest props
  dataRef.current = mapData;
  metricRef.current = metric;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      // @ts-ignore
      style: createBaseMapStyle(),
      center: MAP_INITIAL_VIEW.center,
      zoom: MAP_INITIAL_VIEW.zoom,
      attributionControl: false,
    });

    mapRef.current = map;

    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      "top-left"
    );
    map.addControl(new maplibregl.AttributionControl({ compact: true }));

    let sourceDataListener: ((e: MapSourceDataEvent) => void) | null = null;

    map.on("load", () => {
      try {
        const proto = ensureProtocol();
        proto.add(new PMTiles(`/${PMTILES_ARCHIVE_PATH}`));
      } catch (pmtilesError) {
        console.error("PMTiles protocol error", pmtilesError);
      }

      if (!map.getSource(H3_SOURCE_NAME)) {
        map.addSource(H3_SOURCE_NAME, {
          type: "vector",
          url: PMTILES_ARCHIVE,
          promoteId: {
            [H3_HEX_LAYER]: "h3",
            [H3_CENTROID_LAYER]: "h3",
          },
        });
      }

      if (!map.getLayer("h3-centroids")) {
        map.addLayer({
          id: "h3-centroids",
          type: "circle",
          source: H3_SOURCE_NAME,
          "source-layer": H3_CENTROID_LAYER,
          paint: {
            "circle-color": "#ffffff",
            "circle-opacity": CIRCLE_OPACITY_EXPRESSION,
            "circle-radius": CIRCLE_RADIUS_EXPRESSION,
            "circle-stroke-width": 0,
            "circle-stroke-color": "#0f172a",
          },
        });
      }

      if (!map.getLayer("h3-fill")) {
        map.addLayer({
          id: "h3-fill",
          type: "fill",
          source: H3_SOURCE_NAME,
          "source-layer": H3_HEX_LAYER,
          paint: {
            "fill-color": COLOR_EXPRESSION,
            "fill-opacity": 0.4,
          },
        });
      }

      if (!map.getLayer("h3-outline")) {
        map.addLayer({
          id: "h3-outline",
          type: "line",
          source: H3_SOURCE_NAME,
          "source-layer": H3_HEX_LAYER,
          paint: {
            "line-color": "#222",
            "line-opacity": 0.1,
            "line-width": 0.5,
          },
        });
      }

      // apply current data once immediately
      updateFeatureStates(map, dataRef.current);

      // re-apply whenever tiles for our source finish loading
      sourceDataListener = (event: MapSourceDataEvent) => {
        if (
          event.sourceId === H3_SOURCE_NAME &&
          (event.isSourceLoaded ||
            // some versions expose loaded() on the source
            ((event.source as any)?.loaded?.() ?? false))
        ) {
          updateFeatureStates(map, dataRef.current);
        }
      };

      map.on("sourcedata", sourceDataListener);

      setupInteractions(map);

      map.on("click", (event) => {
        const features = map.queryRenderedFeatures(event.point, {
          layers: ["h3-fill", "h3-centroids"],
        });
        if (!features.length) {
          popupRef.current?.remove();
          setHexId(null);
        }
      });

      setTileError(null);
      setMapLoaded(true);
    });

    map.on("error", (event) => {
      // @ts-ignore
      if (event?.sourceId === H3_SOURCE_NAME || event?.error) {
        setTileError("Kartendaten konnten nicht geladen werden.");
      }
    });

    return () => {
      popupRef.current?.remove();
      if (sourceDataListener) {
        map.off("sourcedata", sourceDataListener);
      }
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // re-apply feature state when aggregated data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) {
      return;
    }
    const timeout = window.setTimeout(() => {
      updateFeatureStates(map, mapData);
    }, 50);
    return () => window.clearTimeout(timeout);
  }, [mapData, mapLoaded]);

  // close popup when metric changes (optional but fine)
  useEffect(() => {
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }
  }, [metric]);

  const activePlacesLabel = useMemo(() => {
    if (!activePlaces.length) {
      return "Ort";
    }
    return PLACE_LABELS[activePlaces[0]];
  }, [activePlaces]);

  const setupInteractions = (map: MapLibreMap) => {
    const layers: Array<"h3-fill" | "h3-centroids"> = [
      "h3-fill",
      // "h3-centroids",
    ];
    layers.forEach((layerId) => {
      map.on("mousemove", layerId, (event) => handleHover(event));
      map.on("mouseenter", layerId, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", layerId, () => {
        handleMouseLeave();
        map.getCanvas().style.cursor = "";
      });
      map.on("click", layerId, (event) => handleClick(event));
    });
  };

  // @ts-ignore
  const handleHover = (event: MapMouseEvent & maplibregl.EventData) => {
    if (hoverTimeout.current) {
      window.clearTimeout(hoverTimeout.current);
    }
    // @ts-ignore
    hoverTimeout.current = window.setTimeout(() => {
      const features = event.features ?? [];
      const feature = features[0];
      if (!feature?.id) {
        setTooltip(null);
        return;
      }
      const hexId = String(feature.id);
      const info = dataRef.current[hexId];
      if (!info) {
        setTooltip(null);
        return;
      }
      setTooltip({
        hexId,
        x: event.point.x,
        y: event.point.y,
        info,
      });
    }, 150);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) {
      window.clearTimeout(hoverTimeout.current);
    }
    setTooltip(null);
  };

  // @ts-ignore
  const handleClick = (event: MapMouseEvent & maplibregl.EventData) => {
    const feature = event.features?.[0];
    if (!feature?.id) {
      return;
    }
    const hexId = String(feature.id);
    setHexId(hexId);
    const info = dataRef.current[hexId];
    if (!info) {
      return;
    }
    const popup =
      popupRef.current ??
      new maplibregl.Popup({ closeOnClick: true, closeButton: true });
    popupRef.current = popup;

    const currentMetric = metricRef.current;

    const tableRows = (Object.keys(info.places) as Place[])
      .map((place) => {
        const entry = info.places[place];
        const value = entry.value != null ? entry.value.toFixed(2) : "n/a";
        const n = entry.n != null ? entry.n : "n/a";
        return `<tr><td>${PLACE_LABELS[place]}</td><td class="text-right">${value}</td><td class="text-right">${n}</td></tr>`;
      })
      .join("");

    popup
      .setLngLat(event.lngLat)
      .setHTML(
        `
        <div class="min-w-[220px] text-sm bg-emo-black p-3">
          <h3 class="text-base font-semibold">Hex ${hexId}</h3>
          <p class="mt-1">Durchschnittswert für ${
            METRIC_LABELS[currentMetric]
          }</p>
          <p class="mt-1">Durchschnitt: ${
            info.value != null ? info.value.toFixed(2) : "n/a"
          }</p>
          <p class="mt-1">Teilnehmer:innen: ${info.n}</p>
          <table class="mt-3 w-full border-collapse text-xs">
            <thead>
              <tr>
                <th class="text-left">Ort</th>
                <th class="text-right">Wert</th>
                <th class="text-right">Teiln.</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
      `
      )
      .addTo(mapRef.current!);
  };

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="absolute inset-0 h-full" />
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-emo-black text-sm uppercase tracking-[0.4em] text-slate-200">
          Daten werden geladen …
        </div>
      )}
      {(error || tileError) && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="rounded-3xl border border-red-500/40 bg-emo-textblack/90 px-6 py-4 text-sm text-red-300 shadow-glow">
            {error ?? tileError}
          </div>
        </div>
      )}
      {tooltip && (
        <div
          className={clsx(
            "pointer-events-none absolute z-20 w-60 rounded-3xl border border-white/10 bg-emo-black p-4 text-xs text-slate-100 shadow-glow backdrop-blur"
          )}
          style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
        >
          <p className="text-[11px] uppercase tracking-[0.35em] text-primary-100">
            {metric}
          </p>
          <p className="mt-2 text-sm font-semibold">Hex {tooltip.hexId}</p>
          <p className="mt-1 text-xs text-slate-300">
            Durchschnitt:{" "}
            {tooltip.info.value != null ? tooltip.info.value.toFixed(2) : "n/a"}
          </p>
          <p className="text-xs text-slate-300">
            Teilnehmer:innen: {tooltip.info.hasData ? tooltip.info.n : "n/a"}
          </p>
          <p className="mt-3 text-[11px] uppercase tracking-[0.35em] text-slate-500">
            Aktive Orte
          </p>
          <p className="text-xs text-slate-200">{activePlacesLabel}</p>
        </div>
      )}
    </div>
  );
}

function updateFeatureStates(
  map: MapLibreMap,
  entries: Record<string, HexAggregated>
) {
  const src: any = map.getSource(H3_SOURCE_NAME);
  const loaded =
    src?.loaded?.() ??
    src?.isSourceLoaded?.() ??
    // fallback: if method doesn’t exist, assume loaded
    true;

  if (!loaded && !featureStateWarningShown) {
    console.warn("updateFeatureStates called before source is fully loaded");
    featureStateWarningShown = true;
  }

  for (const [hexId, info] of Object.entries(entries)) {
    const state = {
      value: info.value,
      n: info.n,
      hasData: info.hasData ? 1 : 0,
      passesFilter: info.passesFilter ? 1 : 0,
      visible: info.visible,
      opacity: info.hasData
        ? info.passesFilter
          ? 0.8
          : 0.15
        : info.visible
        ? 0.1
        : 0,
      circleOpacity: info.hasData
        ? info.passesFilter
          ? 0.9
          : 0.2
        : info.visible
        ? 0.05
        : 0,
    };

    try {
      map.setFeatureState(
        { source: H3_SOURCE_NAME, sourceLayer: H3_HEX_LAYER, id: hexId },
        state
      );
      map.setFeatureState(
        { source: H3_SOURCE_NAME, sourceLayer: H3_CENTROID_LAYER, id: hexId },
        state
      );
    } catch (error) {
      if (!featureStateWarningShown) {
        console.warn("Feature state update failed", error);
        featureStateWarningShown = true;
      }
    }
  }
}
