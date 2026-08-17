"use client";

import dynamic from "next/dynamic";

const MapLibreComponent = dynamic(() => import("./MapLibreComponent"), {
  ssr: false,
  loading: () => (
    <div style={{ height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.2)" }}>
      <div style={{ textAlign: "center" }}>
        <div className="loading-spinner" />
        <p style={{ color: "var(--text-secondary)", marginTop: "15px" }}>Cargando mapa...</p>
      </div>
    </div>
  ),
});

export default MapLibreComponent;
