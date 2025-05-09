import "maplibre-gl/dist/maplibre-gl.css";
import { MapManager } from "./MapManager";
import "./style.css";

new MapManager({
  container: "map",
  style: `https://tiles.stadiamaps.com/styles/outdoors.json?api_key=${import.meta.env.VITE_STADIA_MAPS_API_KEY}`,
  center: [0, 0],
  zoom: 1,
});
