import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div id="map" style="width: 100%; height: 100vh;"></div>
`

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json',
  center: [0, 0],
  zoom: 1
});