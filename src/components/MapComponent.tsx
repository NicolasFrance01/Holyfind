"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import "leaflet/dist/leaflet.css";

const GOOGLE_MAPS_API_KEY = "AIzaSyDSbH5uE_BwS00ZxTstjMb7b8K-SOyWwkU";
const SEARCH_RADIUS = 5000; // 5km

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

function classifyByName(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("mezquita") || n.includes("mosque")) return "Islam";
  if (n.includes("sinagoga") || n.includes("synagogue")) return "Judaísmo";
  if (n.includes("catolic") || n.includes("católic") || n.includes("parroquia") || n.includes("basílica") || n.includes("basilica")) return "Católica";
  if (n.includes("evangel") || n.includes("baptist") || n.includes("pentecostal") || n.includes("metodist") || n.includes("presbiteri") || n.includes("luteran")) return "Cristiana Evangélica";
  if (n.includes("iglesia") || n.includes("church") || n.includes("congregac") || n.includes("capilla") || n.includes("templo") || n.includes("ministerio")) return "Cristiana";
  return "Otro";
}

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

export default function MapComponent({ churches, targetLocation }: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const googleMarkersRef = useRef<any[]>([]);
  const userLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState("Iniciando mapa...");
  const [placesCount, setPlacesCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  // ── 1. Load Google Maps script once ─────────────────────────────────────
  useEffect(() => {
    if ((window as any).__googleMapsScriptAdded) return;
    (window as any).__googleMapsScriptAdded = true;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  // ── 2. Leaflet Google Places search ────────────────────────────────────
  const searchNearbyChurches = useCallback((map: any, L: any, lat: number, lng: number) => {
    const g = (window as any).google;
    if (!g?.maps?.places) return;

    setIsSearching(true);

    // Hidden div required by PlacesService
    let host = document.getElementById("__places_host");
    if (!host) {
      host = document.createElement("div");
      host.id = "__places_host";
      host.style.display = "none";
      document.body.appendChild(host);
    }

    const service = new g.maps.places.PlacesService(host);
    const center = new g.maps.LatLng(lat, lng);
    const keywords = ["iglesia", "church", "templo", "parroquia", "capilla", "mezquita", "sinagoga", "congregacion", "ministerio", "culto"];

    let pending = keywords.length;
    let found = 0;
    const seenIds = new Set<string>();

    keywords.forEach((keyword) => {
      service.nearbySearch(
        { location: center, radius: SEARCH_RADIUS, keyword },
        (results: any[], status: string) => {
          if (status === g.maps.places.PlacesServiceStatus.OK && results) {
            results.forEach((place) => {
              if (seenIds.has(place.place_id)) return;
              seenIds.add(place.place_id);

              const plat = place.geometry.location.lat();
              const plng = place.geometry.location.lng();
              const name = place.name || "Iglesia";
              const type = classifyByName(name);
              const address = place.vicinity || "Buenos Aires";
              const color = TYPE_COLORS[type] || "#94a3b8";
              const emoji = TYPE_EMOJI[type] || "⛪";

              const marker = L.marker([plat, plng], { icon: makePinIcon(L, color, emoji) })
                .addTo(map)
                .bindPopup(buildPopupHTML(name, type, address, plat, plng));
              googleMarkersRef.current.push(marker);
              found++;
            });
          }
          pending--;
          if (pending === 0) {
            setIsSearching(false);
            setPlacesCount(found);
            setStatus(found > 0 ? `${found} lugares encontrados` : "No se encontraron resultados cerca");
          }
        }
      );
    });
  }, []);

  // ── 3. Init Leaflet map ─────────────────────────────────────────────────
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

    const map = L.map(mapDivRef.current, { zoomControl: true }).setView([-34.6037, -58.3816], 13);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 19,
    }).addTo(map);

    // Add DB churches immediately
    churches.forEach((c) => {
      if (!c.latitude || !c.longitude) return;
      const type = c.type || "Cristiana";
      const color = TYPE_COLORS[type] || "#818cf8";
      const emoji = TYPE_EMOJI[type] || "⛪";
      L.marker([c.latitude, c.longitude], { icon: makePinIcon(L, color, emoji) })
        .addTo(map)
        .bindPopup(buildPopupHTML(c.name, type, c.address, c.latitude, c.longitude));
    });

    // Geolocation → center map & search Google Places
    setStatus("Buscando tu ubicación...");
    if (!("geolocation" in navigator)) {
      setStatus("Geolocalización no disponible");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        userLocationRef.current = { lat, lng };
        map.setView([lat, lng], 15);
        setStatus("Ubicación encontrada. Cargando iglesias...");

        // "You are here" blue dot
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

        // Wait for Google Maps to be ready, then search
        const trySearch = () => {
          if ((window as any).google?.maps?.places) {
            searchNearbyChurches(map, L, lat, lng);
          } else {
            setTimeout(trySearch, 400);
          }
        };
        trySearch();
      },
      (err) => {
        console.warn("GPS error:", err);
        setStatus("Ubicación denegada. Mostrando Buenos Aires.");
        const trySearch = () => {
          if ((window as any).google?.maps?.places) {
            searchNearbyChurches(map, L, -34.6037, -58.3816);
          } else {
            setTimeout(trySearch, 400);
          }
        };
        trySearch();
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 4. Pan when targetLocation changes ────────────────────────────────
  useEffect(() => {
    if (mapRef.current && targetLocation) {
      mapRef.current.flyTo([targetLocation.lat, targetLocation.lng], 15, { duration: 1.2 });
    }
  }, [targetLocation]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Status bar */}
      {(isSearching || placesCount === 0) && (
        <div style={{
          position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
          zIndex: 999, background: "rgba(255,255,255,0.96)", backdropFilter: "blur(4px)",
          padding: "6px 16px", borderRadius: "12px", fontSize: "0.83rem",
          color: "#334155", border: "1px solid #cbd5e1",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)", fontWeight: 600,
          display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap",
        }}>
          {isSearching ? "🔍 Cargando iglesias de Google Maps..." : status}
        </div>
      )}

      {/* Count badge */}
      {!isSearching && placesCount > 0 && (
        <div style={{
          position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
          zIndex: 999, background: "rgba(79,70,229,0.92)", backdropFilter: "blur(4px)",
          padding: "5px 16px", borderRadius: "12px", fontSize: "0.83rem",
          color: "white", boxShadow: "0 4px 15px rgba(79,70,229,0.35)", fontWeight: 700,
          whiteSpace: "nowrap",
        }}>
          ⛪ {placesCount} lugares de culto encontrados
        </div>
      )}

      <div ref={mapDivRef} style={{ width: "100%", height: "100%" }} />

      <style>{`
        .leaflet-popup-content-wrapper { border-radius: 14px !important; box-shadow: 0 8px 30px rgba(0,0,0,0.15) !important; }
        .leaflet-popup-content { margin: 14px 16px !important; }
        .leaflet-popup-tip-container { display: none; }
      `}</style>
    </div>
  );
}
