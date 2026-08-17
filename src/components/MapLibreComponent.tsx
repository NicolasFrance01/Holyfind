"use client";

import { useRef, useCallback, useEffect } from "react";
import Map, { Marker, Popup, NavigationControl, GeolocateControl, MapRef } from "react-map-gl/maplibre";
import { useState } from "react";
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
  targetLocation?: { lat: number; lng: number } | null;
  selectedChurchId?: string | null;
};

// Dark map style using reliable raster tiles to avoid CORS/HTTPS issues on Vercel
const MAP_STYLE: any = {
  version: 8,
  sources: {
    "carto-dark": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png"
      ],
      tileSize: 256,
      attribution: "&copy; <a href='https://carto.com/'>CARTO</a>"
    }
  },
  layers: [
    {
      id: "carto-dark-layer",
      type: "raster",
      source: "carto-dark",
      minzoom: 0,
      maxzoom: 22
    }
  ]
};

export default function MapLibreComponent({ churches, targetLocation, selectedChurchId }: Props) {
  const [popupInfo, setPopupInfo] = useState<Church | null>(null);
  const geolocateRef = useRef<any>(null);
  const mapRef = useRef<MapRef>(null);

  const handleMapLoad = useCallback(() => {
    // Auto-trigger geolocation on map load if no target is provided initially
    if (!targetLocation) {
      setTimeout(() => {
        geolocateRef.current?.trigger();
      }, 500);
    }
  }, [targetLocation]);

  // Fly to target location when it changes
  useEffect(() => {
    if (targetLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [targetLocation.lng, targetLocation.lat],
        zoom: 14,
        duration: 2000,
      });
    }
  }, [targetLocation]);

  // Open popup when a church is selected from outside
  useEffect(() => {
    if (selectedChurchId) {
      const church = churches.find(c => c.id === selectedChurchId);
      if (church) setPopupInfo(church);
    }
  }, [selectedChurchId, churches]);

  const validChurches = churches.filter(
    (c) => c.latitude !== null && c.longitude !== null
  );

  const typeColors: Record<string, string> = {
    "Católica": "#818cf8",
    "Cristiana Evangélica": "#f472b6",
    "Otra": "#38bdf8",
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: -63.0,
          latitude: -34.0,
          zoom: 4.5,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE}
        onLoad={handleMapLoad}
        attributionControl={false}
      >
        {/* Controls */}
        <NavigationControl
          position="top-right"
          style={{ margin: "10px", borderRadius: "12px" }}
        />
        <GeolocateControl
          ref={geolocateRef}
          position="top-right"
          style={{ margin: "10px", borderRadius: "12px" }}
          trackUserLocation={false}
          showAccuracyCircle={false}
          positionOptions={{ enableHighAccuracy: true }}
        />

        {/* Church Markers */}
        {validChurches.map((church) => {
          const color = typeColors[church.type ?? ""] || "#818cf8";
          return (
            <Marker
              key={church.id}
              longitude={church.longitude!}
              latitude={church.latitude!}
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setPopupInfo(church);
              }}
            >
              <div
                title={church.name}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50% 50% 50% 0",
                  transform: "rotate(-45deg)",
                  background: color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: `0 4px 15px ${color}66`,
                  border: "2px solid rgba(255,255,255,0.4)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "rotate(-45deg) scale(1.3)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "rotate(-45deg) scale(1)";
                }}
              >
                <span style={{ transform: "rotate(45deg)", fontSize: "13px" }}>⛪</span>
              </div>
            </Marker>
          );
        })}

        {/* Popup */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude!}
            latitude={popupInfo.latitude!}
            anchor="bottom"
            offset={[0, -22] as [number, number]}
            onClose={() => setPopupInfo(null)}
            closeButton={false}
            style={{ padding: 0, zIndex: 100 }}
          >
            <div style={{
              background: "rgba(15, 23, 42, 0.95)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "18px",
              padding: "20px",
              minWidth: "240px",
              maxWidth: "290px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            }}>
              <button
                onClick={() => setPopupInfo(null)}
                style={{
                  position: "absolute", top: "10px", right: "12px",
                  background: "rgba(255,255,255,0.1)", border: "none",
                  color: "white", cursor: "pointer", fontSize: "1rem",
                  width: "24px", height: "24px", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                ×
              </button>
              {popupInfo.imageUrl && (
                <img
                  src={popupInfo.imageUrl}
                  alt={popupInfo.name}
                  style={{ width: "100%", height: "110px", objectFit: "cover", borderRadius: "10px", marginBottom: "12px" }}
                />
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <span style={{
                  padding: "3px 10px", borderRadius: "99px", fontSize: "0.68rem", fontWeight: 700,
                  background: typeColors[popupInfo.type ?? ""] || "#818cf8",
                  color: "white", textTransform: "uppercase", letterSpacing: "0.06em"
                }}>
                  {popupInfo.type || "Iglesia"}
                </span>
              </div>
              <h3 style={{ color: "white", fontSize: "1rem", fontWeight: 800, marginBottom: "6px", lineHeight: 1.3 }}>
                {popupInfo.name}
              </h3>
              <p style={{ color: "#94a3b8", fontSize: "0.82rem", marginBottom: "8px" }}>
                📍 {popupInfo.address}
              </p>
              {popupInfo.description && (
                <p style={{
                  color: "#64748b", fontSize: "0.8rem", lineHeight: 1.6,
                  borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "10px"
                }}>
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
