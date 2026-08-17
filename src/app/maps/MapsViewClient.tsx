"use client";

import { useState } from "react";
import Link from "next/link";
import MapLoader from "@/components/MapLoader";

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

export default function MapsViewClient({ initialChurches }: { initialChurches: Church[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("Todas");

  const filteredChurches = initialChurches.filter((church) => {
    const matchesSearch = church.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          church.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "Todas" || church.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-gradient-start)" }}>
      {/* Header */}
      <header style={{ padding: "15px 24px", background: "rgba(15, 23, 42, 0.9)", borderBottom: "1px solid var(--glass-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" className="logo">
          <span className="text-gradient">Holyfind</span>
        </Link>
        <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
          <input 
            type="text" 
            placeholder="Buscar por nombre o dirección..." 
            className="form-input"
            style={{ width: "300px", padding: "10px 15px", borderRadius: "99px" }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className="form-input" 
            style={{ width: "200px", padding: "10px 15px", borderRadius: "99px", WebkitAppearance: "none" }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="Todas">Todas las religiones</option>
            <option value="Católica">Católica</option>
            <option value="Cristiana Evangélica">Cristiana Evangélica</option>
            <option value="Otra">Otra</option>
          </select>
          <Link href="/admin/maps" className="btn-secondary" style={{ padding: "8px 20px", fontSize: "0.95rem" }}>
            Admin
          </Link>
        </div>
      </header>

      {/* Map Area */}
      <main style={{ flex: 1, position: "relative", padding: "20px" }}>
        <div className="glass-panel" style={{ height: "100%", width: "100%", overflow: "hidden" }}>
          <MapLoader churches={filteredChurches} />
        </div>
      </main>
    </div>
  );
}
