"use client";

import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div style={{ height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--glass-bg)", borderRadius: "24px" }}>
      <p style={{ color: "var(--text-secondary)", fontSize: "1.2rem", fontWeight: "500" }}>Cargando Mapa...</p>
    </div>
  ),
});

export default function MapLoader({ churches }: { churches: any[] }) {
  return <MapComponent churches={churches} />;
}
