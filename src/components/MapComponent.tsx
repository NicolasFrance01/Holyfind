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
  phone: string | null;
  website: string | null;
  instagram: string | null;
  youtube: string | null;
  facebook: string | null;
  whatsapp: string | null;
  events?: any[];
};

type Props = {
  churches: Church[];
  targetLocation?: { lat: number; lng: number } | null;
  selectedChurchId?: string | null;
  onPlacesUpdate?: (places: Church[]) => void;
  isAdmin?: boolean;
};

function buildPopupHTML(name: string, type: string, address: string, lat: number, lng: number, isDB: boolean = false, isAdmin: boolean = false, events: any[] = [], church?: Partial<Church>): string {
  const color = TYPE_COLORS[type] || "#94a3b8";
  const emoji = church?.imageUrl ? `<img src="${church.imageUrl}" style="width:28px;height:28px;border-radius:6px;object-fit:cover;" />` : (TYPE_EMOJI[type] || "⛪");
  
  let eventsHtml = '';
  if (events && events.length > 0) {
    eventsHtml = '<div style="margin: 10px 0; padding: 10px; background: rgba(99,102,241,0.08); border-radius: 8px; border: 1px solid rgba(99,102,241,0.2);">' + 
      '<h5 style="margin: 0 0 5px 0; font-size: 0.85rem; color: #818cf8;">📅 Próximos Eventos</h5>' +
      events.slice(0, 3).map(e => 
        `<div style="font-size: 0.75rem; color: #475569; margin-bottom: 4px;"><strong>${e.title}</strong> - ${new Date(e.eventDate).toLocaleDateString()}</div>`
      ).join('') + 
      '</div>';
  }

  // Social links
  const socials: string[] = [];
  if (church?.instagram) socials.push(`<a href="${church.instagram}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:4px;padding:5px 10px;border-radius:8px;text-decoration:none;font-size:0.75rem;font-weight:700;background:linear-gradient(135deg,#f43f5e,#ec4899,#a855f7);color:white;">📸 Instagram</a>`);
  if (church?.youtube) socials.push(`<a href="${church.youtube}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:4px;padding:5px 10px;border-radius:8px;text-decoration:none;font-size:0.75rem;font-weight:700;background:#ef4444;color:white;">▶️ YouTube</a>`);
  if (church?.facebook) socials.push(`<a href="${church.facebook}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:4px;padding:5px 10px;border-radius:8px;text-decoration:none;font-size:0.75rem;font-weight:700;background:#3b82f6;color:white;">📘 Facebook</a>`);
  if (church?.whatsapp) {
    const waNum = church.whatsapp.replace(/[^0-9]/g, '');
    socials.push(`<a href="https://wa.me/${waNum}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:4px;padding:5px 10px;border-radius:8px;text-decoration:none;font-size:0.75rem;font-weight:700;background:#22c55e;color:white;">💬 WhatsApp</a>`);
  }
  const socialsHtml = socials.length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:5px;margin:8px 0;">${socials.join('')}</div>` : '';

  const importBtn = (isAdmin && !isDB) ? 
    `<button onclick="window.importOsmChurchToDB('${name.replace(/'/g, "\\'")}'  , '${type}', '${address.replace(/'/g, "\\'")}'  , ${lat}, ${lng})" style="margin-top: 8px; width: 100%; padding: 6px; background: #10b981; color: white; border: none; border-radius: 8px; font-size: 0.8rem; font-weight: 600; cursor: pointer;">⬇️ Importar a DB (Admin)</button>` : '';

  const imgHtml = church?.imageUrl ? `<img src="${church.imageUrl}" alt="${name}" style="width:100%;height:80px;object-fit:cover;border-radius:10px;margin-bottom:8px;" />` : '';

  return `
    <div style="font-family:system-ui,sans-serif;min-width:220px;padding:4px 0;">
      ${imgHtml}
      <span style="background:${color};color:white;border-radius:99px;padding:2px 10px;font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">${TYPE_EMOJI[type] || '⛪'} ${type}</span>
      <h4 style="margin:8px 0 4px;color:#1e293b;font-size:0.98rem;font-weight:800;line-height:1.3;">${name}</h4>
      <p style="margin:0 0 8px;font-size:0.82rem;color:#64748b;">📍 ${address}</p>
      ${eventsHtml}
      ${socialsHtml}
      <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank" rel="noopener noreferrer"
        style="display:flex;align-items:center;justify-content:center;gap:6px;background:#4f46e5;color:white;text-decoration:none;padding:8px;border-radius:10px;font-size:0.85rem;font-weight:600;width:100%;margin-top:6px;">
        🧭 Cómo llegar
      </a>
      ${importBtn}
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

export default function MapComponent({ churches, targetLocation, onPlacesUpdate, isAdmin = false }: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const osmMarkersRef = useRef<any[]>([]); // only OSM markers, cleared on each search
  
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchButton, setShowSearchButton] = useState(false);

  // ── Overpass search centrado en lat/lng con radio dinámico ──────────────
  const searchOverpass = useCallback(async (map: any, L: any, lat: number, lng: number, radius: number) => {
    setIsSearching(true);
    setShowSearchButton(false);

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

      const foundOsmPlaces: Church[] = [];
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
          .bindPopup(buildPopupHTML(name, type, address, coords[0], coords[1], false, isAdmin));
        osmMarkersRef.current.push(marker);

        foundOsmPlaces.push({
          id: `osm-${el.id || Math.random()}`,
          name,
          address,
          latitude: coords[0],
          longitude: coords[1],
          description: null,
          type,
          imageUrl: null,
          phone: null,
          website: null,
          instagram: null,
          youtube: null,
          facebook: null,
          whatsapp: null,
        });
      });

      if (onPlacesUpdate) {
        onPlacesUpdate(foundOsmPlaces);
      }
    } catch (err) {
      console.error("Error Overpass:", err);
    } finally {
      setIsSearching(false);
    }
  }, [onPlacesUpdate]);

  // ── Funciones globales (para los botones del popup html) ─────────────
  useEffect(() => {
    (window as any).importOsmChurchToDB = async (name: string, type: string, address: string, lat: number, lng: number) => {
      try {
        const res = await fetch("/api/admin/import-church", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, type, address, latitude: lat, longitude: lng })
        });
        if (res.ok) {
          alert(`¡${name} importada a la base de datos! Refrescá la página para verla como definitiva.`);
        } else {
          alert("Hubo un error al importar. Verifica que seas admin.");
        }
      } catch (err) {
        alert("Error de red al importar");
      }
    };
  }, []);

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
        .bindPopup(buildPopupHTML(c.name, type, c.address, c.latitude, c.longitude, true, isAdmin, c.events || [], c));
    });

    // Eventos de movimiento -> Mostrar botón de "Buscar en esta zona"
    map.on("moveend", () => {
      setShowSearchButton(true);
    });
    map.on("zoomend", () => {
      setShowSearchButton(true);
    });

    // ── Geolocalización inicial ─────────────────────────────────────────────
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        map.setView([lat, lng], 15);
        
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
          
        // Primera búsqueda automática
        searchOverpass(map, L, lat, lng, radiusForZoom(15));
      },
      (err) => {
        console.warn("GPS denegado:", err.message);
        // Si no hay GPS, hacer búsqueda en la zona por defecto (Buenos Aires)
        const center = map.getCenter();
        searchOverpass(map, L, center.lat, center.lng, radiusForZoom(14));
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

  // ── Pan cuando cambia targetLocation (búsqueda de barra) ─────────────────
  useEffect(() => {
    if (mapRef.current && targetLocation) {
      mapRef.current.flyTo([targetLocation.lat, targetLocation.lng], 15, { duration: 1.2 });
      // Al terminar el flyTo se dispara moveend -> mostrará el botón
    }
  }, [targetLocation]);

  const handleManualSearch = () => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const center = map.getCenter();
    const zoom = map.getZoom();
    const L = require("leaflet");
    searchOverpass(map, L, center.lat, center.lng, radiusForZoom(zoom));
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Botón de Buscar en esta zona / Spinner */}
      {(showSearchButton || isSearching) && (
        <button 
          onClick={handleManualSearch}
          disabled={isSearching}
          style={{
            position: "absolute", top: 15, left: "50%", transform: "translateX(-50%)",
            zIndex: 999, background: isSearching ? "rgba(255,255,255,0.96)" : "#4f46e5",
            backdropFilter: "blur(4px)", cursor: isSearching ? "default" : "pointer",
            padding: "8px 20px", borderRadius: "99px", fontSize: "0.85rem",
            color: isSearching ? "#334155" : "white",
            border: isSearching ? "1px solid #cbd5e1" : "none",
            boxShadow: "0 6px 20px rgba(0,0,0,0.2)", fontWeight: 700,
            whiteSpace: "nowrap", transition: "all 0.3s",
            display: "flex", alignItems: "center", gap: "8px"
          }}
        >
          {isSearching ? (
            <>
              <div style={{ width: "14px", height: "14px", border: "2px solid #334155", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              Buscando...
            </>
          ) : (
            <>
              🔄 Buscar en esta zona
            </>
          )}
        </button>
      )}

      <div ref={mapDivRef} style={{ width: "100%", height: "100%" }} />

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .leaflet-popup-content-wrapper { border-radius: 14px !important; box-shadow: 0 8px 30px rgba(0,0,0,0.15) !important; }
        .leaflet-popup-content { margin: 14px 16px !important; }
        .leaflet-popup-tip-container { display: none; }
      `}</style>
    </div>
  );
}
