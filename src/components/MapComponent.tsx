"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import "leaflet/dist/leaflet.css";

const TYPE_COLORS: Record<string, string> = {
  "Católica":             "#818cf8",
  "Cristiana Evangélica": "#f472b6",
  "Cristiana":            "#c084fc",
  "Islam":                "#34d399",
  "Judaísmo":             "#60a5fa",
  "Otro":                 "#94a3b8",
};

const TYPE_EMOJI: Record<string, string> = {
  "Católica":             "⛪",
  "Cristiana Evangélica": "✝️",
  "Cristiana":            "✝️",
  "Islam":                "🕌",
  "Judaísmo":             "🕍",
  "Otro":                 "🙏",
};

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

function buildPopupHTML(name: string, type: string, address: string, lat: number, lng: number): string {
  const color = TYPE_COLORS[type] || "#94a3b8";
  const emoji = TYPE_EMOJI[type] || "⛪";
  return `
    <div style="font-family:system-ui,sans-serif;min-width:210px;padding:4px 0;">
      <span style="background:${color};color:white;border-radius:99px;padding:2px 10px;font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">${emoji} ${type}</span>
      <h4 style="margin:8px 0 4px;color:#1e293b;font-size:0.98rem;font-weight:800;line-height:1.3;">${name}</h4>
      <p style="margin:0 0 10px;font-size:0.82rem;color:#64748b;">📍 ${address}</p>
      <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank" rel="noopener noreferrer"
        style="display:flex;align-items:center;justify-content:center;gap:6px;background:#4f46e5;color:white;text-decoration:none;padding:8px;border-radius:10px;font-size:0.85rem;font-weight:600;width:100%;">
        🧭 Cómo llegar
      </a>
    </div>
  `;
}

function makePinIcon(L: any, color: string, emoji: string) {
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.35);border:2px solid rgba(255,255,255,0.85);"><span style="transform:rotate(45deg);font-size:14px;line-height:1;">${emoji}</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
}

function classifyChurch(religion: string, denom: string): { type: string } {
  if (denom.includes("evangelical") || denom.includes("protestant") || denom.includes("baptist") || denom.includes("pentecost") || denom.includes("methodist") || denom.includes("lutheran") || denom.includes("presbyterian"))
    return { type: "Cristiana Evangélica" };
  if (denom.includes("catholic") || denom.includes("roman_catholic"))
    return { type: "Católica" };
  if (religion === "muslim" || religion === "islamic")
    return { type: "Islam" };
  if (religion === "jewish")
    return { type: "Judaísmo" };
  if (religion.includes("christian"))
    return { type: "Cristiana" };
  return { type: "Otro" };
}

// Radio de búsqueda según el nivel de zoom
function radiusForZoom(zoom: number): number {
  if (zoom >= 16) return 1000;
  if (zoom >= 14) return 2500;
  if (zoom >= 12) return 5000;
  if (zoom >= 10) return 12000;
  return 25000;
}

