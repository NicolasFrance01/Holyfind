"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

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
  googleMapsLoaded?: boolean;
};

const GOOGLE_MAPS_API_KEY = "AIzaSyDSbH5uE_BwS00ZxTstjMb7b8K-SOyWwkU";

const typeColors: Record<string, string> = {
  "Católica":             "#818cf8",
  "Cristiana Evangélica": "#f472b6",
  "Cristiana":            "#c084fc",
  "Ortodoxa":             "#a78bfa",
  "Islam":                "#34d399",
  "Judaísmo":             "#60a5fa",
  "Otro":                 "#94a3b8",
};

export default function MapComponent({ churches, targetLocation, selectedChurchId, googleMapsLoaded }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [placesCount, setPlacesCount] = useState(0);

  // Initialise the Leaflet map once
  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    const L = require("leaflet");

    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapRef.current, { zoomControl: true }).setView([-34.6037, -58.3816], 14);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Add DB churches
    addDBChurches(map, L, churches);

    // Ask for location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          map.setView([latitude, longitude], 15);

          // "You are here" marker
          const youIcon = L.divIcon({
            className: "",
            html: `<div style="width:20px;height:20px;border-radius:50%;background:#4f46e5;border:3px solid white;box-shadow:0 0 0 4px rgba(79,70,229,0.3);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });
          if (userMarkerRef.current) userMarkerRef.current.remove();
          userMarkerRef.current = L.marker([latitude, longitude], { icon: youIcon })
            .addTo(map)
            .bindPopup("<b>📍 Estás acá</b>")
            .openPopup();

          // Now fetch nearby churches from Google Places
          loadGoogleNearbyChurches(map, L, latitude, longitude);
        },
        (err) => {
          console.warn("Geolocalización denegada:", err);
          // Still try with Buenos Aires default
          loadGoogleNearbyChurches(map, L, -34.6037, -58.3816);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pan to targetLocation when it changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !targetLocation) return;
    map.flyTo([targetLocation.lat, targetLocation.lng], 15, { duration: 1.2 });
  }, [targetLocation]);

  // Re-add DB churches whenever the list changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const L = require("leaflet");
    // Remove old DB markers
    markersRef.current.forEach((m) => { if (m._isDB) m.remove(); });
    markersRef.current = markersRef.current.filter((m) => !m._isDB);
    addDBChurches(map, L, churches);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [churches]);

  function addDBChurches(map: any, L: any, list: Church[]) {
    list.forEach((c) => {
      if (!c.latitude || !c.longitude) return;
      const color = typeColors[c.type ?? ""] || "#818cf8";
      const icon = makePinIcon(L, color, "⛪");
      const m = L.marker([c.latitude, c.longitude], { icon })
        .addTo(map)
        .bindPopup(buildPopup(c.name, c.type || "Iglesia", c.address, c.latitude, c.longitude));
      (m as any)._isDB = true;
      markersRef.current.push(m);
    });
  }

  function loadGoogleNearbyChurches(map: any, L: any, lat: number, lng: number) {
    // We use a hidden div to host the PlacesService (required by the API)
    const hiddenDiv = document.getElementById("__places_service_host") || (() => {
      const d = document.createElement("div");
      d.id = "__places_service_host";
      d.style.display = "none";
      document.body.appendChild(d);
      return d;
    })();

    function doSearch() {
      const g = (window as any).google;
      if (!g) return;

      setIsLoadingPlaces(true);

      const service = new g.maps.places.PlacesService(hiddenDiv);
      const location = new g.maps.LatLng(lat, lng);

      const KEYWORDS = ["iglesia", "church", "templo", "synagogue", "mosque", "sinagoga", "mezquita", "congregacion", "capilla", "parroquia"];
      let done = 0;
      let total = 0;
      const seenIds = new Set<string>();

      function onResults(results: any[], status: any) {
        if (status === g.maps.places.PlacesServiceStatus.OK && results) {
          results.forEach((place: any) => {
            if (seenIds.has(place.place_id)) return;
            seenIds.add(place.place_id);

            const plat = place.geometry.location.lat();
            const plng = place.geometry.location.lng();
            const name = place.name || "Iglesia";
            const type = classifyPlace(place);
            const address = place.vicinity || "Dirección no disponible";

            const icon = makePinIcon(L, typeColors[type] || "#94a3b8", typeEmoji(type));
            const m = L.marker([plat, plng], { icon })
              .addTo(map)
              .bindPopup(buildPopup(name, type, address, plat, plng));
            (m as any)._isDB = false;
            markersRef.current.push(m);
            total++;
          });
        }
        done++;
        if (done >= KEYWORDS.length) {
          setIsLoadingPlaces(false);
          setPlacesCount(total);
        }
      }

      KEYWORDS.forEach((keyword) => {
        service.nearbySearch(
          { location, radius: 5000, keyword },
          onResults
        );
      });
    }

    // If google is already loaded, go; else poll briefly
    if ((window as any).google) {
      doSearch();
    } else {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if ((window as any).google) {
          clearInterval(interval);
          doSearch();
        } else if (attempts > 30) {
          clearInterval(interval);
          console.warn("Google Maps no se cargó a tiempo.");
        }
      }, 500);
    }
  }

  function classifyPlace(place: any): string {
    const name = (place.name || "").toLowerCase();
    const types: string[] = place.types || [];
    if (types.includes("mosque") || name.includes("mezquita") || name.includes("mosque")) return "Islam";
    if (types.includes("synagogue") || name.includes("sinagoga")) return "Judaísmo";
    if (name.includes("católic") || name.includes("catolic") || name.includes("parroquia") || name.includes("basílica") || name.includes("basilica")) return "Católica";
    if (name.includes("evangel") || name.includes("baptist") || name.includes("pentecostal") || name.includes("metodist") || name.includes("presbiteri")) return "Cristiana Evangélica";
    if (types.includes("church") || name.includes("iglesia") || name.includes("church") || name.includes("congregac") || name.includes("capilla")) return "Cristiana";
    return "Otro";
  }

  function typeEmoji(type: string): string {
    const map: Record<string, string> = {
      "Católica": "⛪", "Cristiana Evangélica": "✝️", "Cristiana": "✝️",
      "Islam": "🕌", "Judaísmo": "🕍", "Otro": "🙏",
    };
    return map[type] || "⛪";
  }

  function makePinIcon(L: any, color: string, emoji: string) {
    return L.divIcon({
      className: "",
      html: `<div style="
        background:${color};
        width:32px;height:32px;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 3px 10px rgba(0,0,0,0.35);
        border:2px solid rgba(255,255,255,0.9);
      "><span style="transform:rotate(45deg);font-size:14px;line-height:1;">${emoji}</span></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  }

  function buildPopup(name: string, type: string, address: string, lat: number, lng: number): string {
    const color = typeColors[type] || "#818cf8";
    return `
      <div style="font-family:Arial,sans-serif;min-width:200px;padding:4px 0;">
        <span style="background:${color};color:white;border-radius:99px;padding:2px 10px;font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">${type}</span>
        <h4 style="margin:8px 0 4px;color:#1e293b;font-size:1rem;font-weight:800;line-height:1.3;">${name}</h4>
        <p style="margin:0 0 10px;font-size:0.82rem;color:#64748b;">📍 ${address}</p>
        <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank"
          style="display:flex;align-items:center;justify-content:center;gap:6px;background:#4f46e5;color:white;text-decoration:none;padding:8px;border-radius:10px;font-size:0.85rem;font-weight:600;">
          🧭 Cómo llegar
        </a>
      </div>
    `;
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Google Maps loader */}
      <script
        id="__google_maps_loader"
        dangerouslySetInnerHTML={{
          __html: `
            if (!window.__googleMapsLoaded) {
              window.__googleMapsLoaded = true;
              var s = document.createElement('script');
              s.src = 'https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places';
              s.async = true;
              document.head.appendChild(s);
            }
          `,
        }}
      />

      {/* Loading indicator */}
      {isLoadingPlaces && (
        <div style={{
          position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
          zIndex: 999, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(4px)",
          padding: "6px 16px", borderRadius: "12px", fontSize: "0.83rem",
          color: "#334155", border: "1px solid #cbd5e1",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)", fontWeight: 600,
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>🔍</span>
          Cargando iglesias con Google Maps...
        </div>
      )}

      {/* Places count badge */}
      {!isLoadingPlaces && placesCount > 0 && (
        <div style={{
          position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
          zIndex: 999, background: "rgba(79,70,229,0.9)", backdropFilter: "blur(4px)",
          padding: "5px 14px", borderRadius: "12px", fontSize: "0.82rem",
          color: "white", boxShadow: "0 4px 15px rgba(79,70,229,0.3)", fontWeight: 700,
        }}>
          ⛪ {placesCount} lugares de culto encontrados
        </div>
      )}

      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .leaflet-popup-content-wrapper { border-radius: 14px !important; }
        .leaflet-popup-content { margin: 12px 14px !important; }
      `}</style>
    </div>
  );
}
