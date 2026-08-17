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
  const [showLegend, setShowLegend] = useState(false);

  // OSM state
  const [osmChurches, setOsmChurches] = useState<Church[]>([]);
  const [isFetchingOSM, setIsFetchingOSM] = useState(false);

  const fetchOSMChurches = async (bounds: any) => {
    if (!bounds) return;
    setIsFetchingOSM(true);
    try {
      const south = bounds.getSouth();
      const west = bounds.getWest();
      const north = bounds.getNorth();
      const east = bounds.getEast();
      
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="place_of_worship"](${south},${west},${north},${east});
          way["amenity"="place_of_worship"](${south},${west},${north},${east});
          node["building"="church"](${south},${west},${north},${east});
          node["building"="mosque"](${south},${west},${north},${east});
          node["building"="synagogue"](${south},${west},${north},${east});
          node["building"="temple"](${south},${west},${north},${east});
          node["building"="cathedral"](${south},${west},${north},${east});
        );
        out center;
      `;
      
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: "data=" + encodeURIComponent(query)
      });
      const data = await res.json();
      
      const parsedChurches: Church[] = data.elements.map((el: any) => {
        const lat = el.lat || el.center?.lat;
        const lon = el.lon || el.center?.lon;
        const tags = el.tags || {};
        const religion = (tags.religion || "").toLowerCase();
        const denom = (tags.denomination || "").toLowerCase();
        const building = (tags.building || "").toLowerCase();
        const rawName = tags.name || tags["name:es"] || tags["name:en"] || null;

        // Classify by religion first, then denomination, then building type
        let type = "Otro lugar de culto";
        let defaultName = "Lugar de culto (OSM)";

        if (religion === "christian" || building === "church" || building === "cathedral") {
          defaultName = "Iglesia (OSM)";
          if (denom.includes("catholic") || denom.includes("roman_catholic")) {
            type = "Católica";
          } else if (denom.includes("evangelical") || denom.includes("protestant") || denom.includes("baptist") || denom.includes("pentecost") || denom.includes("methodist") || denom.includes("presbyterian") || denom.includes("lutheran")) {
            type = "Cristiana Evangélica";
          } else if (denom.includes("orthodox")) {
            type = "Ortodoxa";
          } else if (denom.includes("adventist")) {
            type = "Adventista";
          } else if (denom.includes("mormon") || denom.includes("latter")) {
            type = "Mormona";
          } else if (denom.includes("jehovah") || denom.includes("testigo")) {
            type = "Testigos de Jehová";
          } else {
            type = "Cristiana";
          }
        } else if (religion === "muslim" || religion === "islamic" || building === "mosque") {
          defaultName = "Mezquita (OSM)";
          type = "Islam";
        } else if (religion === "jewish" || building === "synagogue") {
          defaultName = "Sinagoga (OSM)";
          type = "Judaísmo";
        } else if (religion === "buddhist" || religion === "buddhism") {
          defaultName = "Templo Budista (OSM)";
          type = "Budismo";
        } else if (religion === "hindu" || religion === "hinduism") {
          defaultName = "Templo Hindu (OSM)";
          type = "Hinduismo";
        } else if (religion === "sikh") {
          defaultName = "Gurdwara (OSM)";
          type = "Sijismo";
        } else if (building === "temple" || religion === "shinto") {
          defaultName = "Templo (OSM)";
          type = "Otro templo";
        }

        return {
          id: `osm-${el.id}`,
          name: rawName || defaultName,
          address: tags["addr:street"] ? `${tags["addr:street"]} ${tags["addr:housenumber"] || ""}`.trim() : "Ubicación de OpenStreetMap",
          latitude: lat,
          longitude: lon,
          type: type,
          description: `Lugar de culto encontrado en OpenStreetMap.${tags.denomination ? ` Denominación: ${tags.denomination}.` : ""}`,
          imageUrl: null
        };
      }).filter((c: any) => c.latitude && c.longitude);

      setOsmChurches(parsedChurches);
    } catch (error) {
      console.error("Failed to fetch OSM churches", error);
    } finally {
      setIsFetchingOSM(false);
    }
  };

  const handleMoveEnd = useCallback((e: any) => {
    const map = e.target;
    if (map.getZoom() > 10) {
      fetchOSMChurches(map.getBounds());
    } else {
      setOsmChurches([]);
    }
  }, []);

  const handleMapLoad = useCallback((e: any) => {
    // Auto-trigger geolocation on map load if no target is provided initially
    if (!targetLocation) {
      setTimeout(() => {
        geolocateRef.current?.trigger();
      }, 500);
    }
    // Also fetch initial OSM if zoomed in
    if (e.target.getZoom() > 10) {
      fetchOSMChurches(e.target.getBounds());
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

  // Combine DB churches with OSM churches, preventing duplicates loosely by name/proximity
  const combinedChurches = [...validChurches];
  for (const osm of osmChurches) {
    const isDuplicate = validChurches.some(vc => 
      Math.abs(vc.latitude! - osm.latitude!) < 0.005 && 
      Math.abs(vc.longitude! - osm.longitude!) < 0.005
    );
    if (!isDuplicate) {
      combinedChurches.push(osm);
    }
  }

  const typeColors: Record<string, string> = {
    // Cristiano
    "Católica":             "#818cf8",
    "Cristiana Evangélica": "#f472b6",
    "Cristiana":            "#c084fc",
    "Ortodoxa":             "#a78bfa",
    "Adventista":           "#fb923c",
    "Mormona":              "#fbbf24",
    "Testigos de Jehová":   "#f59e0b",
    // Otras religiones
    "Islam":                "#34d399",
    "Judaísmo":             "#60a5fa",
    "Budismo":              "#f97316",
    "Hinduismo":            "#ef4444",
    "Sijismo":              "#84cc16",
    "Otro templo":          "#38bdf8",
    "Otro lugar de culto":  "#94a3b8",
  };

  const typeEmojis: Record<string, string> = {
    "Católica":             "⛪",
    "Cristiana Evangélica": "✝️",
    "Cristiana":            "✝️",
    "Ortodoxa":             "☦️",
    "Adventista":           "⛪",
    "Mormona":              "⛪",
    "Testigos de Jehová":   "⛪",
    "Islam":                "🕌",
    "Judaísmo":             "🕍",
    "Budismo":              "🛕",
    "Hinduismo":            "🛕",
    "Sijismo":              "🛕",
    "Otro templo":          "🏛️",
    "Otro lugar de culto":  "🙏",
  };

  const legendItems = [
    { label: "Católica",             emoji: "⛪" },
    { label: "Cristiana Evangélica", emoji: "✝️" },
    { label: "Cristiana",            emoji: "✝️" },
    { label: "Ortodoxa",             emoji: "☦️" },
    { label: "Adventista",           emoji: "⛪" },
    { label: "Mormona",              emoji: "⛪" },
    { label: "Testigos de Jehová",   emoji: "⛪" },
    { label: "Islam",                emoji: "🕌" },
    { label: "Judaísmo",             emoji: "🕍" },
    { label: "Budismo",              emoji: "🛕" },
    { label: "Hinduismo",            emoji: "🛕" },
    { label: "Sijismo",              emoji: "🛕" },
    { label: "Otro templo",          emoji: "🏛️" },
    { label: "Otro lugar de culto",  emoji: "🙏" },
  ];

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {isFetchingOSM && (
        <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", zIndex: 10, background: "rgba(15,23,42,0.8)", backdropFilter: "blur(4px)", padding: "4px 12px", borderRadius: "12px", fontSize: "0.8rem", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
          🔍 Buscando lugares de culto en la zona...
        </div>
      )}
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
        onMoveEnd={handleMoveEnd}
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
        {combinedChurches.map((church) => {
          const color = typeColors[church.type ?? ""] || "#818cf8";
          const isOSM = church.id.startsWith("osm-");
          
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
                  width: isOSM ? "24px" : "32px",
                  height: isOSM ? "24px" : "32px",
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
                <span style={{ transform: "rotate(45deg)", fontSize: isOSM ? "11px" : "13px" }}>
                  {typeEmojis[church.type ?? ""] || "⛪"}
                </span>
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
                  borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "10px", marginBottom: "12px"
                }}>
                  {popupInfo.description}
                </p>
              )}
              
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${popupInfo.latitude},${popupInfo.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  background: "var(--primary-color, #4f46e5)",
                  color: "white",
                  textDecoration: "none",
                  padding: "8px 0",
                  borderRadius: "10px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  width: "100%",
                  transition: "background 0.2s",
                  marginTop: "5px"
                }}
                onMouseOver={(e) => e.currentTarget.style.background = "#4338ca"}
                onMouseOut={(e) => e.currentTarget.style.background = "var(--primary-color, #4f46e5)"}
              >
                🗺️ Cómo llegar
              </a>
            </div>
          </Popup>
        )}
      </Map>

      {/* Religion Legend */}
      <div style={{
        position: "absolute",
        bottom: 24,
        left: 16,
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "6px",
      }}>
        <button
          onClick={() => setShowLegend(p => !p)}
          style={{
            background: "rgba(15,23,42,0.85)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "10px",
            padding: "6px 14px",
            color: "white",
            fontSize: "0.75rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            letterSpacing: "0.04em",
            transition: "background 0.2s",
          }}
        >
          🌐 {showLegend ? "Ocultar leyenda" : "Ver leyenda"}
        </button>

        {showLegend && (
          <div style={{
            background: "rgba(15,23,42,0.92)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "14px",
            padding: "14px 16px",
            minWidth: "210px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}>
            <p style={{ color: "#94a3b8", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px", margin: "0 0 10px 0" }}>
              Lugares de culto
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              {legendItems.map(({ label, emoji }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                  <div style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "50% 50% 50% 0",
                    transform: "rotate(-45deg)",
                    background: typeColors[label],
                    flexShrink: 0,
                    boxShadow: `0 2px 6px ${typeColors[label]}88`,
                  }} />
                  <span style={{ fontSize: "0.78rem", color: "#e2e8f0", display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ fontSize: "0.9rem" }}>{emoji}</span>
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <p style={{ color: "#475569", fontSize: "0.62rem", marginTop: "10px", margin: "10px 0 0 0", lineHeight: 1.4 }}>
              Fuente: OpenStreetMap · Zoom &gt;10 requerido
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
