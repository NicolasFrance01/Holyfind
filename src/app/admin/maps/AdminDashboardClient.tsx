"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toggleUserStatus, deleteChurch } from "../actions";

export default function AdminDashboardClient({ churches, users }: { churches: any[], users: any[] }) {
  const [activeTab, setActiveTab] = useState("iglesias");
  const [isPending, startTransition] = useTransition();

  const handleToggleUser = (id: string, current: boolean) => {
    startTransition(() => {
      toggleUserStatus(id, current);
    });
  };

  const handleDeleteChurch = (id: string) => {
    if(confirm("¿Estás seguro de que deseas eliminar esta iglesia?")) {
      startTransition(() => {
        deleteChurch(id);
      });
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-gradient-start)" }}>
      <header style={{ padding: "15px 24px", background: "rgba(15, 23, 42, 0.9)", borderBottom: "1px solid var(--glass-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "1.5rem", color: "white" }}>Panel Superadmin</h1>
        <div style={{ display: "flex", gap: "15px" }}>
          <Link href="/maps" className="btn-secondary" style={{ padding: "8px 16px" }}>Volver al Mapa</Link>
          <button className="btn-primary" style={{ padding: "8px 16px" }} onClick={() => {/* Logout logic */}}>Salir</button>
        </div>
      </header>

      <main className="container" style={{ paddingTop: "40px" }}>
        <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
          <button 
            className={`btn-secondary ${activeTab === "iglesias" ? "active" : ""}`} 
            style={activeTab === "iglesias" ? { background: "var(--primary-color)", borderColor: "var(--primary-color)", color: "white" } : {}}
            onClick={() => setActiveTab("iglesias")}
          >
            Gestión de Iglesias
          </button>
          <button 
            className={`btn-secondary ${activeTab === "usuarios" ? "active" : ""}`} 
            style={activeTab === "usuarios" ? { background: "var(--primary-color)", borderColor: "var(--primary-color)", color: "white" } : {}}
            onClick={() => setActiveTab("usuarios")}
          >
            Gestión de Clientes
          </button>
        </div>

        {activeTab === "iglesias" && (
          <div className="glass-panel" style={{ padding: "30px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.8rem" }}>Iglesias Registradas</h2>
              <button className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.9rem" }}>+ Nueva Iglesia</button>
            </div>
            {churches.length === 0 ? (
              <p style={{ color: "var(--text-secondary)" }}>No hay iglesias registradas.</p>
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
                        <button className="btn-secondary" style={{ padding: "4px 10px", fontSize: "0.8rem" }}>Editar</button>
                        <button className="btn-secondary" style={{ padding: "4px 10px", fontSize: "0.8rem", color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.5)" }} onClick={() => handleDeleteChurch(c.id)}>Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "usuarios" && (
          <div className="glass-panel" style={{ padding: "30px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.8rem" }}>Clientes (Gestores)</h2>
              <button className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.9rem" }}>+ Nuevo Cliente</button>
            </div>
            {users.length === 0 ? (
              <p style={{ color: "var(--text-secondary)" }}>No hay clientes registrados.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", color: "white" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--glass-border)", textAlign: "left" }}>
                    <th style={{ padding: "12px" }}>Email</th>
                    <th style={{ padding: "12px" }}>Estado</th>
                    <th style={{ padding: "12px" }}>Acciones de Ciberseguridad</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                      <td style={{ padding: "12px" }}>{u.email}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{ padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem", background: u.isActive ? "rgba(52, 211, 153, 0.2)" : "rgba(239, 68, 68, 0.2)", color: u.isActive ? "#34d399" : "#ef4444" }}>
                          {u.isActive ? "Activo" : "Suspendido"}
                        </span>
                      </td>
                      <td style={{ padding: "12px", display: "flex", gap: "10px" }}>
                        <button 
                          className="btn-secondary" 
                          style={{ padding: "4px 10px", fontSize: "0.8rem", color: u.isActive ? "#ef4444" : "#34d399", borderColor: u.isActive ? "rgba(239, 68, 68, 0.5)" : "rgba(52, 211, 153, 0.5)" }}
                          onClick={() => handleToggleUser(u.id, u.isActive)}
                          disabled={isPending}
                        >
                          {u.isActive ? "Suspender Acceso" : "Restaurar Acceso"}
                        </button>
                        <button className="btn-secondary" style={{ padding: "4px 10px", fontSize: "0.8rem" }}>Asignar Iglesias</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
