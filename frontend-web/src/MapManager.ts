import maplibregl, { GeoJSONSource, Map, Popup } from "maplibre-gl";
import type { MapLayerClickEvent, VesselData } from "./types";
import { transformRequest, transformToGeoJSON } from "./utils";

/** The ID of the ship icon image to use in the map. */
const SHIP_ICON_ID = "ship-icon";
/** The path to the ship icon image. */
const SHIP_ICON_PATH = "/ship-icon.png";

/** The ID of the vessels source. */
const VESSELS_SOURCE_ID = "vessels-source";
/** The ID of the vessels layer. */
const VESSELS_LAYER_ID = "vessels-layer";

/** The minimum zoom level at which vessels are displayed. */
const MIN_ZOOM_LEVEL = 12;

/**
 * The factor by which the map bounds are expanded for when we're fetching vessels.
 * This is to fetch vessels that are near the edges of the visible section of the map thus improving the panning experience.
 * */
const BOUNDS_EXPANSION_FACTOR = 1;

/** The interval at which the vessels are updated in milliseconds. */
const UPDATE_INTERVAL_MS = 10000; // 10 seconds

type MapManagerOptions = {
  /** The container element or ID of the map. */
  container: string | HTMLElement;
  /** The style URL of the map. */
  style: string;
  /** The initial center coordinates of the map in [longitude, latitude] format. */
  center: [number, number];
  /** The initial zoom level of the map. */
  zoom: number;
};

/**
 * Encapsulates the logic for managing the map and its features.
 */
export class MapManager {
  private map: Map;
  private zoomMessageElement: HTMLElement | null;
  private activePopup: Popup | null = null;

  constructor(options: MapManagerOptions) {
    this.map = new maplibregl.Map({
      container: options.container,
      style: options.style,
      center: options.center,
      zoom: options.zoom,
      transformRequest,
    });

    this.zoomMessageElement = document.getElementById("zoom-message");
    this.initializeMap();
  }

  /**
   * Initializes the map and sets up the necessary listeners and features.
   */
  private async initializeMap() {
    this.map.on("load", async () => {
      this.updateZoomMessageVisibility();

      await this.addShipIcon();

      this.addVesselsSource();
      this.addVesselsLayer();
      this.setUpVesselInfoPopup();

      this.updateVessels();

      setInterval(() => this.updateVessels(), UPDATE_INTERVAL_MS);

      this.map.on("moveend", () => {
        this.updateVessels();
      });

      this.map.on("zoomend", () => {
        this.updateVessels();
        this.updateZoomMessageVisibility();
      });
    });
  }

  /**
   * Loads the ship icon that represents vessels on the map.
   */
  private async addShipIcon() {
    const shipIconResponse = await this.map.loadImage(SHIP_ICON_PATH);
    const shipIcon = shipIconResponse.data;
    this.map.addImage(SHIP_ICON_ID, shipIcon);
  }

