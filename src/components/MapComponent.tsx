"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Fix Leaflet default icon issue in Next.js
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MapComponent({ churches }: { churches: any[] }) {
  useEffect(() => {
    // Ensure leaflet CSS is loaded properly
    require("leaflet/dist/leaflet.css");
  }, []);

  return (
    <div style={{ height: "100%", width: "100%", borderRadius: "24px", overflow: "hidden", border: "1px solid var(--glass-border)", boxShadow: "var(--glass-shadow)" }}>
      <MapContainer 
        center={[-34.6037, -58.3816]} // Default to Buenos Aires or user location later
        zoom={12} 
        scrollWheelZoom={true} 
        style={{ height: "100%", width: "100%", zIndex: 10 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {churches.map((church) => (
          church.latitude && church.longitude ? (
            <Marker key={church.id} position={[church.latitude, church.longitude]} icon={icon}>
              <Popup>
                <div style={{ fontFamily: "var(--font-body)", minWidth: "150px" }}>
                  <h4 style={{ margin: "0 0 5px 0", color: "var(--primary-color)", fontWeight: "600" }}>{church.name}</h4>
                  <p style={{ margin: "0 0 5px 0", fontSize: "0.9rem", color: "#666" }}>{church.address}</p>
                  <p style={{ margin: "0", fontSize: "0.85rem", fontStyle: "italic", color: "#888" }}>{church.type}</p>
                  {church.imageUrl && (
                    <img src={church.imageUrl} alt={church.name} style={{ width: "100%", height: "auto", marginTop: "10px", borderRadius: "8px" }} />
                  )}
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}
      </MapContainer>
    </div>
  );
}
