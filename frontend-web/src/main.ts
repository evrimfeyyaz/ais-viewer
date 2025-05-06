import maplibregl, { GeoJSONSource, Map, type Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./style.css";
const VESSELS_SOURCE_ID = "vessels-source";
const VESSELS_LAYER_ID = "vessels-layer";
const SHIP_ICON_ID = "ship-icon";
const SHIP_ICON_PATH = "/ship-icon.png";
const MIN_ZOOM_LEVEL = 12;
const UPDATE_INTERVAL_MS = 10000; // 10 seconds

type VesselData = {
  mmsi: number;
  name: string;
  lat: number;
  lon: number;
  course: number;
};

let activePopup: Popup | null = null;

const zoomMessageElement = document.getElementById("zoom-message");

/**
 * Transforms the raw vessel data array from the API into a GeoJSON FeatureCollection.
 * @param vessels - Array of vessel data objects.
 * @returns GeoJSON FeatureCollection.
 */
function transformToGeoJSON(
  vessels: VesselData[],
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  const features: GeoJSON.Feature<GeoJSON.Point>[] = vessels.map((vessel) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [vessel.lon, vessel.lat],
    },
    properties: {
      mmsi: vessel.mmsi,
      course: vessel.course,
      name: vessel.name,
    },
  }));

  return {
    type: "FeatureCollection",
    features: features,
  };
}

function updateZoomMessageVisibility(
  map: Map,
  messageElement: HTMLElement | null,
) {
  if (!messageElement) return;

  const zoom = map.getZoom();
  if (zoom < MIN_ZOOM_LEVEL) {
    messageElement.style.display = "block"; // Show message
  } else {
    messageElement.style.display = "none"; // Hide message
  }
}

/**
 * Fetches vessel data for the current map view and updates the map source.
 * @param map - The MapLibre GL JS map instance.
 */
async function updateVessels(map: Map) {
  const zoom = map.getZoom();
  const vesselsSource = map.getSource(VESSELS_SOURCE_ID) as
    | GeoJSONSource
    | undefined;

  if (zoom < MIN_ZOOM_LEVEL || !vesselsSource) {
    if (vesselsSource) {
      vesselsSource.setData({ type: "FeatureCollection", features: [] });
      console.log(
        `Zoom level ${zoom.toFixed(2)} < ${MIN_ZOOM_LEVEL}, clearing vessels.`,
      );
    }
    return;
  }

  const bounds = map.getBounds();
  const minLon = bounds.getWest();
  const minLat = bounds.getSouth();
  const maxLon = bounds.getEast();
  const maxLat = bounds.getNorth();

  const apiUrl = `/api/vessels?min-lon=${minLon}&min-lat=${minLat}&max-lon=${maxLon}&max-lat=${maxLat}`;

  console.log(
    `Fetching vessels for zoom ${zoom.toFixed(2)}, bounds: ${bounds.toString()}`,
  );

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`,
      );
    }
    const vesselsData: VesselData[] = await response.json();

    const geojsonData = transformToGeoJSON(vesselsData);

    vesselsSource.setData(geojsonData);
    console.log(`Updated map with ${vesselsData.length} vessels.`);
  } catch (error) {
    console.error("Error fetching or updating vessel data:", error);
  }
}

const map = new maplibregl.Map({
  container: "map",
  style: "https://demotiles.maplibre.org/style.json",
  center: [0, 0],
  zoom: 1,
});

map.on("load", async () => {
  console.log("Map loaded.");

  updateZoomMessageVisibility(map, zoomMessageElement);

  const shipIconResponse = await map.loadImage(SHIP_ICON_PATH);
  const shipIcon = shipIconResponse.data;
  map.addImage(SHIP_ICON_ID, shipIcon);

  console.log("Ship icon loaded and added to map style.");

  map.addSource(VESSELS_SOURCE_ID, {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [],
    },
  });

  map.addLayer({
    id: VESSELS_LAYER_ID,
    type: "symbol",
    source: VESSELS_SOURCE_ID,
    minzoom: MIN_ZOOM_LEVEL,
    layout: {
      "icon-image": SHIP_ICON_ID,
      "icon-size": 0.25,
      "icon-rotate": ["get", "course"],
      "icon-rotation-alignment": "map",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
  });
  console.log("Vessel source and layer added.");

  map.on("click", VESSELS_LAYER_ID, (e) => {
    if (activePopup) {
      activePopup.remove();
      activePopup = null;
    }

    if (!e.features || e.features.length === 0) {
      return;
    }

    const feature = e.features[0];
    if (feature.geometry.type !== "Point") {
      return;
    }

    const coordinates = feature.geometry.coordinates.slice() as [
      number,
      number,
    ];
    const properties = feature.properties;
    const vesselName = properties?.name.trim() || "Unnamed Vessel";
    const mmsi = properties.mmsi;

    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    const popupContent = `
        <div style="font-family: sans-serif; font-size: 14px;">
            <strong>${vesselName}</strong><br>
            MMSI: ${mmsi}
        </div>
    `;

    activePopup = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false,
      offset: 15,
    })
      .setLngLat(coordinates)
      .setHTML(popupContent)
      .addTo(map);

    if (e.originalEvent) {
      e.originalEvent.stopPropagation();
    }
  });

  map.on("mouseenter", VESSELS_LAYER_ID, () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", VESSELS_LAYER_ID, () => {
    map.getCanvas().style.cursor = "";
  });

  map.on("click", (e) => {
    const featuresUnderClick = map.queryRenderedFeatures(e.point, {
      layers: [VESSELS_LAYER_ID],
    });

    if (
      activePopup &&
      (!featuresUnderClick || featuresUnderClick.length === 0)
    ) {
      activePopup.remove();
      activePopup = null;
    }
  });

  updateVessels(map);

  setInterval(() => updateVessels(map), UPDATE_INTERVAL_MS);
  console.log(
    `Scheduled vessel updates every ${UPDATE_INTERVAL_MS / 1000} seconds.`,
  );

  map.on("moveend", () => {
    console.log("Map move ended.");
    updateVessels(map);
  });

  map.on("zoomend", () => {
    console.log(`Map zoom ended. Zoom: ${map.getZoom().toFixed(2)}`);
    updateVessels(map);
    updateZoomMessageVisibility(map, zoomMessageElement);
  });
});
