import "maplibre-gl/dist/maplibre-gl.css";
import { MapManager } from "./MapManager";
import "./style.css";

new MapManager({
  container: "map",
  style: `https://api.mapbox.com/styles/v1/mapbox/outdoors-v11?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}`,
  center: [0, 0],
  zoom: 1,
});
