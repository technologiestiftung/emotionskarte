#!/usr/bin/env node
/**
 * Generate Berlin H3 (res 9) PMTiles for MapLibre
 *
 * Requires:
 *   npm install --save-dev h3-js
 *   brew install tippecanoe
 *   npm install --save-dev pmtiles
 */

const fs = require("fs");
const { execSync } = require("child_process");
const os = require("os");
const path = require("path");
const h3 = require("h3-js");

// ---------- CONFIG ----------
const BOUNDARY_PATH = "../data/berlin.geojson";
const OUT_PMTILES = "../data/berlin-h3-res9.pmtiles";
const RESOLUTION = 9;
const MINZOOM = 0;
const MAXZOOM = 19;
const LAYER_HEXES = "h3";
const LAYER_CENTROIDS = "h3_centroids";
// ----------------------------

function loadGeoJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function* iterPolygons(geo) {
  const t = geo.type;
  if (t === "FeatureCollection") {
    for (const feat of geo.features) yield* iterPolygons(feat.geometry);
  } else if (t === "Feature") {
    yield* iterPolygons(geo.geometry);
  } else if (t === "Polygon") {
    yield geo;
  } else if (t === "MultiPolygon") {
    for (const coords of geo.coordinates)
      yield { type: "Polygon", coordinates: coords };
  } else {
    throw new Error(`Unsupported geometry type: ${t}`);
  }
}

function makeClosed(coords) {
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) coords.push(first);
  return coords;
}

function polygonToH3(coordsLngLat, res) {
  // Convert [lng, lat] -> [lat, lng]
  const latlng = coordsLngLat.map(([lng, lat]) => [lat, lng]);

  // h3-js v4 uses polygonToCells, v3 uses polyfill
  if (typeof h3.polygonToCells === "function") {
    return h3.polygonToCells(latlng, res);
  } else if (typeof h3.polyfill === "function") {
    return h3.polyfill(latlng, res);
  } else {
    throw new Error("Neither polygonToCells nor polyfill found in h3-js");
  }
}

function cellBoundaryLngLat(cell) {
  if (typeof h3.cellToBoundaryGeo === "function") {
    // v4 returns [[lng,lat]]
    return makeClosed(h3.cellToBoundaryGeo(cell));
  } else if (typeof h3.cellToBoundary === "function") {
    // v3 returns [[lng,lat]]
    return makeClosed(h3.cellToBoundary(cell, true));
  } else {
    throw new Error("No cell boundary function found");
  }
}

function cellCentroidLngLat(cell) {
  if (typeof h3.cellToLatLng === "function") {
    // v4 returns [lat, lng]
    const [lat, lng] = h3.cellToLatLng(cell);
    return [lng, lat];
  } else if (typeof h3.h3ToGeo === "function") {
    // v3 returns [lat, lng]
    const [lat, lng] = h3.h3ToGeo(cell);
    return [lng, lat];
  } else if (typeof h3.cellToCoordinate === "function") {
    // some builds use cellToCoordinate -> {lat, lng}
    const { lat, lng } = h3.cellToCoordinate(cell);
    return [lng, lat];
  }
  throw new Error("No cell centroid function found");
}

// Helper: write polygon features (one per hex) as NDJSON
function writeHexPolygonsNdjson(hexes, filePath) {
  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(filePath);
    for (const h of hexes) {
      const boundary = cellBoundaryLngLat(h);
      console.log("ÄÄÄÄ", h);

      const feature = {
        type: "Feature",
        //i d: h,
        properties: { h3: h },
        geometry: { type: "Polygon", coordinates: [boundary] },
      };
      stream.write(JSON.stringify(feature) + "\n");
    }
    stream.end();
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

// Helper: write centroid point features (no props, just id) as NDJSON
function writeHexCentroidsNdjson(hexes, filePath) {
  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(filePath);
    for (const h of hexes) {
      const [lng, lat] = cellCentroidLngLat(h);
      const feature = {
        type: "Feature",
        //id: h,
        properties: { h3: h },
        geometry: { type: "Point", coordinates: [lng, lat] },
      };
      stream.write(JSON.stringify(feature) + "\n");
    }
    stream.end();
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

async function main() {
  console.log("Generating H3 PMTiles...");
  console.log("Using h3-js version:", h3.VERSION || "unknown");

  const berlin = loadGeoJSON(BOUNDARY_PATH);
  const hexes = new Set();

  for (const poly of iterPolygons(berlin)) {
    const coords = poly.coordinates[0]; // exterior ring
    for (const h of polygonToH3(coords, RESOLUTION)) hexes.add(h);
  }
  console.log("Total hexes:", hexes.size);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "h3_"));
  const ndjsonPolys = path.join(tmpDir, "h3_polygons.ndjson");
  const ndjsonCentroids = path.join(tmpDir, "h3_centroids.ndjson");
  const mbtilesPath = path.join(tmpDir, "h3.mbtiles");

  console.log(`Writing polygon NDJSON to ${ndjsonPolys} …`);
  await writeHexPolygonsNdjson(hexes, ndjsonPolys);

  console.log(`Writing centroid NDJSON to ${ndjsonCentroids} …`);
  await writeHexCentroidsNdjson(hexes, ndjsonCentroids);

  console.log("→ tippecanoe (polygons + centroids) …");
  // Use -L to provide multiple input layers in one go.
  execSync(
    [
      "tippecanoe",
      `-o ${mbtilesPath}`,
      `-Z ${MINZOOM}`,
      `-z ${MAXZOOM}`,
      "--force",
      "--detect-shared-borders",
      "--no-feature-limit",
      "--no-tile-size-limit",
      "-r1", // 👈 keep all points at all zooms
      `-L ${LAYER_HEXES}:${ndjsonPolys}`,
      `-L ${LAYER_CENTROIDS}:${ndjsonCentroids}`,
    ].join(" "),
    { stdio: "inherit" }
  );

  console.log("→ pmtiles convert …");
  execSync(`pmtiles convert ${mbtilesPath} ${OUT_PMTILES}`, {
    stdio: "inherit",
  });

  console.log(`✅ Done! PMTiles written to ${OUT_PMTILES}`);
  console.log(`Temp files in: ${tmpDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
