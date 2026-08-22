"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { updateChurchProfile, createEvent, updateEvent, deleteEvent } from "./actions";

const EVENT_TYPES = ["MISA", "RETIRO", "CONCIERTO", "CONFERENCIA", "BAUTISMO", "BODA", "OTRO"];
const CHURCH_TYPES = ["Católica", "Cristiana Evangélica", "Cristiana", "Islam", "Judaísmo", "Otro"];

const EVENT_EMOJI: Record<string, string> = {
  MISA: "🙏", RETIRO: "⛺", CONCIERTO: "🎵", CONFERENCIA: "🎤",
  BAUTISMO: "💧", BODA: "💍", OTRO: "📅"
};

type Church = {
  id: string;
  name: string;
  address: string;
  description: string | null;
  type: string | null;
  imageUrl: string | null;
  phone: string | null;
  website: string | null;
  events: any[];
};

const defaultEventForm = {
  title: "", description: "", eventDate: "", type: "MISA",
  imageUrl: "", isPublic: true
};

export default function DashboardClient({
  churches,
  userId,
  userEmail
}: { churches: Church[], userId: string, userEmail: string }) {
  const [selectedChurchId, setSelectedChurchId] = useState<string>(churches[0]?.id || "");
  const [activeSection, setActiveSection] = useState<"perfil" | "eventos">("perfil");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [eventForm, setEventForm] = useState(defaultEventForm);
  const [profileForm, setProfileForm] = useState<any>(null);

  const church = churches.find(c => c.id === selectedChurchId) || churches[0];

  const showMsg = (text: string, ok: boolean) => {
    setMessage({ text, ok });
    setTimeout(() => setMessage(null), 4000);
  };

  const initProfileForm = (c: Church) => {
    setProfileForm({
      name: c.name,
      description: c.description || "",
      type: c.type || "Católica",
      imageUrl: c.imageUrl || "",
      phone: c.phone || "",
      website: c.website || "",
    });
  };

  if (!profileForm && church) initProfileForm(church);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateChurchProfile(userId, church.id, profileForm);
      if (res.error) showMsg(res.error, false);
      else showMsg("✅ Perfil actualizado correctamente", true);
    });
  };

  const openEventModal = (event?: any) => {
    if (event) {
      setEditingEvent(event);
      setEventForm({
        title: event.title,
        description: event.description || "",
        eventDate: new Date(event.eventDate).toISOString().slice(0, 16),
        type: event.type,
        imageUrl: event.imageUrl || "",
        isPublic: event.isPublic,
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
      let res;
      if (editingEvent) {
        res = await updateEvent(userId, church.id, editingEvent.id, eventForm);
      } else {
        res = await createEvent(userId, church.id, eventForm);
      }
      if (res.error) showMsg(res.error, false);
      else {
        showMsg(editingEvent ? "✅ Evento actualizado" : "✅ Evento creado", true);
        setIsEventModalOpen(false);
      }
    });
  };

  const handleDeleteEvent = (eventId: string) => {
    if (!confirm("¿Eliminar este evento?")) return;
    startTransition(async () => {
      const res = await deleteEvent(userId, church.id, eventId);
      if (res.error) showMsg(res.error, false);
      else showMsg("✅ Evento eliminado", true);
    });
  };

  // ── Styles ──────────────────────────────────────────────────────────────
  const sidebarBtn = (active: boolean) => ({
    width: "100%", textAlign: "left" as const, padding: "10px 14px",
    borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: 600,
    fontSize: "0.9rem", transition: "all 0.2s",
    background: active ? "rgba(99,102,241,0.2)" : "transparent",
    color: active ? "#818cf8" : "rgba(255,255,255,0.7)",
    borderLeft: active ? "3px solid #6366f1" : "3px solid transparent",
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-gradient-start)", display: "flex", flexDirection: "column" }}>
      {/* Top Bar */}
      <header style={{
        padding: "14px 24px", background: "rgba(15,23,42,0.95)",
        borderBottom: "1px solid var(--glass-border)",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span className="text-gradient" style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "1.4rem" }}>Holyfind</span>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Panel del Gestor</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{userEmail}</span>
          <button onClick={() => signOut({ callbackUrl: "/" })} className="btn-secondary" style={{ padding: "6px 14px", fontSize: "0.85rem" }}>
            Salir
          </button>
        </div>
      </header>

      {churches.length === 0 ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "20px" }}>
          <div style={{ fontSize: "4rem" }}>⛪</div>
          <h2 style={{ color: "white", textAlign: "center" }}>Todavía no tenés iglesias asignadas</h2>
          <p style={{ color: "var(--text-secondary)", textAlign: "center", maxWidth: "400px" }}>
            Contactá al administrador de Holyfind para que te asigne la gestión de tu iglesia.
          </p>
        </div>
      ) : (
        <main style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Left Sidebar */}
          <aside style={{
            width: "250px", background: "rgba(15,23,42,0.8)",
            borderRight: "1px solid var(--glass-border)", padding: "20px 12px",
            display: "flex", flexDirection: "column", gap: "6px"
          }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 700, padding: "0 14px 8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Mis Iglesias
            </p>
            {churches.map(c => (
              <button
                key={c.id}
                onClick={() => { setSelectedChurchId(c.id); initProfileForm(c); }}
                style={sidebarBtn(selectedChurchId === c.id)}
              >
                ⛪ {c.name}
              </button>
            ))}

            <div style={{ height: "1px", background: "var(--border)", margin: "16px 0" }} />

            <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 700, padding: "0 14px 8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Secciones
            </p>
            <button onClick={() => setActiveSection("perfil")} style={sidebarBtn(activeSection === "perfil")}>
              🖊️ Perfil de Iglesia
            </button>
            <button onClick={() => setActiveSection("eventos")} style={sidebarBtn(activeSection === "eventos")}>
              📅 Eventos ({church?.events?.length || 0})
            </button>
          </aside>

          {/* Content */}
          <div style={{ flex: 1, padding: "30px", overflowY: "auto" }}>

            {/* Notification */}
            {message && (
              <div style={{
                padding: "12px 20px", borderRadius: "12px", marginBottom: "20px",
                background: message.ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                border: `1px solid ${message.ok ? "#10b981" : "#ef4444"}`,
                color: message.ok ? "#10b981" : "#ef4444", fontWeight: 600
              }}>
                {message.text}
              </div>
            )}

            {/* ── Perfil Section ── */}
            {activeSection === "perfil" && church && profileForm && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "30px" }}>
                  {profileForm.imageUrl ? (
                    <img src={profileForm.imageUrl} alt="Logo" style={{ width: "70px", height: "70px", borderRadius: "14px", objectFit: "cover", border: "2px solid var(--glass-border)" }} />
                  ) : (
                    <div style={{ width: "70px", height: "70px", borderRadius: "14px", background: "rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>⛪</div>
                  )}
                  <div>
                    <h1 style={{ color: "white", fontSize: "1.8rem", fontWeight: 800 }}>{church.name}</h1>
                    <p style={{ color: "var(--text-secondary)" }}>{church.address}</p>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: "30px" }}>
                  <h2 style={{ color: "white", fontSize: "1.3rem", marginBottom: "24px" }}>✏️ Editar Perfil Público</h2>
                  <form onSubmit={handleProfileSave} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    <div className="form-group">
                      <label className="form-label">Nombre de la Iglesia</label>
                      <input className="form-input" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tipo / Denominación</label>
                      <select className="form-input" value={profileForm.type} onChange={e => setProfileForm({ ...profileForm, type: e.target.value })}>
                        {CHURCH_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Descripción (visible en el mapa)</label>
                      <textarea className="form-input" rows={4} value={profileForm.description} onChange={e => setProfileForm({ ...profileForm, description: e.target.value })} placeholder="Contanos sobre tu comunidad, horarios de misas, actividades..." />
                    </div>
                    <div className="form-group">
                      <label className="form-label">URL del Logo / Imagen principal</label>
                      <input className="form-input" type="url" value={profileForm.imageUrl} onChange={e => setProfileForm({ ...profileForm, imageUrl: e.target.value })} placeholder="https://ejemplo.com/imagen.jpg" />
                      {profileForm.imageUrl && (
                        <div style={{ marginTop: "10px" }}>
                          <img src={profileForm.imageUrl} alt="Preview" style={{ height: "80px", borderRadius: "10px", objectFit: "cover" }} onError={e => { (e.target as any).style.display = "none"; }} />
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Teléfono de Contacto</label>
                        <input className="form-input" type="tel" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="+54 9 11 1234-5678" />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Sitio Web</label>
                        <input className="form-input" type="url" value={profileForm.website} onChange={e => setProfileForm({ ...profileForm, website: e.target.value })} placeholder="https://mi-iglesia.com" />
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "10px" }}>
                      <button type="submit" className="btn-primary" disabled={isPending} style={{ padding: "12px 28px" }}>
                        {isPending ? "Guardando..." : "💾 Guardar Cambios"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ── Eventos Section ── */}
            {activeSection === "eventos" && church && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                  <h1 style={{ color: "white", fontSize: "1.8rem", fontWeight: 800 }}>📅 Eventos de {church.name}</h1>
                  <button className="btn-primary" onClick={() => openEventModal()} style={{ padding: "10px 20px" }}>
                    + Nuevo Evento
                  </button>
                </div>

                {church.events.length === 0 ? (
                  <div className="glass-panel" style={{ padding: "40px", textAlign: "center" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📅</div>
                    <h3 style={{ color: "white", marginBottom: "10px" }}>Todavía no hay eventos</h3>
                    <p style={{ color: "var(--text-secondary)" }}>Creá el primer evento para que aparezca en el mapa público.</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
                    {church.events.map((event: any) => (
                      <div key={event.id} className="glass-panel" style={{ padding: "20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                              <span style={{ fontSize: "1.5rem" }}>{EVENT_EMOJI[event.type] || "📅"}</span>
                              <span style={{ padding: "2px 8px", borderRadius: "99px", fontSize: "0.7rem", fontWeight: 700, background: "rgba(99,102,241,0.2)", color: "#818cf8" }}>
                                {event.type}
                              </span>
                              {!event.isPublic && <span style={{ padding: "2px 8px", borderRadius: "99px", fontSize: "0.7rem", fontWeight: 700, background: "rgba(239,68,68,0.2)", color: "#f87171" }}>Privado</span>}
                            </div>
                            <h3 style={{ color: "white", fontSize: "1rem", fontWeight: 700, marginBottom: "6px" }}>{event.title}</h3>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "6px" }}>
                              🗓️ {new Date(event.eventDate).toLocaleString("es-AR", { dateStyle: "long", timeStyle: "short" })}
                            </p>
                            {event.description && (
                              <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.description}</p>
                            )}
                          </div>
                          {event.imageUrl && (
                            <img src={event.imageUrl} alt={event.title} style={{ width: "60px", height: "60px", borderRadius: "10px", objectFit: "cover", marginLeft: "12px", flexShrink: 0 }} />
                          )}
                        </div>
                        <div style={{ display: "flex", gap: "8px", marginTop: "14px", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                          <button className="btn-secondary" onClick={() => openEventModal(event)} style={{ flex: 1, padding: "6px", fontSize: "0.8rem" }}>✏️ Editar</button>
                          <button onClick={() => handleDeleteEvent(event.id)} disabled={isPending} style={{ flex: 1, padding: "6px", fontSize: "0.8rem", background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>🗑️ Eliminar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      )}

      {/* ── Event Modal ── */}
      {isEventModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
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
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{EVENT_EMOJI[t]} {t}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Fecha y Hora</label>
                  <input required type="datetime-local" className="form-input" value={eventForm.eventDate} onChange={e => setEventForm({ ...eventForm, eventDate: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea className="form-input" rows={3} value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} placeholder="Detalles del evento..." />
              </div>

              <div className="form-group">
                <label className="form-label">URL de Imagen del Evento (opcional)</label>
                <input type="url" className="form-input" value={eventForm.imageUrl} onChange={e => setEventForm({ ...eventForm, imageUrl: e.target.value })} placeholder="https://ejemplo.com/imagen.jpg" />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input type="checkbox" id="isPublic" checked={eventForm.isPublic} onChange={e => setEventForm({ ...eventForm, isPublic: e.target.checked })} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
                <label htmlFor="isPublic" style={{ color: "var(--text-secondary)", fontSize: "0.9rem", cursor: "pointer" }}>
                  Evento público (visible en el mapa)
                </label>
              </div>

              <div style={{ display: "flex", gap: "10px", paddingTop: "8px" }}>
                <button type="button" className="btn-secondary" onClick={() => setIsEventModalOpen(false)} style={{ flex: 1, padding: "12px" }}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={isPending} style={{ flex: 2, padding: "12px" }}>
                  {isPending ? "Guardando..." : (editingEvent ? "💾 Actualizar" : "✅ Crear Evento")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
