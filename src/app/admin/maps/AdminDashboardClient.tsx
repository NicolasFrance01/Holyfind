"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toggleUserStatus, deleteChurch, deleteUser, updateUser, assignChurchManager, removeChurchManager } from "../actions";
import { saveChurch } from "@/app/admin/actions";
import { saveEventAdmin, deleteEventAdmin, saveActivityAdmin, deleteActivityAdmin } from "@/app/admin/actions";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

// Dynamic import for the map to avoid SSR issues
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>Cargando mapa...</div>
}) as any;

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

export default function AdminDashboardClient({ churches, users, normalUsers, allEvents = [], allActivities = [] }: { churches: any[], users: any[], normalUsers?: any[], allEvents?: any[], allActivities?: any[] }) {
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
  const [userEditForm, setUserEditForm] = useState({ name: "", email: "", phone: "", dni: "", recoveryEmail: "", password: "" });
  const [formData, setFormData] = useState<ChurchFormData>(defaultForm);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [userCreateMsg, setUserCreateMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [createUserForm, setCreateUserForm] = useState({ name: "", email: "", dni: "", password: "" });

  // Event & Activity States
  const defaultEventForm = { title: "", description: "", eventDate: "", type: "MISA", imageUrl: "", videoUrl: "", isPublic: true, churchId: churches[0]?.id || "" };
  const defaultActivityForm = { title: "", description: "", days: "[]", startTime: "", endTime: "", isActive: true, imageUrl: "", videoUrl: "", churchId: churches[0]?.id || "" };
  
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [eventForm, setEventForm] = useState(defaultEventForm);
  
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [activityForm, setActivityForm] = useState(defaultActivityForm);

  const openEventModal = (ev?: any) => {
    if (ev) {
      setEditingEvent(ev);
      setEventForm({
        title: ev.title, description: ev.description || "", eventDate: new Date(ev.eventDate).toISOString().slice(0, 16),
        type: ev.type, imageUrl: ev.imageUrl || "", videoUrl: ev.videoUrl || "", isPublic: ev.isPublic, churchId: ev.churchId
      });
    } else {
      setEditingEvent(null);
      setEventForm(defaultEventForm);
    }
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveEventAdmin({ ...eventForm, id: editingEvent?.id });
      if (res.error) alert(res.error);
      else setIsEventModalOpen(false);
    });
  };

  const handleDeleteEvent = (id: string) => {
    if (!confirm("¿Eliminar este evento?")) return;
    startTransition(async () => {
      await deleteEventAdmin(id);
    });
  };

  const openActivityModal = (act?: any) => {
    if (act) {
      setEditingActivity(act);
      setActivityForm({
        title: act.title, description: act.description || "", days: act.days || "[]",
        startTime: act.startTime || "", endTime: act.endTime || "", isActive: act.isActive,
        imageUrl: act.imageUrl || "", videoUrl: act.videoUrl || "", churchId: act.churchId
      });
    } else {
      setEditingActivity(null);
      setActivityForm(defaultActivityForm);
    }
    setIsActivityModalOpen(true);
  };

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveActivityAdmin({ ...activityForm, id: editingActivity?.id });
      if (res.error) alert(res.error);
      else setIsActivityModalOpen(false);
    });
  };

  const handleDeleteActivity = (id: string) => {
    if (!confirm("¿Eliminar esta actividad?")) return;
    startTransition(async () => {
      await deleteActivityAdmin(id);
    });
  };

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
      dni: u.dni || "",
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
      <header style={{ padding: "15px 24px", background: "rgba(10, 15, 30, 0.5)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10, position: "sticky", top: 0 }}>
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
            <button 
              className={`btn-secondary ${activeTab === "eventos" ? "active" : ""}`} 
              style={activeTab === "eventos" ? { background: "var(--primary-color)", borderColor: "var(--primary-color)", color: "white" } : {}}
              onClick={() => setActiveTab("eventos")}
            >
              Gestión de Eventos
            </button>
            <button 
              className={`btn-secondary ${activeTab === "actividades" ? "active" : ""}`} 
              style={activeTab === "actividades" ? { background: "var(--primary-color)", borderColor: "var(--primary-color)", color: "white" } : {}}
              onClick={() => setActiveTab("actividades")}
            >
              Gestión de Actividades
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
          {activeTab === "eventos" && (
            <div className="glass-panel" style={{ padding: "30px", marginTop: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center" }}>
                <h2 style={{ fontSize: "1.8rem" }}>Eventos Registrados</h2>
                <button className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.9rem" }} onClick={() => openEventModal()}>+ Nuevo Evento</button>
              </div>
              {allEvents.length === 0 ? (
                <p style={{ color: "var(--text-secondary)" }}>No hay eventos registrados.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", color: "white", minWidth: "600px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--glass-border)", textAlign: "left" }}>
                        <th style={{ padding: "12px" }}>Título</th>
                        <th style={{ padding: "12px" }}>Tipo</th>
                        <th style={{ padding: "12px" }}>Iglesia Asociada</th>
                        <th style={{ padding: "12px" }}>Fecha</th>
                        <th style={{ padding: "12px" }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allEvents.map((ev: any) => (
                        <tr key={ev.id} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                          <td style={{ padding: "12px", fontWeight: 600 }}>{ev.title}</td>
                          <td style={{ padding: "12px", color: "var(--text-secondary)" }}>{ev.type}</td>
                          <td style={{ padding: "12px", color: "var(--text-secondary)" }}>{ev.church?.name || "-"}</td>
                          <td style={{ padding: "12px", color: "var(--text-secondary)" }}>{new Date(ev.eventDate).toLocaleDateString("es-AR")}</td>
                          <td style={{ padding: "12px", display: "flex", gap: "8px" }}>
                            <button className="btn-secondary" style={{ padding: "4px 10px", fontSize: "0.8rem" }}>Editar</button>
                            <button className="btn-secondary" style={{ padding: "4px 10px", fontSize: "0.8rem", color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.5)" }}>Eliminar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "actividades" && (
            <div className="glass-panel" style={{ padding: "30px", marginTop: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center" }}>
                <h2 style={{ fontSize: "1.8rem" }}>Actividades Registradas</h2>
                <button className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.9rem" }} onClick={() => openActivityModal()}>+ Nueva Actividad</button>
              </div>
              {allActivities.length === 0 ? (
                <p style={{ color: "var(--text-secondary)" }}>No hay actividades registradas.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", color: "white", minWidth: "600px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--glass-border)", textAlign: "left" }}>
                        <th style={{ padding: "12px" }}>Título</th>
                        <th style={{ padding: "12px" }}>Iglesia Asociada</th>
                        <th style={{ padding: "12px" }}>Estado</th>
                        <th style={{ padding: "12px" }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allActivities.map((act: any) => (
                        <tr key={act.id} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                          <td style={{ padding: "12px", fontWeight: 600 }}>{act.title}</td>
                          <td style={{ padding: "12px", color: "var(--text-secondary)" }}>{act.church?.name || "-"}</td>
                          <td style={{ padding: "12px", color: act.isActive ? "#10b981" : "#ef4444" }}>{act.isActive ? "Activo" : "Inactivo"}</td>
                          <td style={{ padding: "12px", display: "flex", gap: "8px" }}>
                            <button className="btn-secondary" style={{ padding: "4px 10px", fontSize: "0.8rem" }}>Editar</button>
                            <button className="btn-secondary" style={{ padding: "4px 10px", fontSize: "0.8rem", color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.5)" }}>Eliminar</button>
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
          <MapComponent 
            churches={churches} 
            isAdmin={true}
            onMapClick={(lat: number, lng: number) => {
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000 }}>
          <div className="glass-panel" style={{ width: "90%", maxWidth: "500px", padding: "30px", maxHeight: "90vh", overflowY: "auto", background: "rgba(8, 12, 24, 0.95)", border: "1px solid rgba(99,102,241,0.3)" }}>
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
              <div>
                <label className="form-label" style={{ marginBottom: "8px", display: "block" }}>Ubicación</label>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <input type="number" step="any" className="form-input" value={formData.latitude || ""} onChange={e => setFormData({...formData, latitude: parseFloat(e.target.value) || null})} placeholder="Latitud: -34.6037" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <input type="number" step="any" className="form-input" value={formData.longitude || ""} onChange={e => setFormData({...formData, longitude: parseFloat(e.target.value) || null})} placeholder="Longitud: -58.3816" />
                  </div>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    style={{ padding: "10px 14px", height: "42px", flexShrink: 0, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px" }}
                    onClick={() => setIsPickingLocation(true)}
                  >
                    📍 Ubicar en Mapa
                  </button>
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000 }}>
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000, padding: "20px" }}>
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000, padding: "20px" }}>
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000, padding: "20px" }}>
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
                <label className="form-label">DNI</label>
                <input className="form-input" value={userEditForm.dni || ""} onChange={e => setUserEditForm({...userEditForm, dni: e.target.value})} />
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

      {/* ── Event Modal ── */}
      {isEventModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000, padding: "20px" }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "520px", padding: "30px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ color: "white", fontSize: "1.4rem", fontWeight: 800 }}>{editingEvent ? "✏️ Editar Evento" : "📅 Nuevo Evento"}</h2>
              <button onClick={() => setIsEventModalOpen(false)} style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "1.5rem", cursor: "pointer" }}>×</button>
            </div>

            <form onSubmit={handleSaveEvent} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label">Nombre del Evento</label>
                <input required className="form-input" value={eventForm.title} onChange={e => setEventForm({ ...eventForm, title: e.target.value })} placeholder="Ej: Misa de Domingo" />
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Tipo</label>
                  <select className="form-input" value={eventForm.type} onChange={e => setEventForm({ ...eventForm, type: e.target.value })}>
                    {["MISA", "RETIRO", "CONCIERTO", "CONFERENCIA", "BAUTISMO", "BODA", "CONGRESO", "OTRO"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Fecha y Hora</label>
                  <input required type="datetime-local" className="form-input" value={eventForm.eventDate} onChange={e => setEventForm({ ...eventForm, eventDate: e.target.value })} />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Iglesia Asociada</label>
                <select className="form-input" required value={eventForm.churchId} onChange={e => setEventForm({ ...eventForm, churchId: e.target.value })}>
                  <option value="" disabled>Seleccione una iglesia...</option>
                  {churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea className="form-input" rows={3} value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} placeholder="Detalles del evento..." />
              </div>

              <div className="form-group">
                <label className="form-label">URL de Imagen del Evento (opcional)</label>
                <input type="url" className="form-input" value={eventForm.imageUrl} onChange={e => setEventForm({ ...eventForm, imageUrl: e.target.value })} placeholder="https://ejemplo.com/imagen.jpg" />
              </div>

              <div className="form-group">
                <label className="form-label">URL de Video asociado (YouTube o Instagram)</label>
                <input type="url" className="form-input" value={eventForm.videoUrl} onChange={e => setEventForm({ ...eventForm, videoUrl: e.target.value })} placeholder="https://youtube.com/..." />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input type="checkbox" id="isPublic" checked={eventForm.isPublic} onChange={e => setEventForm({ ...eventForm, isPublic: e.target.checked })} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
                <label htmlFor="isPublic" style={{ color: "var(--text-secondary)", fontSize: "0.9rem", cursor: "pointer" }}>
                  Evento público (visible en el mapa)
                </label>
              </div>

              <div style={{ display: "flex", gap: "10px", paddingTop: "8px", justifyContent: "flex-end" }}>
                <button type="button" className="btn-secondary" onClick={() => setIsEventModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={isPending}>
                  {isPending ? "Guardando..." : "Guardar Evento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Activity Modal ── */}
      {isActivityModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000, padding: "20px" }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "520px", padding: "30px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ color: "white", fontSize: "1.4rem", fontWeight: 800 }}>{editingActivity ? "✏️ Editar Actividad" : "🏃 Nueva Actividad"}</h2>
              <button onClick={() => setIsActivityModalOpen(false)} style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "1.5rem", cursor: "pointer" }}>×</button>
            </div>

            <form onSubmit={handleSaveActivity} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label">Nombre de la Actividad</label>
                <input required className="form-input" value={activityForm.title} onChange={e => setActivityForm({ ...activityForm, title: e.target.value })} placeholder="Ej: Grupo de Jóvenes" />
              </div>
              
              <div className="form-group">
                <label className="form-label">Iglesia Asociada</label>
                <select className="form-input" required value={activityForm.churchId} onChange={e => setActivityForm({ ...activityForm, churchId: e.target.value })}>
                  <option value="" disabled>Seleccione una iglesia...</option>
                  {churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Días</label>
                  <select className="form-input" multiple value={JSON.parse(activityForm.days)} onChange={e => setActivityForm({ ...activityForm, days: JSON.stringify(Array.from(e.target.selectedOptions, option => option.value)) })} style={{ height: "100px" }}>
                    <option value="MONDAY">Lunes</option>
                    <option value="TUESDAY">Martes</option>
                    <option value="WEDNESDAY">Miércoles</option>
                    <option value="THURSDAY">Jueves</option>
                    <option value="FRIDAY">Viernes</option>
                    <option value="SATURDAY">Sábado</option>
                    <option value="SUNDAY">Domingo</option>
                  </select>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div className="form-group">
                    <label className="form-label">Hora Inicio</label>
                    <input type="time" className="form-input" value={activityForm.startTime} onChange={e => setActivityForm({ ...activityForm, startTime: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hora Fin</label>
                    <input type="time" className="form-input" value={activityForm.endTime} onChange={e => setActivityForm({ ...activityForm, endTime: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea className="form-input" rows={3} value={activityForm.description} onChange={e => setActivityForm({ ...activityForm, description: e.target.value })} placeholder="Detalles de la actividad..." />
              </div>

              <div className="form-group">
                <label className="form-label">URL de Imagen (opcional)</label>
                <input type="url" className="form-input" value={activityForm.imageUrl} onChange={e => setActivityForm({ ...activityForm, imageUrl: e.target.value })} placeholder="https://ejemplo.com/imagen.jpg" />
              </div>

              <div className="form-group">
                <label className="form-label">URL de Video asociado (opcional)</label>
                <input type="url" className="form-input" value={activityForm.videoUrl} onChange={e => setActivityForm({ ...activityForm, videoUrl: e.target.value })} placeholder="https://youtube.com/..." />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input type="checkbox" id="isActive" checked={activityForm.isActive} onChange={e => setActivityForm({ ...activityForm, isActive: e.target.checked })} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
                <label htmlFor="isActive" style={{ color: "var(--text-secondary)", fontSize: "0.9rem", cursor: "pointer" }}>
                  Actividad activa (visible públicamente)
                </label>
              </div>

              <div style={{ display: "flex", gap: "10px", paddingTop: "8px", justifyContent: "flex-end" }}>
                <button type="button" className="btn-secondary" onClick={() => setIsActivityModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={isPending}>
                  {isPending ? "Guardando..." : "Guardar Actividad"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
