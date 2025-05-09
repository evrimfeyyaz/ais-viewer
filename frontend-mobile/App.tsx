import Mapbox from "@rnmapbox/maps";
import React from "react";
import Map from "./src/Map/Map";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN);

export default function App() {
  return <Map />;
}
