export default function createBaseMapStyle() {
  return {
    version: 8,
    name: "emotionskarte",
    metadata: {},
    transition: {
      duration: 3500,
      delay: 0,
    },
    sources: {
      osm: {
        type: "raster" as const,
        tiles: ["https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"],
        tileSize: 256,
        attribution:
          "&copy; <a target='_blank' href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors &copy; <a target='_blank' href='https://carto.com/attributions'>CARTO</a>",
      },
    },
    layers: [
      {
        id: "background",
        type: "background" as const,
        paint: {
          "background-color": "#000",
        },
      },
      // {
      //   id: "osm",
      //   type: "raster" as const,
      //   source: "osm",
      //   minzoom: 0,
      //   maxzoom: 19,
      // },
    ],
  };
}
