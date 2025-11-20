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
  BERLIN_BOUNDS,
  SIDEBAR_WIDTH,
} from "../lib/constants";
import type { HexAggregated, Metric, Place } from "../lib/types";
import { METRIC_LABELS } from "../lib/constants";
import { metricClass } from "../lib/utils";

import { useIsDesktopMdUp } from "../hooks/useIsDesktopMdUp";

let featureStateWarningShown = false;
let protocol: Protocol | null = null;

function ensureProtocol() {
  if (!protocol) {
    protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
  }
  return protocol;
}

// 5 non-linear buckets based on n
const SIZE_BUCKET = [
  "step",
  ["coalesce", ["feature-state", "n"], 0],
  0, // default for n <= 0

  1,
  0.2, // 1–4
  5,
  0.4, // 5–9
  10,
  0.6, // 10–24
  25,
  0.8, // 25–49
  50,
  1.0, // 50+
];

// visible → 1, invisible → 0
const VISIBLE_FACTOR = [
  "case",
  ["boolean", ["feature-state", "visible"], false],
  1,
  0,
];

const INCREASER = 2.4;
const CIRCLE_RADIUS_EXPRESSION = [
  "interpolate",
  ["exponential", 2],
  ["zoom"],

  // zoom 9
  9,
  [
    "*",
    1.75 * INCREASER, // base radius at z9
    SIZE_BUCKET,
    VISIBLE_FACTOR,
  ],

  // zoom 12
  12,
  [
    "*",
    14 * INCREASER, // base radius at z12 (fits hex)
    SIZE_BUCKET,
    VISIBLE_FACTOR,
  ],

  // zoom 15
  15,
  [
    "*",
    112 * INCREASER, // base radius at z15
    SIZE_BUCKET,
    VISIBLE_FACTOR,
  ],

  // zoom 18 (NEW)
  18,
  [
    "*",
    896 * INCREASER, // 14 * 2^(18-12) = 896
    SIZE_BUCKET,
    VISIBLE_FACTOR,
  ],
];