  /**
   * Adds the vessels source to the map.
   *
   * A source is a data source for the map.
   */
  private addVesselsSource() {
    this.map.addSource(VESSELS_SOURCE_ID, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
    });
  }

  /**
   * Adds the vessels layer to the map.
   *
   * A layer is a visual representation of the data in the source.
   */
  private addVesselsLayer() {
    this.map.addLayer({
      id: VESSELS_LAYER_ID,
      type: "symbol",
      source: VESSELS_SOURCE_ID,
      minzoom: MIN_ZOOM_LEVEL,
      layout: {
        "icon-image": SHIP_ICON_ID,
        // The size of the icon is interpolated based on the zoom level.
        "icon-size": ["interpolate", ["linear"], ["zoom"], MIN_ZOOM_LEVEL, 0.05, 20, 0.5],
        // The rotation of the icon is based on the course of the vessel in degrees.
        "icon-rotate": ["get", "course"],
        // Rotate the icon when the map is rotated.
        "icon-rotation-alignment": "map",
        // Allow the icon to overlap with other icons.
        "icon-allow-overlap": true,
        // Don't push the icon even if it collides with other map features.
        "icon-ignore-placement": true,
      },
    });
  }

  private handleMapVesselLayerClick(e: MapLayerClickEvent) {
    if (this.activePopup) {
      this.activePopup.remove();
      this.activePopup = null;
    }

    // Get the topmost feature that was clicked on.
    const feature = e?.features?.[0];

    // Vessels are represented as points on the map, so we need to check if the feature is a point.
    if (feature?.geometry.type !== "Point") {
      return;
    }

    const coordinates = feature.geometry.coordinates.slice() as [number, number];
    const properties = feature.properties;
    const vesselName = properties?.name.trim() || "Unnamed Vessel";
    const mmsi = properties.mmsi;

    const popupContent = `
      <div style="font-family: sans-serif; font-size: 14px;">
          <strong>${vesselName}</strong><br>
          MMSI: ${mmsi}
      </div>
    `;

    this.activePopup = new Popup({
      closeButton: true,
      closeOnClick: false,
      offset: 15,
    })
      .setLngLat(coordinates)
      .setHTML(popupContent)
      .addTo(this.map);
  }

  /**
   * Sets up the popup that appears when a vessel is clicked on the map.
   */
  private setUpVesselInfoPopup() {
    this.map.on("click", VESSELS_LAYER_ID, (e) =>
      this.handleMapVesselLayerClick(e as MapLayerClickEvent),
    );

    this.map.on("mouseenter", VESSELS_LAYER_ID, () => {
      this.map.getCanvas().style.cursor = "pointer";
    });
    this.map.on("mouseleave", VESSELS_LAYER_ID, () => {
      this.map.getCanvas().style.cursor = "";
    });

    // Hide the popup when the user clicks outside of it.
    this.map.on("click", (e) => {
      const featuresUnderClick = this.map.queryRenderedFeatures(e.point, {
        layers: [VESSELS_LAYER_ID],
      });

      if (this.activePopup && (!featuresUnderClick || featuresUnderClick.length === 0)) {
        this.activePopup.remove();
        this.activePopup = null;
      }
    });
  }

  /**
   * Shows or hides the "zoom in to see vessels" message based on the current zoom level.
   */
  private updateZoomMessageVisibility() {
    if (!this.zoomMessageElement) return;

    const zoom = this.map.getZoom();
    if (zoom < MIN_ZOOM_LEVEL) {
      this.zoomMessageElement.style.display = "block";
    } else {
      this.zoomMessageElement.style.display = "none";
    }
  }

  /**
   * Updates the displayed vessels on the map based on the current zoom level.
   */
  private async updateVessels() {
    const zoom = this.map.getZoom();
    const vesselsSource = this.map.getSource(VESSELS_SOURCE_ID) as GeoJSONSource | undefined;

    if (zoom < MIN_ZOOM_LEVEL || !vesselsSource) {
      vesselsSource?.setData({ type: "FeatureCollection", features: [] });
      return;
    }

    const bounds = this.map.getBounds();
    const minLon = bounds.getWest();
    const minLat = bounds.getSouth();
    const maxLon = bounds.getEast();
    const maxLat = bounds.getNorth();

    const widthDegrees = maxLon - minLon;
    const heightDegrees = maxLat - minLat;

    const lonExpansion = (widthDegrees * BOUNDS_EXPANSION_FACTOR) / 2;
    const latExpansion = (heightDegrees * BOUNDS_EXPANSION_FACTOR) / 2;

    const expandedMinLon = minLon - lonExpansion;
    const expandedMaxLon = maxLon + lonExpansion;
    let expandedMinLat = minLat - latExpansion;
    let expandedMaxLat = maxLat + latExpansion;

    // Clamp latitudes to valid range [-90, 90]
    expandedMinLat = Math.max(-90, expandedMinLat);
    expandedMaxLat = Math.min(90, expandedMaxLat);

    const apiUrl = `/api/vessels?min-lon=${expandedMinLon}&min-lat=${expandedMinLat}&max-lon=${expandedMaxLon}&max-lat=${expandedMaxLat}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      const vesselsData: VesselData[] = await response.json();

      const geojsonData = transformToGeoJSON(vesselsData);

      vesselsSource.setData(geojsonData);
    } catch (error) {
      console.error("Error fetching or updating vessel data:", error);
    }
  }
}
