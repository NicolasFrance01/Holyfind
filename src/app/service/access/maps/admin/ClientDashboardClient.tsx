"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

export default function ClientDashboardClient({ churches }: { churches: any[] }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-gradient-start)" }}>
      <header style={{ padding: "15px 24px", background: "rgba(15, 23, 42, 0.9)", borderBottom: "1px solid var(--glass-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "1.5rem", color: "white" }}>Mis Iglesias (Panel Cliente)</h1>
        <div style={{ display: "flex", gap: "15px" }}>
          <Link href="/maps" className="btn-secondary" style={{ padding: "8px 16px" }}>Ver Mapa</Link>
          <button className="btn-primary" style={{ padding: "8px 16px" }} onClick={() => signOut({ callbackUrl: '/' })}>Salir</button>
        </div>
      </header>

      <main className="container" style={{ paddingTop: "40px" }}>
        <div className="glass-panel" style={{ padding: "30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "1.8rem" }}>Iglesias Asignadas</h2>
          </div>
          {churches.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>No tienes iglesias asignadas aún. Contacta al administrador.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", color: "white" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--glass-border)", textAlign: "left" }}>
                  <th style={{ padding: "12px" }}>Nombre</th>
                  <th style={{ padding: "12px" }}>Dirección</th>
                  <th style={{ padding: "12px" }}>Tipo</th>
                  <th style={{ padding: "12px" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {churches.map(c => (
                  <tr key={c.id} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                    <td style={{ padding: "12px" }}>{c.name}</td>
                    <td style={{ padding: "12px", color: "var(--text-secondary)" }}>{c.address}</td>
                    <td style={{ padding: "12px" }}>{c.type || "-"}</td>
                    <td style={{ padding: "12px", display: "flex", gap: "10px" }}>
                      <button className="btn-secondary" style={{ padding: "4px 10px", fontSize: "0.8rem" }}>Editar Perfil</button>
                      <button className="btn-secondary" style={{ padding: "4px 10px", fontSize: "0.8rem" }}>Subir Imágenes</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
