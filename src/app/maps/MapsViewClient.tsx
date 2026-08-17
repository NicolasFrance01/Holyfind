"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import MapLoader from "@/components/MapLoader";
import { useSession, signOut } from "next-auth/react";

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

const CHURCH_TYPES = ["Todas", "Católica", "Cristiana Evangélica", "Otra"];

export default function MapsViewClient({ initialChurches }: { initialChurches: Church[] }) {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("Todas");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [targetLocation, setTargetLocation] = useState<{lat: number, lng: number} | null>(null);
  const [selectedChurchId, setSelectedChurchId] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

      // Fetch Nominatim places
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}&limit=4`);
        const data = await res.json();
        const placeMatches = data.map((d: any) => ({
          type: 'place',
          display_name: d.display_name,
          lat: parseFloat(d.lat),
          lon: parseFloat(d.lon),
        }));

        setSuggestions([...churchMatches, ...placeMatches]);
      } catch (err) {
        console.error("Nominatim fetch error", err);
        setSuggestions(churchMatches);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchTerm, initialChurches]);

  const filteredChurches = initialChurches.filter((church) => {
    const matchesSearch =
      church.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      church.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "Todas" || church.type === filterType;
    return matchesSearch && matchesType;
  });

  const typeColors: Record<string, string> = {
    "Católica": "var(--primary-color)",
    "Cristiana Evangélica": "var(--secondary-color)",
    "Otra": "var(--accent-color)",
  };

  const handleSuggestionClick = (sug: any) => {
    setSearchTerm(sug.display_name);
    setShowSuggestions(false);
    
    if (sug.lat && sug.lon) {
      setTargetLocation({ lat: sug.lat, lng: sug.lon });
    }
    
    if (sug.type === 'church') {
      setSelectedChurchId(sug.id);
      // Ensure the sidebar opens to show the selected church
      setSidebarOpen(true);
    } else {
      setSelectedChurchId(null);
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

        {/* Type Filters */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {CHURCH_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              style={{
                padding: "6px 14px", borderRadius: "99px", border: "1px solid",
                fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                background: filterType === type ? "var(--primary-color)" : "transparent",
                borderColor: filterType === type ? "var(--primary-color)" : "var(--glass-border)",
                color: filterType === type ? "white" : "var(--text-secondary)",
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Right: count + sidebar toggle + admin link */}
        <div style={{ marginLeft: "auto", display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
            {filteredChurches.length} iglesia{filteredChurches.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="btn-secondary"
            style={{ padding: "6px 14px", fontSize: "0.85rem", borderRadius: "10px" }}
          >
            {sidebarOpen ? "✕ Cerrar" : "☰ Lista"}
          </button>
          {session?.user ? (
            <button onClick={() => signOut({ callbackUrl: "/" })} className="btn-secondary" style={{ padding: "6px 14px", fontSize: "0.85rem", borderRadius: "10px" }}>
              Salir
            </button>
          ) : (
            <Link href="/login" className="btn-primary" style={{ padding: "7px 18px", fontSize: "0.85rem" }}>
              Admin
            </Link>
          )}
        </div>
      </div>

      {/* Map (full screen) */}
      <div style={{ position: "absolute", inset: 0, paddingTop: "65px" }}>
        <MapLoader 
          churches={filteredChurches} 
          targetLocation={targetLocation}
          selectedChurchId={selectedChurchId}
        />
      </div>

      {/* Floating Sidebar List */}
      <div style={{
        position: "absolute", top: "75px", right: sidebarOpen ? "15px" : "-360px",
        width: "340px", maxHeight: "calc(100vh - 90px)",
        transition: "right 0.3s ease", zIndex: 10,
        display: "flex", flexDirection: "column", gap: "8px",
        overflowY: "auto",
        padding: "4px",
      }}>
        {filteredChurches.length === 0 ? (
          <div className="glass-panel" style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)" }}>
            No se encontraron iglesias
          </div>
        ) : filteredChurches.map((church) => (
          <div key={church.id} className="glass-panel" style={{ padding: "15px", borderRadius: "14px", cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--primary-color)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--glass-border)")}
          >
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              {church.imageUrl ? (
                <img src={church.imageUrl} alt={church.name} style={{ width: "48px", height: "48px", borderRadius: "10px", objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: "rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "1.4rem" }}>
                  ⛪
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: typeColors[church.type ?? ""] || "var(--primary-color)", flexShrink: 0 }} />
                  <h4 style={{ color: "white", fontSize: "0.9rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{church.name}</h4>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📍 {church.address}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Legend */}
      <div className="glass-panel" style={{
        position: "absolute", bottom: "20px", left: "20px",
        padding: "12px 16px", borderRadius: "12px", zIndex: 10,
      }}>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.7rem", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Tipo</p>
        {Object.entries({ "Católica": "var(--primary-color)", "Evangélica": "var(--secondary-color)", "Otra": "var(--accent-color)" }).map(([type, color]) => (
          <div key={type} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: color }} />
            <span style={{ color: "var(--text-primary)", fontSize: "0.8rem" }}>{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
