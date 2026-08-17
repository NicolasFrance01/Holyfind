"use client";

import { useRef, useState, useCallback } from "react";
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

type Church = {
  id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  type: string | null;
  imageUrl: string | null;
};

type Props = {
  churches: Church[];
};

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export default function MapLibreComponent({ churches }: Props) {
  const [popupInfo, setPopupInfo] = useState<Church | null>(null);

  const validChurches = churches.filter(
    (c) => c.latitude !== null && c.longitude !== null
  );

  const typeColors: Record<string, string> = {
    "Católica": "#6366f1",
    "Cristiana Evangélica": "#ec4899",
    "Otra": "#0ea5e9",
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Map
        initialViewState={{
          longitude: -63.0,
          latitude: -34.0,
          zoom: 4,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE}
      >
        {/* Controls */}
        <NavigationControl position="top-right" style={{ margin: "10px" }} />
        <GeolocateControl
          position="top-right"
          style={{ margin: "10px" }}
          trackUserLocation
        />

        {/* Church Markers */}
        {validChurches.map((church) => (
          <Marker
            key={church.id}
            longitude={church.longitude!}
            latitude={church.latitude!}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setPopupInfo(church);
            }}
          >
            <div className="map-marker" style={{ "--marker-color": typeColors[church.type ?? ""] || "#6366f1" } as any}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              </svg>
            </div>
          </Marker>
        ))}

        {/* Popup */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude!}
            latitude={popupInfo.latitude!}
            anchor="bottom"
            offset={[0, -20] as [number, number]}
            onClose={() => setPopupInfo(null)}
            closeButton={false}
            style={{ padding: 0 }}
          >
            <div className="map-popup glass-panel" style={{ padding: "20px", minWidth: "240px", maxWidth: "300px", borderRadius: "16px" }}>
              <button
                onClick={() => setPopupInfo(null)}
                style={{ position: "absolute", top: "10px", right: "10px", background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "1.2rem" }}
              >
                ×
              </button>
              {popupInfo.imageUrl && (
                <img
                  src={popupInfo.imageUrl}
                  alt={popupInfo.name}
                  style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "10px", marginBottom: "15px" }}
                />
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span style={{
                  padding: "3px 10px", borderRadius: "99px", fontSize: "0.7rem", fontWeight: 700, background: typeColors[popupInfo.type ?? ""] || "#6366f1",
                  color: "white", textTransform: "uppercase", letterSpacing: "0.05em"
                }}>{popupInfo.type || "Iglesia"}</span>
              </div>
              <h3 style={{ color: "white", fontSize: "1.1rem", fontWeight: 700, marginBottom: "6px" }}>{popupInfo.name}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "10px" }}>📍 {popupInfo.address}</p>
              {popupInfo.description && (
                <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", lineHeight: "1.5", borderTop: "1px solid var(--glass-border)", paddingTop: "10px" }}>
                  {popupInfo.description}
                </p>
              )}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
