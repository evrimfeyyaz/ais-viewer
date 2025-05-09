import "maplibre-gl/dist/maplibre-gl.css";
import { MapManager } from "./MapManager";
import "./style.css";

new MapManager({
  container: "map",
  style: `https://api.maptiler.com/maps/basic-v2/style.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`,
  center: [0, 0],
  zoom: 1,
});