// @ts-ignore – MapLibre expression typings don't allow null but runtime does.
function createColorExpression(
  metric: Metric
): maplibregl.ExpressionSpecification {
  const ramp = COLOR_RAMP[metric];
  const stopValues = ramp.flatMap(({ value, color }) => [value, color]);
  // @ts-ignore – MapLibre expression typings don't allow null but runtime does.
  return [
    "case",
    ["==", ["feature-state", "value"], null],
    "rgba(176,176,176,0.3)",
    ["interpolate", ["linear"], ["feature-state", "value"], ...stopValues],
  ];
}

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

  const dataRef = useRef(mapData);
  const metricRef = useRef<Metric>(metric);
  const selectedHexIdRef = useRef<string | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [tileError, setTileError] = useState<string | null>(null);

  const isDesktop = useIsDesktopMdUp();

  // keep refs in sync with latest props
  dataRef.current = mapData;
  metricRef.current = metric;

  const handleZoomIn = () => {
    const map = mapRef.current;
    if (!map) return;
    map.zoomIn();
  };

  const handleZoomOut = () => {
    const map = mapRef.current;
    if (!map) return;
    map.zoomOut();
  };

  // helper to clear selected feature state
  function clearSelection() {
    const map = mapRef.current;
    const prevId = selectedHexIdRef.current;
    if (!map || !prevId) return;

    try {
      map.setFeatureState(
        { source: H3_SOURCE_NAME, sourceLayer: H3_HEX_LAYER, id: prevId },
        { selected: false }
      );
      map.setFeatureState(
        { source: H3_SOURCE_NAME, sourceLayer: H3_CENTROID_LAYER, id: prevId },
        { selected: false }
      );
    } catch (error) {
      if (!featureStateWarningShown) {
        console.warn("Failed to clear selection feature state", error);
        featureStateWarningShown = true;
      }
    }

    selectedHexIdRef.current = null;
  }

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // assuming SIDEBAR_WIDTH is in px as a number
    map.setPadding({
      left: isDesktop ? SIDEBAR_WIDTH : 0,
      right: 0,
      top: 0,
      bottom: 0,
    });

    // optional: re-render to respect new padding
    map.resize();
  }, [isDesktop, mapLoaded]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      // @ts-ignore
      style: createBaseMapStyle(),
      center: MAP_INITIAL_VIEW.center,
      maxBounds: BERLIN_BOUNDS,
      zoom: MAP_INITIAL_VIEW.zoom,
      attributionControl: false,
      // hash: true,
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
            // @ts-ignore
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
            // use the current metric for the initial color expression
            "fill-color": createColorExpression(metricRef.current),
            "fill-opacity": 0.6,
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
            "line-color": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              "#F4F4F6", // thicker when selected
              "#928FA3", // default outline
            ],
            "line-opacity": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              0.8, // thicker when selected
              0.4, // default outline
            ],
            "line-width": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              3, // thicker when selected
              0.1, // default outline
            ],
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

      // click on empty map → close popup + clear selection
      map.on("click", (event) => {
        const features = map.queryRenderedFeatures(event.point, {
          layers: ["h3-fill"],
        });
        if (!features.length) {
          popupRef.current?.remove();
          clearSelection();
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

  // update fill color ramp when metric changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const newExpression = createColorExpression(metric);
    if (map.getLayer("h3-fill")) {
      map.setPaintProperty("h3-fill", "fill-color", newExpression);
    }
  }, [metric, mapLoaded]);

  // close popup when metric changes (optional but fine)
  useEffect(() => {
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }
    // also clear selection when metric changes, to avoid stale highlight
    clearSelection();
  }, [metric]);

  const activePlacesLabel = useMemo(() => {
    if (!activePlaces.length) {
      return "Ort";
    }
    return PLACE_LABELS[activePlaces[0]];
  }, [activePlaces]);

  const setupInteractions = (map: MapLibreMap) => {
    const layers: Array<"h3-fill"> = ["h3-fill"];
    layers.forEach((layerId) => {
      map.on("mouseenter", layerId, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", layerId, () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("click", layerId, (event) => handleClick(event));
    });
  };

  // @ts-ignore
  const handleClick = (event: MapMouseEvent & maplibregl.EventData) => {
    const feature = event.features?.[0];
    if (!feature?.id) {
      return;
    }
    const hexId = String(feature.id);

    // external state
    setHexId(hexId);

    const info = dataRef.current[hexId];
    if (!info) {
      return;
    }

    const map = mapRef.current;
    if (!map) return;

    // --- selection highlight logic ---
    // clear previous selection
    clearSelection();

    try {
      map.setFeatureState(
        { source: H3_SOURCE_NAME, sourceLayer: H3_HEX_LAYER, id: hexId },
        { selected: true }
      );
      map.setFeatureState(
        { source: H3_SOURCE_NAME, sourceLayer: H3_CENTROID_LAYER, id: hexId },
        { selected: true }
      );
      selectedHexIdRef.current = hexId;
    } catch (error) {
      if (!featureStateWarningShown) {
        console.warn("Feature state selection failed", error);
        featureStateWarningShown = true;
      }
    }
    // --- end selection highlight logic ---

    const popup =
      popupRef.current ??
      new maplibregl.Popup({ closeOnClick: true, closeButton: true });

    // if it's a new popup instance, connect close event once
    if (!popupRef.current) {
      popup.on("close", () => {
        clearSelection();
        setHexId(null);
      });
    }

    popupRef.current = popup;

    const currentMetric = metricRef.current;

    popup
      .setLngLat(event.lngLat)
      .setHTML(
        `
        <div class=" max-w-[calc(100vw-3rem)] text-sm bg-emo-black p-3 rounded-md border border-emo-grey break-words">
          <h3 class="text-base font-semibold">Werte in diesem Hexagon</h3>
          <p class="mt-1 text-lg ${metricClass(currentMetric, "text")}" >
          Durchschnittswert für ${METRIC_LABELS[currentMetric]}: ${
          info.value != null ? info.value.toFixed(1) : "k.a."
        }
          </p>
          <p class="mt-0 text-lg">Einträge: ${info.n}</p>
        </div>
      `
      )
      .addTo(mapRef.current!);
  };

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="absolute inset-0 h-full" />
      <div className="pointer-events-none absolute top-3 right-3 z-20">
        <div className="pointer-events-auto flex flex-col overflow-hidden rounded-md border border-emo-grey bg-emo-black">
          {/* Zoom in */}
          <button
            type="button"
            aria-label="Zoom in"
            onClick={handleZoomIn}
            className="flex h-10 w-10 items-center justify-center font-light text-white hover:bg-white/10 text-3xl"
          >
            +
          </button>

          {/* Divider */}
          <div className="h-px w-full bg-white/20" />

          {/* Zoom out */}
          <button
            type="button"
            aria-label="Zoom out"
            onClick={handleZoomOut}
            className="flex h-10 w-10 items-center justify-center font-light text-white hover:bg-white/10 text-3xl"
          >
            –
          </button>
        </div>
      </div>

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