export default function MapComponent({ churches, targetLocation }: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const osmMarkersRef = useRef<any[]>([]); // only OSM markers, cleared on each search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState("Iniciando mapa...");
  const [placesCount, setPlacesCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  // ── Overpass search centrado en lat/lng con radio dinámico ──────────────
  const searchOverpass = useCallback(async (map: any, L: any, lat: number, lng: number, radius: number) => {
    setIsSearching(true);
    setStatus(`Buscando en ${radius >= 1000 ? (radius / 1000).toFixed(0) + " km" : radius + " m"}...`);

    // Limpiar marcadores OSM anteriores
    osmMarkersRef.current.forEach((m) => m.remove());
    osmMarkersRef.current = [];

    // Igual que old_version/static/js/script.js — body como texto plano (sin encodeURIComponent)
    const query = `[out:json][timeout:25];
(
  node["amenity"="place_of_worship"](around:${radius},${lat},${lng});
  way["amenity"="place_of_worship"](around:${radius},${lat},${lng});
  relation["amenity"="place_of_worship"](around:${radius},${lat},${lng});
);
out center tags;`;

    try {
      // Llamamos a nuestra propia API interna de Next.js para evitar problemas de CORS y 406
      const res = await fetch("/api/overpass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      
      if (!res.ok) {
        throw new Error(`Error interno: ${res.status}`);
      }
      
      const data = await res.json();

      let found = 0;
      data.elements.forEach((el: any) => {
        const coords: [number, number] = el.type === "node"
          ? [el.lat, el.lon]
          : [el.center?.lat, el.center?.lon];
        if (!coords[0] || !coords[1]) return;

        const tags = el.tags || {};
        const religion = (tags.religion || "").toLowerCase();
        const denom = (tags.denomination || "").toLowerCase();
        const name = tags.name || tags["name:es"] || "Iglesia sin nombre";
        const { type } = classifyChurch(religion, denom);
        const color = TYPE_COLORS[type] || "#94a3b8";
        const emoji = TYPE_EMOJI[type] || "⛪";
        const address = tags["addr:street"]
          ? `${tags["addr:street"]} ${tags["addr:housenumber"] || ""}`.trim()
          : "Ubicación de OpenStreetMap";

        const marker = L.marker(coords, { icon: makePinIcon(L, color, emoji) })
          .addTo(map)
          .bindPopup(buildPopupHTML(name, type, address, coords[0], coords[1]));
        osmMarkersRef.current.push(marker);
        found++;
      });

      setPlacesCount(found);
      setStatus(found > 0 ? `${found} lugares de culto` : "Sin resultados en esta zona");
    } catch (err) {
      console.error("Error Overpass:", err);
      setStatus("Error al cargar iglesias");
    } finally {
      setIsSearching(false);
    }
  }, []);

  // ── Disparar búsqueda con debounce al mover/zoom ─────────────────────────
  const scheduleSearch = useCallback((map: any, L: any) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      const radius = radiusForZoom(zoom);
      searchOverpass(map, L, center.lat, center.lng, radius);
    }, 800); // espera 800ms después de que el usuario deje de mover
  }, [searchOverpass]);

  // ── Init Leaflet map ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapDivRef.current) return;
    const L = require("leaflet");

    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    if (mapRef.current) mapRef.current.remove();

    const map = L.map(mapDivRef.current, { zoomControl: true }).setView([-34.6037, -58.3816], 14);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Marcadores de la base de datos (fijos, no se borran al mover)
    churches.forEach((c) => {
      if (!c.latitude || !c.longitude) return;
      const type = c.type || "Cristiana";
      const color = TYPE_COLORS[type] || "#818cf8";
      const emoji = TYPE_EMOJI[type] || "⛪";
      L.marker([c.latitude, c.longitude], { icon: makePinIcon(L, color, emoji) })
        .addTo(map)
        .bindPopup(buildPopupHTML(c.name, type, c.address, c.latitude, c.longitude));
    });

    // ── Evento: mover o cambiar zoom → re-buscar con debounce ──────────────
    map.on("moveend", () => scheduleSearch(map, L));
    map.on("zoomend", () => scheduleSearch(map, L));

    // ── Geolocalización inicial ─────────────────────────────────────────────
    setStatus("Buscando tu ubicación...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        map.setView([lat, lng], 15); // esto dispara moveend → búsqueda automática

        // Pin "Estás acá"
        const youIcon = L.divIcon({
          className: "",
          html: `<div style="width:18px;height:18px;border-radius:50%;background:#4f46e5;border:3px solid white;box-shadow:0 0 0 5px rgba(79,70,229,0.25);"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        if (userMarkerRef.current) userMarkerRef.current.remove();
        userMarkerRef.current = L.marker([lat, lng], { icon: youIcon, zIndexOffset: 1000 })
          .addTo(map)
          .bindPopup("<b>📍 Estás acá</b>")
          .openPopup();
      },
      (err) => {
        console.warn("GPS denegado:", err.message);
        setStatus("GPS denegado. Mostrando Buenos Aires.");
        // moveend ya se disparó al setView inicial → busca en Buenos Aires
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Pan cuando cambia targetLocation (búsqueda de barra) ─────────────────
  useEffect(() => {
    if (mapRef.current && targetLocation) {
      mapRef.current.flyTo([targetLocation.lat, targetLocation.lng], 15, { duration: 1.2 });
      // flyTo dispara moveend → re-busca automáticamente
    }
  }, [targetLocation]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Barra de estado */}
      <div style={{
        position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
        zIndex: 999, background: isSearching ? "rgba(255,255,255,0.96)" : "rgba(79,70,229,0.92)",
        backdropFilter: "blur(4px)",
        padding: "5px 16px", borderRadius: "12px", fontSize: "0.83rem",
        color: isSearching ? "#334155" : "white",
        border: isSearching ? "1px solid #cbd5e1" : "none",
        boxShadow: "0 4px 15px rgba(0,0,0,0.15)", fontWeight: 700,
        whiteSpace: "nowrap", transition: "all 0.3s",
        display: "flex", alignItems: "center", gap: "8px",
      }}>
        {isSearching ? "🔍 Buscando..." : (placesCount > 0 ? `⛪ ${placesCount} lugares de culto` : `ℹ️ ${status}`)}
      </div>

      <div ref={mapDivRef} style={{ width: "100%", height: "100%" }} />

      <style>{`
        .leaflet-popup-content-wrapper { border-radius: 14px !important; box-shadow: 0 8px 30px rgba(0,0,0,0.15) !important; }
        .leaflet-popup-content { margin: 14px 16px !important; }
        .leaflet-popup-tip-container { display: none; }
      `}</style>
    </div>
  );
}
