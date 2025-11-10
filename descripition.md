# Deine Emotionale Stadt — SPA requirements (final)

## Stack / run

- React 18 · Next.js 14 (App Router, single route `/`) · TypeScript
- TailwindCSS · MapLibre GL JS · pmtiles · Papa Parse
- **Run:** `npm run dev`
- **No tests**

## Public assets

```
/public
  /berlin-h3-res9.pmtiles/         # contains the .pmtiles file
  berlin_drinnen.csv
  berlin_draussen.csv
  berlin_oepnv.csv
  logos/*                          # for start modal
```

## Vector tiles (PMTiles)

- Register pmtiles protocol and load from: `pmtiles:///berlin-h3-res9.pmtiles/<file>.pmtiles`
- Vector **source name:** `h3`
- **Source-layers inside the tiles:**

  - `h3` → hexagon **polygons** (feature `id` = `hex_id`)
  - `h3_centroids` → **point centroids** (feature `id` = `hex_id`)

- OSM basemap underlay.

> If the exact layer names differ, adapt them in one config constant; otherwise assume `h3` and `h3_centroids`.

## CSV data (three files; identical header)

- `berlin_drinnen.csv`, `berlin_draussen.csv`, `berlin_oepnv.csv`

```
hex_id,Stress,Happy,Loneliness,Anxiety,Energy,EnvBeauty,EnvInteresting,EnvSafety,EnvCrowded,EnvironmentGreeness,DataPointCount
```

- Values 1–5 (nullable); `DataPointCount` integer.

## Single-page layout

```
<App>
  <IntroModal/>                 # shown once (localStorage)
  <Sidebar>                     # contains all tabs and controls
    ├─ Tab: Emotionen
    ├─ Tab: Umweltwahrnehmung
    └─ Tab: Daten (about the data)
  <Map/>                        # full viewport to the right
  <Legend/>                     # gradient + circle-size key (bottom-right)
  <Tooltip/>                    # hover
</App>
```

## Sidebar tabs & controls

- **Emotionen** metrics: `Stress, Happy, Loneliness, Anxiety, Energy`
- **Umweltwahrnehmung** metrics:
  `EnvBeauty, EnvInteresting, EnvSafety, EnvCrowded, EnvironmentGreeness`
- **Orte** multi-select: `Drinnen`, `Draußen`, `ÖPNV`
- Filters (both metric tabs):

  - Min/Max value sliders (1–5, step 0.5)
  - Min `DataPointCount` (0–50, default 1)
  - Toggle “Hide no-data”

- **Daten** tab: prose about the dataset (Über die Daten, Variablen & Skalen, Downloads, Methodik, Datenschutz, Lizenz, Kontakt). Provide download links to the three CSVs and the `.pmtiles` file.

## Map layers & styling

- Initial view: `center [13.404954, 52.520008]`, `zoom 10`.
- Add **vector source** `h3` (PMTiles).
- Layers:

  1. `h3-fill` (type `fill`, source-layer `h3`):

     - `fill-color`: by `feature-state('value')` (continuous ramp 1→5; null → gray)
     - `fill-opacity`: lower/zero when outside filter ranges or no data

  2. `h3-outline` (type `line`, source-layer `h3`): subtle stroke
  3. `h3-centroids` (type `circle`, source-layer `h3_centroids`):

     - **circle-color**: same ramp as fill, based on `feature-state('value')`
     - **circle-radius**: interpolate by **`feature-state('n')`** (from `DataPointCount`)
       Example stops (tune visually):

       ```
       ['interpolate', ['linear'], ['feature-state','n'],
         0, 0,
         5, 4,
         10, 8,
         25, 14,
         50, 18
       ]
       ```

     - Draw above `h3-fill`.

### Color ramp

```
1 → #e6f7f7
2 → #9de1e0
3 → #52c7c4
4 → #19b3ab
5 → #009a92
No data → #B0B0B0 @ 0.3 opacity
```

## Data plumbing & feature-state

1. Parse the three CSVs on load (coerce blanks → `null`).
2. Build:

   ```ts
   type Metric =
     | "Stress"
     | "Happy"
     | "Loneliness"
     | "Anxiety"
     | "Energy"
     | "EnvBeauty"
     | "EnvInteresting"
     | "EnvSafety"
     | "EnvCrowded"
     | "EnvironmentGreeness";
   type Place = "drinnen" | "draussen" | "oepnv";

   data[hexId][place] = {
     metrics: Record<Metric, number | null>,
     n: number | null,
   };
   ```

3. Compute **displayed** per-hex values from user selections:

   - `value` = average of selected places’ metric values (ignore nulls)
   - `n` = sum of selected places’ `DataPointCount` (ignore nulls)

4. Push to **both** layers via `setFeatureState` (IDs are `hex_id`):

   ```ts
   const id = hexId;
   map.setFeatureState({ source: "h3", sourceLayer: "h3", id }, { value, n });
   map.setFeatureState(
     { source: "h3", sourceLayer: "h3_centroids", id },
     { value, n }
   );
   ```

5. Filtering affects opacity/tooltip (don’t remove features).

## Interactions

- **Hover tooltip** (debounced): hex id, current tab/metric, `value` (1–5/“n/a”), `DataPointCount` (n), active places.
- **Click**: pin info card with a tiny table showing per-place values + counts.
- **Legend**: gradient 1–5, “no data” swatch, **circle size key** for `DataPointCount`.

## Intro modal

- Full-screen start modal (as in screenshot).
- Button “Jetzt Karte erkunden” closes modal and sets `localStorage.hasSeenIntro="1"`.
- Footer links: Impressum, Datenschutz (open simple static pages/modals).

## URL sync (optional)

```
?tab=emotionen|umwelt|daten
&metric=Energy
&places=drinnen,draussen,oepnv
&min=1&max=5&minN=1
&lat=52.52&lng=13.40&z=10
```

## Performance & errors

- Debounce UI-driven updates (~150 ms).
- Never re-add sources/layers; only update feature-state.
- CSV parse failure → toast; PMTiles failure → centered retry.

## Acceptance checklist

- Runs with `npm run dev`.
- Modal shows once; sidebar hosts all tabs.
- Map loads OSM + PMTiles; polygons colorize by selected metric.
- **Centroid circles come from PMTiles** and scale by **`DataPointCount`** via `feature-state('n')`.
- Filters affect opacity and tooltips.
- Legend shows gradient and circle-size key.
- “Daten” tab contains the about text and download links.

If you want, I can also output a tiny file scaffold (components and placeholders) matching these names so your codegen has exact targets to fill.
