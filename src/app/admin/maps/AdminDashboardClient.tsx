"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toggleUserStatus, deleteChurch, deleteUser, updateUser, assignChurchManager, removeChurchManager } from "../actions";
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

export default function AdminDashboardClient({ churches, users, normalUsers }: { churches: any[], users: any[], normalUsers?: any[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("iglesias");
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedChurch, setSelectedChurch] = useState<any>(null);
  const [churchToDelete, setChurchToDelete] = useState<any>(null);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [userToEdit, setUserToEdit] = useState<any>(null);
  const [userEditForm, setUserEditForm] = useState({ name: "", email: "", phone: "", recoveryEmail: "", password: "" });
  const [formData, setFormData] = useState<ChurchFormData>(defaultForm);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [userCreateMsg, setUserCreateMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [createUserForm, setCreateUserForm] = useState({ name: "", email: "", dni: "", password: "" });

  const showUserMsg = (text: string, ok: boolean) => {
    setUserCreateMsg({ text, ok });
    setTimeout(() => setUserCreateMsg(null), 5000);
  };

  const handleToggleUser = (id: string, current: boolean) => {
    startTransition(() => {
      toggleUserStatus(id, current);
    });
  };

  const confirmDeleteChurch = () => {
    if (churchToDelete) {
      startTransition(() => {
        deleteChurch(churchToDelete.id);
        setChurchToDelete(null);
      });
    }
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      startTransition(() => {
        deleteUser(userToDelete.id);
        setUserToDelete(null);
      });
    }
  };

  const handleEditUser = (u: any) => {
    setUserToEdit(u);
    setUserEditForm({
      name: u.name || "",
      email: u.email || "",
      phone: u.phone || "",
      recoveryEmail: u.recoveryEmail || "",
      password: "" // password only filled if changing
    });
  };

  const handleSaveUserEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userToEdit) {
      startTransition(async () => {
        await updateUser(userToEdit.id, userEditForm);
        setUserToEdit(null);
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
            <button 
              className={`btn-secondary ${activeTab === "normal_users" ? "active" : ""}`} 
              style={activeTab === "normal_users" ? { background: "var(--primary-color)", borderColor: "var(--primary-color)", color: "white" } : {}}
              onClick={() => setActiveTab("normal_users")}
            >
              Gestión de Usuarios
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
                            <button className="btn-secondary" style={{ padding: "4px 10px", fontSize: "0.8rem", color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.5)" }} onClick={() => setChurchToDelete(c)}>Eliminar</button>
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
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center" }}>
                <h2 style={{ fontSize: "1.8rem" }}>Clientes (Gestores)</h2>
                <button className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.9rem" }} onClick={() => setIsCreateUserOpen(true)}>+ Nuevo Cliente</button>
              </div>

              {userCreateMsg && (
                <div style={{ padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", background: userCreateMsg.ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", border: `1px solid ${userCreateMsg.ok ? "#10b981" : "#ef4444"}`, color: userCreateMsg.ok ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                  {userCreateMsg.text}
                </div>
              )}
              {users.length === 0 ? (
                <p style={{ color: "var(--text-secondary)" }}>No hay clientes registrados.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", color: "white", minWidth: "600px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--glass-border)", textAlign: "left" }}>
                        <th style={{ padding: "12px" }}>Nombre</th>
                        <th style={{ padding: "12px" }}>Email</th>
                        <th style={{ padding: "12px" }}>DNI</th>
                        <th style={{ padding: "12px" }}>Estado</th>
                        <th style={{ padding: "12px" }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                          <td style={{ padding: "12px", fontWeight: 600 }}>{u.name || <span style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>Sin nombre</span>}</td>
                          <td style={{ padding: "12px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>{u.email}</td>
                          <td style={{ padding: "12px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>{u.dni || "-"}</td>
                          <td style={{ padding: "12px" }}>
                            {!u.isActive ? (
                              <span style={{ padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem", background: "rgba(239, 68, 68, 0.2)", color: "#ef4444" }}>
                                Suspendido
                              </span>
                            ) : !u.emailConfirmed ? (
                              <span style={{ padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem", background: "rgba(251, 191, 36, 0.2)", color: "#fbbf24" }}>
                                ⏳ Pendiente
                              </span>
                            ) : (
                              <span style={{ padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem", background: "rgba(52, 211, 153, 0.2)", color: "#34d399" }}>
                                ✅ Confirmado
                              </span>
                            )}
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
                            <button className="btn-secondary" style={{ padding: "4px 10px", fontSize: "0.8rem", color: "#6366f1", borderColor: "rgba(99, 102, 241, 0.5)" }} onClick={() => handleEditUser(u)}>Editar</button>
                            <button className="btn-secondary" style={{ padding: "4px 10px", fontSize: "0.8rem", color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.5)" }} onClick={() => setUserToDelete(u)}>Eliminar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "normal_users" && normalUsers && (
            <div className="glass-panel" style={{ padding: "30px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center" }}>
                <h2 style={{ fontSize: "1.8rem" }}>Usuarios Comunes</h2>
                <button className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.9rem" }} onClick={() => {
                  /* Optional: could open a create user modal with role USER, but users register themselves usually */
                  alert("Los usuarios comunes se registran directamente desde la app. Podés eliminarlos o suspenderlos desde acá.");
                }}>Info</button>
              </div>

              {normalUsers.length === 0 ? (
                <p style={{ color: "var(--text-secondary)" }}>No hay usuarios registrados.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", color: "white", minWidth: "600px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--glass-border)", textAlign: "left" }}>
                        <th style={{ padding: "12px" }}>Nombre</th>
                        <th style={{ padding: "12px" }}>Email</th>
                        <th style={{ padding: "12px" }}>Teléfono</th>
                        <th style={{ padding: "12px" }}>Estado</th>
                        <th style={{ padding: "12px" }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {normalUsers.map(u => (
                        <tr key={u.id} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                          <td style={{ padding: "12px", fontWeight: 600 }}>{u.name || <span style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>Sin nombre</span>}</td>
                          <td style={{ padding: "12px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>{u.email}</td>
                          <td style={{ padding: "12px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>{u.phone || "-"}</td>
                          <td style={{ padding: "12px" }}>
                            {!u.isActive ? (
                              <span style={{ padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem", background: "rgba(239, 68, 68, 0.2)", color: "#ef4444" }}>
                                Suspendido
                              </span>
                            ) : !u.emailConfirmed ? (
                              <span style={{ padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem", background: "rgba(251, 191, 36, 0.2)", color: "#fbbf24" }}>
                                ⏳ Pendiente
                              </span>
                            ) : (
                              <span style={{ padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem", background: "rgba(52, 211, 153, 0.2)", color: "#34d399" }}>
                                ✅ Confirmado
                              </span>
                            )}
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
                            <button className="btn-secondary" style={{ padding: "4px 10px", fontSize: "0.8rem", color: "#6366f1", borderColor: "rgba(99, 102, 241, 0.5)" }} onClick={() => handleEditUser(u)}>Editar</button>
                            <button className="btn-secondary" style={{ padding: "4px 10px", fontSize: "0.8rem", color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.5)" }} onClick={() => setUserToDelete(u)}>Eliminar</button>
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
          <MapLibreComponent 
            churches={churches} 
            onMapClick={(lat, lng) => {
              if (isPickingLocation) {
                setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                setIsPickingLocation(false);
              }
            }}
          />
          {isPickingLocation && (
            <div style={{ position: "absolute", top: 10, right: 10, zIndex: 10, background: "var(--primary-color)", padding: "10px 20px", borderRadius: "8px", color: "white", fontWeight: 700, boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }}>
              👆 Hacé clic en el mapa para ubicar la iglesia
              <button onClick={() => setIsPickingLocation(false)} style={{ marginLeft: "10px", background: "white", color: "var(--primary-color)", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontWeight: 700 }}>Cancelar</button>
            </div>
          )}
        </div>

      </main>

      {/* Modal Form */}
      {isModalOpen && !isPickingLocation && (
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
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Latitud</label>
                  <input type="number" step="any" className="form-input" value={formData.latitude || ""} onChange={e => setFormData({...formData, latitude: parseFloat(e.target.value) || null})} placeholder="-34.6037" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Longitud</label>
                  <input type="number" step="any" className="form-input" value={formData.longitude || ""} onChange={e => setFormData({...formData, longitude: parseFloat(e.target.value) || null})} placeholder="-58.3816" />
                </div>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ padding: "10px", height: "42px", flexShrink: 0 }}
                  onClick={() => setIsPickingLocation(true)}
                >
                  📍 Ubicar en Mapa
                </button>
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
      {/* Create User Modal */}
      {isCreateUserOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "20px" }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "480px", padding: "32px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ color: "white", fontSize: "1.4rem", fontWeight: 800 }}>👤 Nuevo Cliente</h2>
              <button onClick={() => setIsCreateUserOpen(false)} style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "1.5rem", cursor: "pointer" }}>×</button>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "20px" }}>
              Se creará la cuenta y se le enviará un correo de bienvenida con sus credenciales de acceso.
            </p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              startTransition(async () => {
                try {
                  const res = await fetch("/api/admin/create-user", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(createUserForm)
                  });
                  const json = await res.json();
                  if (!res.ok) {
                    showUserMsg(`❌ ${json.error}`, false);
                  } else {
                    showUserMsg(json.warning || "✅ Cliente creado y correo enviado correctamente", !!json.success);
                    setIsCreateUserOpen(false);
                    setCreateUserForm({ name: "", email: "", dni: "", password: "" });
                  }
                } catch (err) {
                  showUserMsg("❌ Error de red al crear el usuario", false);
                }
              });
            }} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label">Nombre Completo *</label>
                <input required className="form-input" placeholder="Ej: Juan Pérez" value={createUserForm.name} onChange={e => setCreateUserForm({ ...createUserForm, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input required type="email" className="form-input" placeholder="pastor@iglesia.com" value={createUserForm.email} onChange={e => setCreateUserForm({ ...createUserForm, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">DNI / Documento (opcional)</label>
                <input className="form-input" placeholder="Ej: 30123456" value={createUserForm.dni} onChange={e => setCreateUserForm({ ...createUserForm, dni: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Contraseña *</label>
                <input required type="text" className="form-input" placeholder="Contraseña que recibirá por email" value={createUserForm.password} onChange={e => setCreateUserForm({ ...createUserForm, password: e.target.value })} />
                <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", marginTop: "4px" }}>Esta contraseña será incluida en el correo de bienvenida.</p>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button type="button" className="btn-secondary" onClick={() => setIsCreateUserOpen(false)} style={{ flex: 1, padding: "12px" }}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={isPending} style={{ flex: 2, padding: "12px" }}>
                  {isPending ? "Creando..." : "✅ Crear y Enviar Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {churchToDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: "20px" }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "400px", padding: "30px", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "15px" }}>⚠️</div>
            <h2 style={{ color: "white", fontSize: "1.4rem", fontWeight: 800, marginBottom: "10px" }}>¿Eliminar Iglesia?</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "25px", lineHeight: 1.5 }}>
              Estás a punto de eliminar <strong>{churchToDelete.name}</strong>. Esta acción no se puede deshacer. ¿Estás seguro?
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button 
                className="btn-secondary" 
                style={{ flex: 1, padding: "12px" }}
                onClick={() => setChurchToDelete(null)}
                disabled={isPending}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary" 
                style={{ flex: 1, padding: "12px", background: "#ef4444", borderColor: "#ef4444", color: "white" }}
                onClick={confirmDeleteChurch}
                disabled={isPending}
              >
                {isPending ? "Eliminando..." : "Sí, Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete User Modal */}
      {userToDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: "20px" }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "400px", padding: "30px", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "15px" }}>⚠️</div>
            <h2 style={{ color: "white", fontSize: "1.4rem", fontWeight: 800, marginBottom: "10px" }}>¿Eliminar Usuario?</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "25px", lineHeight: 1.5 }}>
              Estás a punto de eliminar a <strong>{userToDelete.email}</strong>. Esta acción no se puede deshacer. ¿Estás seguro?
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button 
                className="btn-secondary" 
                style={{ flex: 1, padding: "12px" }}
                onClick={() => setUserToDelete(null)}
                disabled={isPending}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary" 
                style={{ flex: 1, padding: "12px", background: "#ef4444", borderColor: "#ef4444", color: "white" }}
                onClick={confirmDeleteUser}
                disabled={isPending}
              >
                {isPending ? "Eliminando..." : "Sí, Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {userToEdit && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: "20px" }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "480px", padding: "30px", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ marginBottom: "20px", fontSize: "1.5rem" }}>Editar Usuario</h2>
            <form onSubmit={handleSaveUserEdit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input required className="form-input" value={userEditForm.name} onChange={e => setUserEditForm({...userEditForm, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input required type="email" className="form-input" value={userEditForm.email} onChange={e => setUserEditForm({...userEditForm, email: e.target.value.toLowerCase()})} />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input className="form-input" value={userEditForm.phone} onChange={e => setUserEditForm({...userEditForm, phone: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Email de Recuperación</label>
                <input type="email" className="form-input" value={userEditForm.recoveryEmail} onChange={e => setUserEditForm({...userEditForm, recoveryEmail: e.target.value.toLowerCase()})} />
              </div>
              <div className="form-group">
                <label className="form-label">Nueva Contraseña (opcional)</label>
                <input type="text" className="form-input" placeholder="Dejar en blanco para mantener la actual" value={userEditForm.password} onChange={e => setUserEditForm({...userEditForm, password: e.target.value})} />
              </div>
              
              <div style={{ display: "flex", gap: "10px", marginTop: "10px", justifyContent: "flex-end" }}>
                <button type="button" className="btn-secondary" onClick={() => setUserToEdit(null)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={isPending}>{isPending ? "Guardando..." : "Guardar Cambios"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
