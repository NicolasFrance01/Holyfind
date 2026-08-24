"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import MapLoader from "@/components/MapLoader";
import { useSession, signIn, signOut } from "next-auth/react";

type Church = {
  id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  type: string | null;
  imageUrl: string | null;
  phone?: string | null;
  website?: string | null;
  instagram?: string | null;
  youtube?: string | null;
  facebook?: string | null;
  whatsapp?: string | null;
  events?: any[];
};

export default function MapsViewClient({ initialChurches }: { initialChurches: Church[] }) {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "SUPERADMIN";
  const [searchTerm, setSearchTerm] = useState("");
  
  // Lista de iglesias de OSM encontradas por el mapa
  const [osmPlaces, setOsmPlaces] = useState<Church[]>([]);
  // Filtro activo
  const [activeFilter, setActiveFilter] = useState("Todas");

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [targetLocation, setTargetLocation] = useState<{lat: number, lng: number} | null>(null);
  const [selectedChurchId, setSelectedChurchId] = useState<string | null>(null);
  const [isPlaceSelected, setIsPlaceSelected] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add Church Modal
  const [showAddModal, setShowAddModal] = useState(false);

  const filters = ["Todas", "Católica", "Cristiana Evangélica", "Cristiana", "Islam", "Judaísmo", "Otro"];

  // Auto-Geolocation on load
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setTargetLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn("Geolocalización denegada o con error:", error);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  useEffect(() => {
    if (!searchTerm || searchTerm.length < 3) {
      setSuggestions([]);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      // Find matching churches first
      const churchMatches = initialChurches.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.address.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 3).map(c => ({
        type: 'church',
        id: c.id,
        display_name: c.name,
        lat: c.latitude,
        lon: c.longitude,
        desc: c.address
      }));

      // Use Google Places Autocomplete if available (loaded by MapComponent)
      const w = window as any;
      if (w.google?.maps?.places) {
        try {
          const autocompleteService = new w.google.maps.places.AutocompleteService();
          autocompleteService.getPlacePredictions({ input: searchTerm }, (predictions: any, status: any) => {
            if (status !== w.google.maps.places.PlacesServiceStatus.OK || !predictions) {
              setSuggestions(churchMatches);
              return;
            }
            const placeMatches = predictions.map((p: any) => ({
              type: 'place',
              id: p.place_id,
              display_name: p.description,
              lat: null,
              lon: null
            }));
            setSuggestions([...churchMatches, ...placeMatches]);
          });
        } catch (err) {
          setSuggestions(churchMatches);
        }
      } else {
        setSuggestions(churchMatches);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchTerm, initialChurches]);

  // Combine DB and OSM churches, removing exact duplicate coordinates if any
  const allPlaces = [...initialChurches, ...osmPlaces];
  const uniquePlaces = Array.from(new Map(allPlaces.map(p => [`${p.latitude},${p.longitude}`, p])).values());

  const filteredChurches = uniquePlaces.filter((church) => {
    // Filter by type
    if (activeFilter !== "Todas" && church.type !== activeFilter) return false;

    // Filter by search term
    const matchesSearch = isPlaceSelected || !searchTerm ||
      church.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      church.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const typeColors: Record<string, string> = {
    "Católica":             "#818cf8",
    "Cristiana Evangélica": "#f472b6",
    "Cristiana":            "#c084fc",
    "Islam":                "#34d399",
    "Judaísmo":             "#60a5fa",
    "Otro":                 "#94a3b8",
  };

  const handleSuggestionClick = (sug: any) => {
    setSearchTerm(sug.display_name);
    setShowSuggestions(false);
    
    const w = window as any;
    if (sug.type === 'place' && !sug.lat && w.google?.maps) {
      const geocoder = new w.google.maps.Geocoder();
      geocoder.geocode({ placeId: sug.id }, (results: any, status: any) => {
        if (status === "OK" && results && results[0]) {
          const location = results[0].geometry.location;
          setTargetLocation({ lat: location.lat(), lng: location.lng() });
        }
      });
      setIsPlaceSelected(true);
      setSelectedChurchId(null);
    } else if (sug.lat && sug.lon) {
      setTargetLocation({ lat: sug.lat, lng: sug.lon });
      if (sug.type === 'church') {
        setIsPlaceSelected(false);
        setSelectedChurchId(sug.id);
        setSidebarOpen(true);
      } else {
        setIsPlaceSelected(true);
        setSelectedChurchId(null);
      }
    }
  };

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative", overflow: "hidden", background: "var(--bg-gradient-start)" }}>
      
      {/* Top Bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
        padding: "12px 20px",
        background: "rgba(15, 23, 42, 0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--glass-border)",
        display: "flex", alignItems: "center", gap: "12px"
      }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span className="text-gradient" style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "1.5rem" }}>Holyfind</span>
        </Link>

        {/* Search Input with Autocomplete */}
        <div style={{ flex: 1, maxWidth: "500px", position: "relative" }}>
          <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="Buscar iglesia o ciudad..."
            className="form-input"
            style={{ width: "100%", paddingLeft: "42px", borderRadius: "99px", padding: "10px 20px 10px 42px", fontSize: "0.9rem" }}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsPlaceSelected(false);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />

          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: "absolute", top: "100%", left: 0, right: 0, marginTop: "8px",
              background: "var(--surface)", border: "1px solid var(--border-strong)",
              borderRadius: "16px", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
              zIndex: 100
            }}>
              {suggestions.map((sug, idx) => (
                <div key={idx} onClick={() => handleSuggestionClick(sug)} style={{
                  padding: "12px 16px", cursor: "pointer", borderBottom: idx < suggestions.length - 1 ? "1px solid var(--border)" : "none",
                  display: "flex", alignItems: "center", gap: "12px", transition: "background 0.2s"
                }} onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>{sug.type === 'church' ? '⛪' : '📍'}</span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ color: "var(--text-primary)", fontSize: "0.9rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sug.display_name}</p>
                    {sug.desc && <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sug.desc}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: count + sidebar toggle + auth link */}
        <div style={{ marginLeft: "auto", display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
            {filteredChurches.length} lugar{filteredChurches.length !== 1 ? "es" : ""} de culto
          </span>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="btn-secondary"
            style={{ padding: "6px 14px", fontSize: "0.85rem", borderRadius: "10px" }}
          >
            {sidebarOpen ? "✕ Cerrar" : "☰ Lista"}
          </button>
          
          {session?.user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {session.user.image && (
                <img src={session.user.image} alt="Perfil" style={{ width: "28px", height: "28px", borderRadius: "50%" }} />
              )}
              <Link
                href={isAdmin ? "/admin/maps" : "/dashboard"}
                className="btn-secondary"
                style={{ padding: "6px 14px", fontSize: "0.85rem", borderRadius: "10px", textDecoration: "none" }}
              >
                {isAdmin ? "⚙️ Admin" : "📋 Mi Panel"}
              </Link>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="btn-secondary" style={{ padding: "6px 14px", fontSize: "0.85rem", borderRadius: "10px" }}>
                Salir
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-primary" style={{ padding: "7px 18px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px", textDecoration: "none" }}>
              Iniciar Sesión
            </Link>
          )}
        </div>
      </div>

      {/* Map (full screen) */}
      <div style={{ position: "absolute", inset: 0, paddingTop: "65px" }}>
        <MapLoader 
          churches={initialChurches} 
          targetLocation={targetLocation}
          selectedChurchId={selectedChurchId}
          onPlacesUpdate={setOsmPlaces}
          isAdmin={isAdmin}
        />
      </div>

      {/* Floating Sidebar List */}
      <div style={{
        position: "absolute", top: "75px", right: sidebarOpen ? "15px" : "-360px",
        width: "360px", maxHeight: "calc(100vh - 90px)",
        transition: "right 0.3s ease", zIndex: 1000,
        display: "flex", flexDirection: "column", gap: "12px",
        background: "rgba(15,23,42,0.85)",
        backdropFilter: "blur(20px)",
        border: "1px solid var(--glass-border)",
        borderRadius: "16px",
        padding: "16px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
      }}>
        <h3 style={{ color: "white", fontSize: "1.1rem", fontWeight: 800 }}>Lugares de Culto ({filteredChurches.length})</h3>
        
        {/* Filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              style={{
                padding: "4px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                background: activeFilter === filter ? typeColors[filter] || "var(--primary-color)" : "rgba(255,255,255,0.1)",
                color: "white", border: "1px solid rgba(255,255,255,0.1)",
                transition: "all 0.2s"
              }}
            >
              {filter}
            </button>
          ))}
        </div>

        <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", paddingRight: "4px" }}>
          {filteredChurches.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)" }}>
              No se encontraron lugares
            </div>
          ) : filteredChurches.map((church) => (
            <div key={church.id} className="glass-panel" style={{ padding: "12px", borderRadius: "12px", cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--primary-color)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--glass-border)")}
            >
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                {church.imageUrl ? (
                  <img src={church.imageUrl} alt={church.name} style={{ width: "40px", height: "40px", borderRadius: "10px", objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "1.2rem" }}>
                    ⛪
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "2px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: typeColors[church.type ?? ""] || "#94a3b8", flexShrink: 0 }} />
                    <h4 style={{ color: "white", fontSize: "0.85rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{church.name}</h4>
                  </div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📍 {church.address}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Add Church Button */}
      <button 
        onClick={() => setShowAddModal(true)}
        style={{
          position: "absolute", bottom: "30px", right: "20px", zIndex: 15,
          background: "var(--primary-color)", color: "white",
          border: "none", borderRadius: "99px", padding: "12px 20px",
          fontSize: "0.95rem", fontWeight: 700, cursor: "pointer",
          boxShadow: "0 10px 25px rgba(79, 70, 229, 0.4)",
          display: "flex", alignItems: "center", gap: "8px",
          transition: "transform 0.2s, background 0.2s"
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
      >
        <span>➕</span> ¿Falta tu iglesia?
      </button>

      {/* Add Church Modal */}
      {showAddModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(5px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
        }}>
          <div style={{
            background: "var(--surface)", border: "1px solid var(--glass-border)",
            borderRadius: "24px", padding: "30px", maxWidth: "500px", width: "100%",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)", position: "relative"
          }}>
            <button 
              onClick={() => setShowAddModal(false)}
              style={{
                position: "absolute", top: "15px", right: "20px", background: "transparent",
                border: "none", color: "var(--text-secondary)", fontSize: "1.5rem", cursor: "pointer"
              }}
            >×</button>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "15px", color: "white" }}>¡Sumá tu iglesia al mapa!</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.5, marginBottom: "25px" }}>
              Holyfind usa <strong>OpenStreetMap</strong> (el "Wikipedia" de los mapas). Si tu iglesia no aparece, la forma más rápida es agregarla vos mismo al mapa mundial de forma gratuita y en 2 minutos aparecerá para todos.
            </p>

            <a 
              href="https://www.openstreetmap.org/edit" 
              target="_blank" rel="noopener noreferrer"
              style={{
                display: "block", textAlign: "center", background: "#7c3aed", color: "white",
                textDecoration: "none", padding: "14px", borderRadius: "12px", fontWeight: 700, marginBottom: "20px",
                boxShadow: "0 4px 15px rgba(124, 58, 237, 0.3)"
              }}
            >
              🗺️ Agregarla en OpenStreetMap (Rápido)
            </a>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "20px 0" }}>
              <div style={{ height: "1px", background: "var(--border)", flex: 1 }}></div>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: 600 }}>O ENVIANOS LOS DATOS</span>
              <div style={{ height: "1px", background: "var(--border)", flex: 1 }}></div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              alert("¡Gracias! Procesaremos la solicitud pronto. Para resultados inmediatos, te recomendamos agregarla directamente en OpenStreetMap arriba.");
              setShowAddModal(false);
            }}>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Nombre de la iglesia</label>
                <input type="text" required placeholder="Ej: Iglesia Bautista Emmanuel" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.05)", color: "white" }} />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Dirección exacta o Ciudad</label>
                <input type="text" required placeholder="Ej: Av. San Martín 1234, Córdoba" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.05)", color: "white" }} />
              </div>
              <button type="submit" style={{
                width: "100%", background: "transparent", color: "white", border: "1px solid var(--border)",
                padding: "12px", borderRadius: "10px", fontWeight: 600, cursor: "pointer", marginTop: "10px"
              }}>
                Enviar solicitud manual
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
