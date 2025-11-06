#!/usr/bin/env node
/**
 * Generate Berlin H3 (res 9) PMTiles for MapLibre
 *
 * Requires:
 *   npm install h3-js
 *   brew install tippecanoe
 *   npm install -g pmtiles
 */

const fs = require("fs");
const { execSync } = require("child_process");
const os = require("os");
const path = require("path");
const h3 = require("h3-js");

// ---------- CONFIG ----------
const BOUNDARY_PATH = "./data/berlin.geojson";
const OUT_PMTILES = "./data/berlin-h3-res9.pmtiles";
const RESOLUTION = 9;
const MINZOOM = 0;
const MAXZOOM = 19;
const LAYER_NAME = "h3";
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

// Helper: write stream and wait for close
function writeNdjson(hexes, filePath) {
  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(filePath);
    for (const h of hexes) {
      const boundary = cellBoundaryLngLat(h);
      const feature = {
        type: "Feature",
        id: h,
        properties: {},
        geometry: { type: "Polygon", coordinates: [boundary] },
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
  const ndjsonPath = path.join(tmpDir, "h3.ndjson");
  const mbtilesPath = path.join(tmpDir, "h3.mbtiles");

  console.log(`Writing NDJSON to ${ndjsonPath} …`);
  await writeNdjson(hexes, ndjsonPath);

  console.log("→ tippecanoe …");
  execSync(
    `tippecanoe -o ${mbtilesPath} -l ${LAYER_NAME} -Z ${MINZOOM} -z ${MAXZOOM} --force --detect-shared-borders ${ndjsonPath}`,
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
