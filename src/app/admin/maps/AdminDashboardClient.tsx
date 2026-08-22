"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toggleUserStatus, deleteChurch, assignChurchManager, removeChurchManager } from "../actions";
import { saveChurch } from "@/app/admin/actions";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

// Dynamic import for the map to avoid SSR issues
const MapLibreComponent = dynamic(() => import("@/components/MapLibreComponent"), {
  ssr: false,
  loading: () => <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>Cargando mapa...</div>
});

type ChurchFormData = {
  id?: string;
  name: string;
  address: string;
  type: string;
  latitude: number | null;
  longitude: number | null;
  description: string;
};

const defaultForm: ChurchFormData = {
  name: "", address: "", type: "Católica", latitude: null, longitude: null, description: ""
};

export default function AdminDashboardClient({ churches, users }: { churches: any[], users: any[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("iglesias");
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedChurch, setSelectedChurch] = useState<any>(null);
  const [formData, setFormData] = useState<ChurchFormData>(defaultForm);

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

  const openModal = (church?: any) => {
    if (church) {
      setFormData({
        id: church.id,
        name: church.name,
        address: church.address,
        type: church.type || "Católica",
        latitude: church.latitude,
        longitude: church.longitude,
        description: church.description || ""
      });
    } else {
      setFormData(defaultForm);
    }
    setIsModalOpen(true);
  };

  const handleSaveChurch = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await saveChurch(formData);
      setIsModalOpen(false);
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-gradient-start)", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "15px 24px", background: "rgba(15, 23, 42, 0.9)", borderBottom: "1px solid var(--glass-border)", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
        <h1 style={{ fontSize: "1.5rem", color: "white" }}>Panel Superadmin</h1>
        <div style={{ display: "flex", gap: "15px" }}>
          <Link href="/maps" className="btn-secondary" style={{ padding: "8px 16px" }}>Volver al Mapa</Link>
          <button className="btn-primary" style={{ padding: "8px 16px" }}>Salir</button>
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        
        {/* Left Side: Content / Tables */}
        <div style={{ flex: 1, padding: "30px", overflowY: "auto" }}>
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
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center" }}>
                <h2 style={{ fontSize: "1.8rem" }}>Iglesias Registradas</h2>
                <button className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.9rem" }} onClick={() => openModal()}>+ Nueva Iglesia</button>
              </div>
              {churches.length === 0 ? (
                <p style={{ color: "var(--text-secondary)" }}>No hay iglesias registradas.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", color: "white", minWidth: "600px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--glass-border)", textAlign: "left" }}>
                        <th style={{ padding: "12px" }}>Nombre</th>
                        <th style={{ padding: "12px" }}>Dirección</th>
                        <th style={{ padding: "12px" }}>Dueños</th>
                        <th style={{ padding: "12px" }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {churches.map(c => (
                        <tr key={c.id} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                          <td style={{ padding: "12px", fontWeight: 600 }}>{c.name}</td>
                          <td style={{ padding: "12px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>{c.address}</td>
                          <td style={{ padding: "12px", fontSize: "0.85rem" }}>
                            {c.managers && c.managers.length > 0 ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                {c.managers.map((m: any) => (
                                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span style={{ color: "var(--text-secondary)" }}>{m.user?.email}</span>
                                    <button 
                                      onClick={() => startTransition(() => { removeChurchManager(m.userId, c.id) })}
                                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.75rem" }}
                                      disabled={isPending}
                                    >✖</button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>Sin dueño</span>
                            )}
                          </td>
                          <td style={{ padding: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <button className="btn-secondary" style={{ padding: "4px 10px", fontSize: "0.8rem", borderColor: "var(--primary-color)", color: "var(--primary-color)" }} onClick={() => { setSelectedChurch(c); setIsAssignModalOpen(true); }}>Asignar Dueño</button>
                            <button className="btn-secondary" style={{ padding: "4px 10px", fontSize: "0.8rem" }} onClick={() => openModal(c)}>Editar</button>
                            <button className="btn-secondary" style={{ padding: "4px 10px", fontSize: "0.8rem", color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.5)" }} onClick={() => handleDeleteChurch(c.id)}>Eliminar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "usuarios" && (
            <div className="glass-panel" style={{ padding: "30px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "1.8rem" }}>Clientes (Gestores)</h2>
              </div>
              {users.length === 0 ? (
                <p style={{ color: "var(--text-secondary)" }}>No hay clientes registrados.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", color: "white", minWidth: "600px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--glass-border)", textAlign: "left" }}>
                        <th style={{ padding: "12px" }}>Email</th>
                        <th style={{ padding: "12px" }}>Estado</th>
                        <th style={{ padding: "12px" }}>Acciones</th>
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
                              {u.isActive ? "Suspender" : "Restaurar"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Live Map Preview */}
        <div style={{ width: "40%", borderLeft: "1px solid var(--border-strong)", position: "relative" }}>
          <div style={{ position: "absolute", top: 10, left: 10, zIndex: 10, background: "rgba(15,23,42,0.8)", backdropFilter: "blur(10px)", padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "0.8rem", fontWeight: 600 }}>
            Mapa en vivo ({churches.length})
          </div>
          <MapLibreComponent churches={churches} />
        </div>

      </main>

      {/* Modal Form */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="glass-panel" style={{ width: "90%", maxWidth: "500px", padding: "30px", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ marginBottom: "20px", fontSize: "1.5rem" }}>{formData.id ? "Editar Iglesia" : "Nueva Iglesia"}</h2>
            <form onSubmit={handleSaveChurch} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input required className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Dirección (Ciudad, País)</label>
                <input required className="form-input" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Tipo de Iglesia</label>
                <select className="form-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="Católica">Católica</option>
                  <option value="Cristiana Evangélica">Cristiana Evangélica</option>
                  <option value="Otra">Otra</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Latitud</label>
                  <input type="number" step="any" className="form-input" value={formData.latitude || ""} onChange={e => setFormData({...formData, latitude: parseFloat(e.target.value) || null})} placeholder="-34.6037" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Longitud</label>
                  <input type="number" step="any" className="form-input" value={formData.longitude || ""} onChange={e => setFormData({...formData, longitude: parseFloat(e.target.value) || null})} placeholder="-58.3816" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea className="form-input" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
              </div>
              
              <div style={{ display: "flex", gap: "10px", marginTop: "10px", justifyContent: "flex-end" }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={isPending}>{isPending ? "Guardando..." : "Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Assign Modal Form */}
      {isAssignModalOpen && selectedChurch && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="glass-panel" style={{ width: "90%", maxWidth: "500px", padding: "30px", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ marginBottom: "20px", fontSize: "1.5rem" }}>Asignar Dueño a {selectedChurch.name}</h2>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const userId = formData.get("userId") as string;
              if (userId) {
                startTransition(async () => {
                  const res = await assignChurchManager(userId, selectedChurch.id);
                  if (res.error) alert(res.error);
                  else setIsAssignModalOpen(false);
                });
              }
            }} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div className="form-group">
                <label className="form-label">Seleccionar Usuario (Cliente)</label>
                <select name="userId" required className="form-input">
                  <option value="">Selecciona un usuario...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.email}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: "flex", gap: "10px", marginTop: "10px", justifyContent: "flex-end" }}>
                <button type="button" className="btn-secondary" onClick={() => setIsAssignModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={isPending}>{isPending ? "Asignando..." : "Asignar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
