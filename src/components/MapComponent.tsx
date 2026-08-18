"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";

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

const typeColors: Record<string, string> = {
  "Católica":             "#818cf8",
  "Cristiana Evangélica": "#f472b6",
  "Cristiana":            "#c084fc",
  "Ortodoxa":             "#a78bfa",
  "Adventista":           "#fb923c",
  "Mormona":              "#fbbf24",
  "Testigos de Jehová":   "#f59e0b",
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
  { label: "Judaísmo",             "emoji": "🕍" },
  { label: "Budismo",              "emoji": "🛕" },
  { label: "Hinduismo",            "emoji": "🛕" },
  { label: "Sijismo",              "emoji": "🛕" },
  { label: "Otro templo",          "emoji": "🏛️" },
  { label: "Otro lugar de culto",  "emoji": "🙏" },
];

const createIcon = (color: string, emoji: string) => L.divIcon({
  className: "custom-div-icon",
  html: `<div style="background-color:${color};width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,0.4);border:2px solid rgba(255,255,255,0.8);"><span style="transform:rotate(45deg);font-size:14px;line-height:1;">${emoji}</span></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30]
});

// Helper component to handle map events
function MapEvents({ onMoveEnd, targetLocation }: { onMoveEnd: (map: L.Map) => void, targetLocation: any }) {
  const map = useMapEvents({
    moveend: () => onMoveEnd(map)
  });

  useEffect(() => {
    if (targetLocation) {
      map.flyTo([targetLocation.lat, targetLocation.lng], 15, { duration: 1.5 });
    }
  }, [targetLocation, map]);

  useEffect(() => {
    // Force trigger on first load
    setTimeout(() => onMoveEnd(map), 500);
  }, [map, onMoveEnd]);

  return null;
}

export default function MapComponent({ churches, targetLocation, selectedChurchId }: Props) {
  const [showLegend, setShowLegend] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  // OSM state
  const [osmChurches, setOsmChurches] = useState<Church[]>([]);
  const [isFetchingOSM, setIsFetchingOSM] = useState(false);
  
  const mapRef = useRef<any>(null);

  useEffect(() => {
    require("leaflet/dist/leaflet.css");
  }, []);

  const fetchOSMChurches = useCallback(async (map: L.Map) => {
    if (map.getZoom() <= 8) {
      setOsmChurches([]);
      return;
    }

    const bounds = map.getBounds();
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
          node["name"~"(?i)(iglesia|congregacion|culto|templo|parroquia|capilla|ministerio|sinagoga|mezquita)"](${south},${west},${north},${east});
        );
        out center tags;
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

        let type = "Otro lugar de culto";
        let defaultName = "Lugar de culto (OSM)";

        if (religion === "christian" || building === "church" || building === "cathedral") {
          defaultName = "Iglesia (OSM)";
          if (denom.includes("catholic") || denom.includes("roman_catholic")) type = "Católica";
          else if (denom.includes("evangelical") || denom.includes("protestant") || denom.includes("baptist") || denom.includes("pentecost") || denom.includes("methodist") || denom.includes("presbyterian") || denom.includes("lutheran")) type = "Cristiana Evangélica";
          else if (denom.includes("orthodox")) type = "Ortodoxa";
          else if (denom.includes("adventist")) type = "Adventista";
          else if (denom.includes("mormon") || denom.includes("latter")) type = "Mormona";
          else if (denom.includes("jehovah") || denom.includes("testigo")) type = "Testigos de Jehová";
          else type = "Cristiana";
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

        let addressStr = "Ubicación de OpenStreetMap";
        if (tags["addr:street"]) {
          addressStr = `${tags["addr:street"]} ${tags["addr:housenumber"] || ""}`.trim();
          const city = tags["addr:city"] || tags["addr:town"] || tags["addr:suburb"] || "";
          if (city) addressStr += `, ${city}`;
        }

        return {
          id: `osm-${el.id}`,
          name: rawName || defaultName,
          address: addressStr,
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
  }, []);

  const validChurches = churches.filter((c) => c.latitude !== null && c.longitude !== null);

  let combinedChurches = [...validChurches];
  for (const osm of osmChurches) {
    const isDuplicate = validChurches.some(vc => 
      Math.abs(vc.latitude! - osm.latitude!) < 0.005 && 
      Math.abs(vc.longitude! - osm.longitude!) < 0.005
    );
    if (!isDuplicate) {
      combinedChurches.push(osm);
    }
  }

  if (activeFilters.size > 0) {
    combinedChurches = combinedChurches.filter((c) => activeFilters.has(c.type || ""));
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#f8fafc" }}>
      {isFetchingOSM && (
        <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", zIndex: 1000, background: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)", padding: "6px 14px", borderRadius: "12px", fontSize: "0.85rem", color: "#334155", border: "1px solid #cbd5e1", boxShadow: "0 4px 15px rgba(0,0,0,0.1)", fontWeight: 600 }}>
          🔍 Buscando lugares de culto...
        </div>
      )}
      
      <MapContainer 
        center={[-34.6037, -58.3816]} 
        zoom={12} 
        scrollWheelZoom={true} 
        style={{ height: "100%", width: "100%", zIndex: 10 }}
        ref={mapRef}
      >
        <MapEvents onMoveEnd={fetchOSMChurches} targetLocation={targetLocation} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {combinedChurches.map((church) => {
          const color = typeColors[church.type ?? ""] || "#818cf8";
          const emoji = typeEmojis[church.type ?? ""] || "⛪";
          
          return (
            <Marker 
              key={church.id} 
              position={[church.latitude!, church.longitude!]} 
              icon={createIcon(color, emoji)}
            >
              <Popup autoPan={true} closeButton={false} offset={[0, -20]}>
                <div style={{ fontFamily: "var(--font-body)", minWidth: "220px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: "99px", fontSize: "0.7rem", fontWeight: 700,
                      background: color, color: "white", textTransform: "uppercase", letterSpacing: "0.06em"
                    }}>
                      {church.type || "Iglesia"}
                    </span>
                  </div>
                  <h4 style={{ margin: "0 0 5px 0", color: "#1e293b", fontWeight: "800", fontSize: "1rem", lineHeight: 1.3 }}>{church.name}</h4>
                  <p style={{ margin: "0 0 5px 0", fontSize: "0.85rem", color: "#64748b" }}>📍 {church.address}</p>
                  {church.description && (
                    <p style={{ margin: "8px 0", fontSize: "0.8rem", color: "#475569", lineHeight: 1.5, borderTop: "1px solid #e2e8f0", paddingTop: "8px" }}>
                      {church.description}
                    </p>
                  )}
                  {church.imageUrl && (
                    <img src={church.imageUrl} alt={church.name} style={{ width: "100%", height: "100px", objectFit: "cover", marginTop: "10px", borderRadius: "8px" }} />
                  )}
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${church.latitude},${church.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                      background: "var(--primary-color, #4f46e5)", color: "white", textDecoration: "none",
                      padding: "8px 0", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 600,
                      width: "100%", transition: "background 0.2s", marginTop: "10px"
                    }}
                  >
                    🗺️ Cómo llegar
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Religion Legend */}
      <div style={{
        position: "absolute", bottom: 24, left: 16, zIndex: 20,
        display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "6px",
      }}>
        <button
          onClick={() => setShowLegend(p => !p)}
          style={{
            background: "white", border: "1px solid #cbd5e1", borderRadius: "10px",
            padding: "8px 14px", color: "#334155", fontSize: "0.8rem", fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.1)", transition: "all 0.2s",
          }}
        >
          🌐 {showLegend ? "Ocultar leyenda" : "Ver filtros y leyenda"}
        </button>

        {showLegend && (
          <div style={{
            background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
            border: "1px solid #e2e8f0", borderRadius: "14px", padding: "14px 16px",
            minWidth: "210px", boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          }}>
            <p style={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px", margin: "0 0 10px 0" }}>
              Filtrar Lugares de culto
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              {legendItems.map(({ label, emoji }) => {
                const isActive = activeFilters.size === 0 || activeFilters.has(label);
                return (
                  <div 
                    key={label} 
                    onClick={() => {
                      setActiveFilters(prev => {
                        const next = new Set(prev);
                        if (next.has(label)) next.delete(label);
                        else next.add(label);
                        return next;
                      });
                    }}
                    style={{ 
                      display: "flex", alignItems: "center", gap: "9px",
                      cursor: "pointer", opacity: isActive ? 1 : 0.4, transition: "opacity 0.2s"
                    }}
                  >
                    <div style={{
                      width: "16px", height: "16px", borderRadius: "50% 50% 50% 0",
                      transform: "rotate(-45deg)", background: typeColors[label], flexShrink: 0,
                      boxShadow: isActive ? `0 2px 6px ${typeColors[label]}88` : 'none',
                    }} />
                    <span style={{ fontSize: "0.85rem", color: "#334155", display: "flex", alignItems: "center", gap: "5px", fontWeight: 500 }}>
                      <span style={{ fontSize: "1rem", filter: isActive ? 'none' : 'grayscale(100%)' }}>{emoji}</span>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
