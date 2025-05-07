import "maplibre-gl/dist/maplibre-gl.css";
import { MapManager } from "./MapManager";
import "./style.css";

new MapManager({
  container: "map",
  style: "https://demotiles.maplibre.org/style.json",
  center: [0, 0],
  zoom: 1,
});
