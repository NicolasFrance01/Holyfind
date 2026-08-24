"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import ImageUploader from "@/components/ImageUploader";
import {
  updateChurchProfile, createEvent, updateEvent, deleteEvent,
  createActivity, updateActivity, deleteActivity,
  toggleCommentVisibility, addAuthorizedUser, removeAuthorizedUser
} from "./actions";

const EVENT_TYPES = ["MISA", "RETIRO", "CONCIERTO", "CONFERENCIA", "BAUTISMO", "BODA", "CONGRESO", "OTRO"];
const CHURCH_TYPES = ["Católica", "Cristiana Evangélica", "Cristiana", "Islam", "Judaísmo", "Otro"];
const DAYS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const DAY_KEYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const EVENT_EMOJI: Record<string, string> = {
  MISA: "🙏", RETIRO: "⛺", CONCIERTO: "🎵", CONFERENCIA: "🎤",
  BAUTISMO: "💧", BODA: "💍", CONGRESO: "🤝", OTRO: "📅"
};

const defaultEventForm = { title: "", description: "", eventDate: "", type: "MISA", imageUrl: "", videoUrl: "", notes: "", isPublic: true, mediaUrls: [] as string[], isJointEvent: false, jointChurches: [] as any[] };
const defaultActivityForm = { title: "", description: "", days: [] as string[], startTime: "", endTime: "", imageUrl: "", videoUrl: "", notes: "", isActive: true, mediaUrls: [] as string[] };

type Section = "perfil" | "eventos" | "actividades" | "comentarios" | "visibilidad" | "autorizados";

export default function ChurchDashboardClient({ churches, userId, userEmail }: { churches: any[], userId: string, userEmail: string }) {
  const [selectedChurchId, setSelectedChurchId] = useState<string>(churches[0]?.id || "");
  const [activeSection, setActiveSection] = useState<Section>("perfil");
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Profile
  const [profileForm, setProfileForm] = useState<any>(null);

  // Events
  const [isEventOpen, setIsEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [eventForm, setEventForm] = useState({ ...defaultEventForm });

  // Activities
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [activityForm, setActivityForm] = useState({ ...defaultActivityForm });

  // Delete Modals
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null);

  // Authorized
  const [authEmail, setAuthEmail] = useState("");
  const [authPerms, setAuthPerms] = useState({ canProfile: false, canEvents: false, canActivities: false, canComments: false });

  const church = churches.find(c => c.id === selectedChurchId) || churches[0];

  const showMsg = (text: string, ok: boolean) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 4000); };

  const initProfile = (c: any) => setProfileForm({ name: c.name, description: c.description || "", type: c.type || "Católica", imageUrl: c.imageUrl || "", phone: c.phone || "", website: c.website || "", instagram: c.instagram || "", youtube: c.youtube || "", facebook: c.facebook || "", whatsapp: c.whatsapp || "" });
  if (!profileForm && church) initProfile(church);

  const sBtn = (active: boolean) => ({
    width: "100%", textAlign: "left" as const, padding: "10px 14px", borderRadius: "10px",
    border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", transition: "all 0.2s",
    background: active ? "rgba(99,102,241,0.2)" : "transparent",
    color: active ? "#818cf8" : "rgba(255,255,255,0.65)",
    borderLeft: active ? "3px solid #6366f1" : "3px solid transparent",
    marginBottom: "2px",
  });

  const openEvent = (ev?: any) => {
    setEditingEvent(ev || null);
    setEventForm(ev ? {
      title: ev.title, description: ev.description || "", eventDate: new Date(ev.eventDate).toISOString().slice(0, 16),
      type: ev.type, imageUrl: ev.imageUrl || "", videoUrl: ev.videoUrl || "", notes: ev.notes || "", isPublic: ev.isPublic,
      mediaUrls: ev.media?.map((m: any) => m.url) || [],
      isJointEvent: (ev.jointChurches && Array.isArray(ev.jointChurches) && ev.jointChurches.length > 0) ? true : false,
      jointChurches: (ev.jointChurches && Array.isArray(ev.jointChurches)) ? ev.jointChurches : [],
    } : { ...defaultEventForm });
    setIsEventOpen(true);
  };

  const openActivity = (act?: any) => {
    setEditingActivity(act || null);
    setActivityForm(act ? { title: act.title, description: act.description || "", days: JSON.parse(act.days || "[]"), startTime: act.startTime || "", endTime: act.endTime || "", imageUrl: act.imageUrl || "", videoUrl: act.videoUrl || "", notes: act.notes || "", isActive: act.isActive, mediaUrls: act.media?.map((m: any) => m.url) || [] } : { ...defaultActivityForm });
    setIsActivityOpen(true);
  };

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const r = await updateChurchProfile(userId, church.id, profileForm);
      r.error ? showMsg(r.error, false) : showMsg("✅ Perfil actualizado", true);
    });
  };

  const saveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const r = editingEvent ? await updateEvent(userId, church.id, editingEvent.id, eventForm) : await createEvent(userId, church.id, eventForm);
      if (r.error) showMsg(r.error, false);
      else { showMsg(editingEvent ? "✅ Evento actualizado" : "✅ Evento creado", true); setIsEventOpen(false); }
    });
  };

  const saveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const r = editingActivity ? await updateActivity(userId, church.id, editingActivity.id, activityForm) : await createActivity(userId, church.id, activityForm);
      if (r.error) showMsg(r.error, false);
      else { showMsg(editingActivity ? "✅ Actividad actualizada" : "✅ Actividad creada", true); setIsActivityOpen(false); }
    });
  };

  const confirmDelEvent = () => { if (!eventToDelete) return; startTransition(async () => { const r = await deleteEvent(userId, church.id, eventToDelete); r.error ? showMsg(r.error, false) : showMsg("✅ Evento eliminado", true); setEventToDelete(null); }); };
  const confirmDelActivity = () => { if (!activityToDelete) return; startTransition(async () => { const r = await deleteActivity(userId, church.id, activityToDelete); r.error ? showMsg(r.error, false) : showMsg("✅ Actividad eliminada", true); setActivityToDelete(null); }); };

  const toggleDay = (key: string) => setActivityForm(f => ({ ...f, days: f.days.includes(key) ? f.days.filter((d: string) => d !== key) : [...f.days, key] }));

  const addMedia = (url: string, form: any, setForm: any) => setForm((f: any) => ({ ...f, mediaUrls: [...(f.mediaUrls || []), url] }));
  const removeMedia = (idx: number, form: any, setForm: any) => setForm((f: any) => ({ ...f, mediaUrls: f.mediaUrls.filter((_: any, i: number) => i !== idx) }));

  // Stats helpers
  const followers = church?.followers?.length || 0;
  const mapClicks = church?.stats?.filter((s: any) => s.type === "map_click").length || 0;
  const profileViews = church?.stats?.filter((s: any) => s.type === "profile_view").length || 0;
  const totalLikes = (church?.events || []).reduce((a: number, e: any) => a + (e.likes?.length || 0), 0) + (church?.activities || []).reduce((a: number, e: any) => a + (e.likes?.length || 0), 0);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-gradient-start)", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <header style={{ padding: "14px 24px", background: "rgba(10, 15, 30, 0.5)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10, position: "sticky", top: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span className="text-gradient" style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "1.4rem" }}>Holyfind</span>
          </Link>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem", padding: "3px 10px", background: "rgba(99,102,241,0.15)", borderRadius: "20px", border: "1px solid rgba(99,102,241,0.3)" }}>Panel de Iglesia</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link href="/maps" className="btn-secondary" style={{ padding: "6px 14px", fontSize: "0.85rem", textDecoration: "none" }}>🗺️ Ver Mapa</Link>
          <Link href="/dashboard" className="btn-secondary" style={{ padding: "6px 14px", fontSize: "0.85rem", textDecoration: "none" }}>👤 Mi Perfil</Link>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginLeft: "10px" }}>{userEmail}</span>
          <button onClick={() => signOut({ callbackUrl: "/" })} className="btn-secondary" style={{ padding: "6px 14px", fontSize: "0.85rem" }}>Salir</button>
        </div>
      </header>

      {churches.length === 0 ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: "4rem" }}>⛪</div>
          <h2 style={{ color: "white" }}>Sin iglesias asignadas</h2>
          <p style={{ color: "var(--text-secondary)", maxWidth: "380px", textAlign: "center" }}>Contactá al administrador de Holyfind para que te asigne la gestión de tu iglesia.</p>
        </div>
      ) : (
        <main style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* Sidebar */}
          <aside style={{ width: "220px", background: "rgba(10,15,30,0.9)", borderRight: "1px solid var(--glass-border)", padding: "20px 10px", display: "flex", flexDirection: "column", gap: "4px", overflowY: "auto" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.7rem", fontWeight: 700, padding: "0 12px 8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Mis Iglesias</p>
            {churches.map((c: any) => (
              <button key={c.id} onClick={() => { setSelectedChurchId(c.id); initProfile(c); }} style={sBtn(selectedChurchId === c.id)}>
                {c.imageUrl ? <img src={c.imageUrl} alt="" style={{ width: "18px", height: "18px", borderRadius: "4px", objectFit: "cover", display: "inline-block", marginRight: "8px" }} /> : "⛪ "}
                {c.name}
              </button>
            ))}

            <div style={{ height: "1px", background: "var(--border)", margin: "12px 0" }} />
            <p style={{ color: "var(--text-secondary)", fontSize: "0.7rem", fontWeight: 700, padding: "0 12px 8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Gestión</p>

            {([
              ["perfil", "🖊️", "Perfil"],
              ["eventos", "📅", `Eventos (${church?.events?.length || 0})`],
              ["actividades", "🏃", `Actividades (${church?.activities?.length || 0})`],
              ["visibilidad", "📊", "Visibilidad"],
              ["comentarios", "💬", `Comentarios (${church?.comments?.length || 0})`],
              ["autorizados", "👥", "Autorizados"],
            ] as [Section, string, string][]).map(([key, icon, label]) => (
              <button key={key} onClick={() => setActiveSection(key)} style={sBtn(activeSection === key)}>
                {icon} {label}
              </button>
            ))}
          </aside>

          {/* Content */}
          <div style={{ flex: 1, padding: "28px", overflowY: "auto" }}>
            {msg && (
              <div style={{ padding: "12px 16px", borderRadius: "10px", marginBottom: "20px", background: msg.ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", border: `1px solid ${msg.ok ? "#10b981" : "#ef4444"}`, color: msg.ok ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                {msg.text}
              </div>
            )}

            {/* ── PERFIL ── */}
            {activeSection === "perfil" && church && profileForm && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "28px" }}>
                  <ImageUploader
                    currentUrl={profileForm.imageUrl}
                    onUploaded={url => setProfileForm((f: any) => ({ ...f, imageUrl: url }))}
                    folder="church-logos"
                    placeholder="Logo"
                    size="large"
                    shape="square"
                  />
                  <div>
                    <h1 style={{ color: "white", fontSize: "1.8rem", fontWeight: 800, margin: "0 0 4px" }}>{church.name}</h1>
                    <p style={{ color: "var(--text-secondary)", margin: 0 }}>{church.address}</p>
                    {profileForm.imageUrl && <p style={{ color: "#10b981", fontSize: "0.8rem", marginTop: "4px" }}>✅ Logo cargado</p>}
                  </div>
                </div>
                <div className="glass-panel" style={{ padding: "28px" }}>
                  <h2 style={{ color: "white", fontSize: "1.2rem", marginBottom: "22px" }}>✏️ Perfil Público</h2>
                  <form onSubmit={saveProfile} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div className="form-group"><label className="form-label">Nombre</label><input required className="form-input" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} /></div>
                    <div className="form-group"><label className="form-label">Tipo / Denominación</label><select className="form-input" value={profileForm.type} onChange={e => setProfileForm({ ...profileForm, type: e.target.value })}>{CHURCH_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
                    <div className="form-group"><label className="form-label">Descripción</label><textarea className="form-input" rows={4} value={profileForm.description} onChange={e => setProfileForm({ ...profileForm, description: e.target.value })} placeholder="Contá sobre tu comunidad..." /></div>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <div className="form-group" style={{ flex: 1 }}><label className="form-label">Teléfono</label><input className="form-input" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} /></div>
                      <div className="form-group" style={{ flex: 1 }}><label className="form-label">Sitio Web</label><input className="form-input" type="url" placeholder="https://" value={profileForm.website} onChange={e => setProfileForm({ ...profileForm, website: e.target.value })} /></div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div className="form-group"><label className="form-label">📸 Instagram</label><input className="form-input" placeholder="https://instagram.com/tuiglesia" value={profileForm.instagram} onChange={e => setProfileForm({ ...profileForm, instagram: e.target.value })} /></div>
                      <div className="form-group"><label className="form-label">▶️ YouTube</label><input className="form-input" placeholder="https://youtube.com/@tuiglesia" value={profileForm.youtube} onChange={e => setProfileForm({ ...profileForm, youtube: e.target.value })} /></div>
                      <div className="form-group"><label className="form-label">📘 Facebook</label><input className="form-input" placeholder="https://facebook.com/tuiglesia" value={profileForm.facebook} onChange={e => setProfileForm({ ...profileForm, facebook: e.target.value })} /></div>
                      <div className="form-group"><label className="form-label">💬 WhatsApp</label><input className="form-input" placeholder="+549..." value={profileForm.whatsapp} onChange={e => setProfileForm({ ...profileForm, whatsapp: e.target.value })} /></div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button type="submit" className="btn-primary" disabled={isPending} style={{ padding: "12px 28px" }}>{isPending ? "Guardando..." : "💾 Guardar"}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ── EVENTOS ── */}
            {activeSection === "eventos" && church && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
                  <h1 style={{ color: "white", fontSize: "1.6rem", fontWeight: 800 }}>📅 Eventos</h1>
                  <button className="btn-primary" onClick={() => openEvent()} style={{ padding: "10px 20px" }}>+ Nuevo Evento</button>
                </div>
                {church.events?.length === 0 ? (
                  <div className="glass-panel" style={{ padding: "40px", textAlign: "center" }}><div style={{ fontSize: "3rem" }}>📅</div><h3 style={{ color: "white" }}>Sin eventos todavía</h3></div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "14px" }}>
                    {church.events?.map((ev: any) => {
                      const isPast = new Date(ev.eventDate) < new Date();
                      return (
                        <div key={ev.id} className="glass-panel" style={{ padding: "18px", opacity: isPast ? 0.6 : 1 }}>
                          {ev.imageUrl && <img src={ev.imageUrl} alt={ev.title} style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "10px", marginBottom: "12px" }} />}
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                            <span style={{ fontSize: "1.2rem" }}>{EVENT_EMOJI[ev.type] || "📅"}</span>
                            <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: "99px", background: "rgba(99,102,241,0.2)", color: "#818cf8" }}>{ev.type}</span>
                            {isPast && <span style={{ fontSize: "0.65rem", padding: "2px 6px", borderRadius: "4px", background: "rgba(100,100,100,0.2)", color: "#94a3b8" }}>Pasado</span>}
                            {!ev.isPublic && <span style={{ fontSize: "0.65rem", padding: "2px 6px", borderRadius: "4px", background: "rgba(239,68,68,0.2)", color: "#f87171" }}>Privado</span>}
                          </div>
                          <h3 style={{ color: "white", fontSize: "0.95rem", fontWeight: 700, margin: "0 0 4px" }}>{ev.title}</h3>
                          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", margin: "0 0 10px" }}>🗓️ {new Date(ev.eventDate).toLocaleString("es-AR", { dateStyle: "long", timeStyle: "short" })}</p>
                          <div style={{ display: "flex", gap: "6px", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "10px" }}>
                            <span>❤️ {ev.likes?.length || 0}</span>
                            <span>🔖 {ev.saves?.length || 0}</span>
                            {ev.videoUrl && <span>🎥 Video</span>}
                            {ev.media?.length > 0 && <span>📸 {ev.media.length} fotos</span>}
                          </div>
                          <div style={{ display: "flex", gap: "6px", borderTop: "1px solid var(--border)", paddingTop: "10px" }}>
                            <button className="btn-secondary" onClick={() => openEvent(ev)} style={{ flex: 1, padding: "6px", fontSize: "0.8rem" }}>✏️ Editar</button>
                            <button onClick={() => setEventToDelete(ev.id)} style={{ flex: 1, padding: "6px", fontSize: "0.8rem", background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>🗑️ Eliminar</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── ACTIVIDADES ── */}
            {activeSection === "actividades" && church && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
                  <h1 style={{ color: "white", fontSize: "1.6rem", fontWeight: 800 }}>🏃 Actividades</h1>
                  <button className="btn-primary" onClick={() => openActivity()} style={{ padding: "10px 20px" }}>+ Nueva Actividad</button>
                </div>
                {church.activities?.length === 0 ? (
                  <div className="glass-panel" style={{ padding: "40px", textAlign: "center" }}><div style={{ fontSize: "3rem" }}>🏃</div><h3 style={{ color: "white" }}>Sin actividades todavía</h3></div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "14px" }}>
                    {church.activities?.map((act: any) => {
                      const days: string[] = JSON.parse(act.days || "[]");
                      return (
                        <div key={act.id} className="glass-panel" style={{ padding: "18px", opacity: act.isActive ? 1 : 0.5 }}>
                          {act.imageUrl && <img src={act.imageUrl} alt={act.title} style={{ width: "100%", height: "100px", objectFit: "cover", borderRadius: "10px", marginBottom: "12px" }} />}
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                            <h3 style={{ color: "white", fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>{act.title}</h3>
                            {!act.isActive && <span style={{ fontSize: "0.65rem", padding: "2px 6px", background: "rgba(239,68,68,0.2)", color: "#f87171", borderRadius: "4px" }}>Inactiva</span>}
                          </div>
                          {days.length > 0 && <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", margin: "0 0 4px" }}>📅 {days.map(d => DAYS[DAY_KEYS.indexOf(d)]).join(", ")}</p>}
                          {(act.startTime || act.endTime) && <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", margin: "0 0 8px" }}>🕐 {act.startTime} - {act.endTime}</p>}
                          <div style={{ display: "flex", gap: "6px", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "10px" }}>
                            <span>❤️ {act.likes?.length || 0}</span>
                            <span>🔖 {act.saves?.length || 0}</span>
                          </div>
                          <div style={{ display: "flex", gap: "6px", borderTop: "1px solid var(--border)", paddingTop: "10px" }}>
                            <button className="btn-secondary" onClick={() => openActivity(act)} style={{ flex: 1, padding: "6px", fontSize: "0.8rem" }}>✏️ Editar</button>
                            <button onClick={() => setActivityToDelete(act.id)} style={{ flex: 1, padding: "6px", fontSize: "0.8rem", background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>🗑️ Eliminar</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── VISIBILIDAD ── */}
            {activeSection === "visibilidad" && church && (
              <div>
                <h1 style={{ color: "white", fontSize: "1.6rem", fontWeight: 800, marginBottom: "24px" }}>📊 Visibilidad</h1>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: "14px", marginBottom: "28px" }}>
                  {[
                    { icon: "🗺️", label: "Clicks en el Mapa", value: mapClicks },
                    { icon: "👁️", label: "Vistas de Perfil", value: profileViews },
                    { icon: "🔔", label: "Seguidores", value: followers },
                    { icon: "❤️", label: "Total Destacados", value: totalLikes },
                    { icon: "📅", label: "Eventos", value: church.events?.length || 0 },
                    { icon: "🏃", label: "Actividades", value: church.activities?.length || 0 },
                    { icon: "💬", label: "Comentarios", value: church.comments?.length || 0 },
                  ].map(stat => (
                    <div key={stat.label} className="glass-panel" style={{ padding: "20px", textAlign: "center" }}>
                      <div style={{ fontSize: "2rem", marginBottom: "8px" }}>{stat.icon}</div>
                      <div style={{ color: "white", fontSize: "2rem", fontWeight: 800, lineHeight: 1 }}>{stat.value}</div>
                      <div style={{ color: "var(--text-secondary)", fontSize: "0.78rem", marginTop: "6px" }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div className="glass-panel" style={{ padding: "20px" }}>
                  <h2 style={{ color: "white", fontSize: "1rem", marginBottom: "14px" }}>❤️ Destacados por Evento</h2>
                  {church.events?.length === 0 ? <p style={{ color: "var(--text-secondary)" }}>Sin eventos</p> : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {church.events?.sort((a: any, b: any) => (b.likes?.length || 0) - (a.likes?.length || 0)).map((ev: any) => (
                        <div key={ev.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                          <span style={{ color: "white", fontSize: "0.9rem" }}>{EVENT_EMOJI[ev.type]} {ev.title}</span>
                          <span style={{ color: "#f87171", fontWeight: 700 }}>❤️ {ev.likes?.length || 0}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── COMENTARIOS ── */}
            {activeSection === "comentarios" && church && (
              <div>
                <h1 style={{ color: "white", fontSize: "1.6rem", fontWeight: 800, marginBottom: "22px" }}>💬 Comentarios</h1>
                {church.comments?.length === 0 ? (
                  <div className="glass-panel" style={{ padding: "40px", textAlign: "center" }}><div style={{ fontSize: "3rem" }}>💬</div><h3 style={{ color: "white" }}>Sin comentarios todavía</h3></div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {church.comments?.map((c: any) => (
                      <div key={c.id} className="glass-panel" style={{ padding: "18px", opacity: c.isVisible ? 1 : 0.45 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            {c.user?.profileImage ? <img src={c.user.profileImage} alt="" style={{ width: "36px", height: "36px", borderRadius: "50%" }} /> : <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>👤</div>}
                            <div>
                              <div style={{ color: "white", fontWeight: 700, fontSize: "0.9rem" }}>{c.user?.name || "Usuario"}</div>
                              <div style={{ color: "#f59e0b" }}>{"⭐".repeat(c.rating)}</div>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>{new Date(c.createdAt).toLocaleDateString("es-AR")}</span>
                            <button onClick={() => startTransition(async () => { const r = await toggleCommentVisibility(userId, church.id, c.id); if (r.error) showMsg(r.error, false); })} style={{ padding: "4px 10px", fontSize: "0.75rem", background: c.isVisible ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", color: c.isVisible ? "#f87171" : "#10b981", border: `1px solid ${c.isVisible ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`, borderRadius: "6px", cursor: "pointer" }}>
                              {c.isVisible ? "Ocultar" : "Mostrar"}
                            </button>
                          </div>
                        </div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "10px" }}>{c.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── AUTORIZADOS ── */}
            {activeSection === "autorizados" && church && (
              <div>
                <h1 style={{ color: "white", fontSize: "1.6rem", fontWeight: 800, marginBottom: "22px" }}>👥 Usuarios Autorizados</h1>
                <div className="glass-panel" style={{ padding: "24px", marginBottom: "20px" }}>
                  <h2 style={{ color: "white", fontSize: "1.1rem", marginBottom: "16px" }}>Agregar Usuario</h2>
                  <form onSubmit={(e) => { e.preventDefault(); startTransition(async () => { const r = await addAuthorizedUser(userId, church.id, authEmail, authPerms); if (r.error) showMsg(r.error, false); else { showMsg("✅ Usuario autorizado", true); setAuthEmail(""); } }); }} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div className="form-group"><label className="form-label">Email del usuario</label><input required type="email" className="form-input" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="pastor@iglesia.com" /></div>
                    <div>
                      <label className="form-label" style={{ marginBottom: "10px" }}>Permisos</label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        {(["canProfile", "canEvents", "canActivities", "canComments"] as const).map(perm => (
                          <label key={perm} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                            <input type="checkbox" checked={authPerms[perm]} onChange={e => setAuthPerms(p => ({ ...p, [perm]: e.target.checked }))} />
                            {perm === "canProfile" ? "Perfil" : perm === "canEvents" ? "Eventos" : perm === "canActivities" ? "Actividades" : "Comentarios"}
                          </label>
                        ))}
                      </div>
                    </div>
                    <button type="submit" className="btn-primary" disabled={isPending} style={{ padding: "10px 20px", alignSelf: "flex-end" }}>{isPending ? "Agregando..." : "✅ Agregar"}</button>
                  </form>
                </div>
                {(church.authorized || []).length === 0 ? (
                  <p style={{ color: "var(--text-secondary)" }}>No hay usuarios autorizados todavía.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {(church.authorized || []).map((auth: any) => (
                      <div key={auth.id} className="glass-panel" style={{ padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <span style={{ color: "white", fontWeight: 600 }}>{auth.user?.email}</span>
                          <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                            {auth.canProfile && <span style={{ fontSize: "0.7rem", padding: "2px 6px", background: "rgba(99,102,241,0.2)", color: "#818cf8", borderRadius: "4px" }}>Perfil</span>}
                            {auth.canEvents && <span style={{ fontSize: "0.7rem", padding: "2px 6px", background: "rgba(99,102,241,0.2)", color: "#818cf8", borderRadius: "4px" }}>Eventos</span>}
                            {auth.canActivities && <span style={{ fontSize: "0.7rem", padding: "2px 6px", background: "rgba(99,102,241,0.2)", color: "#818cf8", borderRadius: "4px" }}>Actividades</span>}
                            {auth.canComments && <span style={{ fontSize: "0.7rem", padding: "2px 6px", background: "rgba(99,102,241,0.2)", color: "#818cf8", borderRadius: "4px" }}>Comentarios</span>}
                          </div>
                        </div>
                        <button onClick={() => startTransition(async () => { await removeAuthorizedUser(userId, church.id, auth.userId); showMsg("✅ Acceso removido", true); })} style={{ padding: "4px 12px", fontSize: "0.8rem", background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", cursor: "pointer" }}>Quitar</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      )}

      {/* ── EVENT MODAL ── */}
      {isEventOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "560px", padding: "28px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
              <h2 style={{ color: "white", fontSize: "1.3rem", fontWeight: 800 }}>{editingEvent ? "✏️ Editar Evento" : "📅 Nuevo Evento"}</h2>
              <button onClick={() => setIsEventOpen(false)} style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "1.5rem", cursor: "pointer" }}>×</button>
            </div>
            <form onSubmit={saveEvent} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="form-group"><label className="form-label">Nombre del Evento *</label><input required className="form-input" value={eventForm.title} onChange={e => setEventForm({ ...eventForm, title: e.target.value })} /></div>
              <div style={{ display: "flex", gap: "10px" }}>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Tipo</label><select className="form-input" value={eventForm.type} onChange={e => setEventForm({ ...eventForm, type: e.target.value })}>{EVENT_TYPES.map(t => <option key={t} value={t}>{EVENT_EMOJI[t]} {t}</option>)}</select></div>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Fecha y Hora *</label><input required type="datetime-local" className="form-input" value={eventForm.eventDate} onChange={e => setEventForm({ ...eventForm, eventDate: e.target.value })} /></div>
              </div>
              <div className="form-group"><label className="form-label">Descripción</label><textarea className="form-input" rows={3} value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} /></div>
              <div>
                <label className="form-label" style={{ marginBottom: "8px" }}>Imagen de Portada</label>
                <ImageUploader currentUrl={eventForm.imageUrl} onUploaded={url => setEventForm(f => ({ ...f, imageUrl: url }))} folder="event-covers" placeholder="Portada del evento" size="medium" disableCrop={true} />
              </div>
              
              {eventForm.type === "CONGRESO" && (
                <div style={{ background: "rgba(99,102,241,0.05)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(99,102,241,0.2)" }}>
                  <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", margin: 0 }}>
                    <input type="checkbox" checked={eventForm.isJointEvent} onChange={e => setEventForm({ ...eventForm, isJointEvent: e.target.checked })} />
                    Es un evento conjunto con otras iglesias
                  </label>
                  {eventForm.isJointEvent && (
                    <div style={{ marginTop: "12px" }}>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "8px" }}>Agregá las iglesias. Si no están en el sistema, recomendales que contacten a soporte Holyfind para unirse.</p>
                      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                        <input type="text" id="jointChurchInput" placeholder="Nombre de la iglesia..." className="form-input" style={{ flex: 1 }} onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = (e.target as HTMLInputElement).value.trim();
                            if (val) {
                              setEventForm(f => ({ ...f, jointChurches: [...f.jointChurches, { name: val }] }));
                              (e.target as HTMLInputElement).value = "";
                            }
                          }
                        }} />
                        <button type="button" className="btn-secondary" style={{ padding: "0 12px" }} onClick={() => {
                          const input = document.getElementById("jointChurchInput") as HTMLInputElement;
                          const val = input?.value.trim();
                          if (val) {
                            setEventForm(f => ({ ...f, jointChurches: [...f.jointChurches, { name: val }] }));
                            input.value = "";
                          }
                        }}>Agregar</button>
                      </div>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {eventForm.jointChurches.map((jc: any, i: number) => (
                          <span key={i} style={{ background: "rgba(255,255,255,0.1)", padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "6px" }}>
                            {jc.name} <button type="button" onClick={() => setEventForm(f => ({ ...f, jointChurches: f.jointChurches.filter((_, idx) => idx !== i) }))} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="form-group"><label className="form-label">🎥 Link de Video (YouTube/Instagram)</label><input className="form-input" type="url" placeholder="https://youtube.com/..." value={eventForm.videoUrl} onChange={e => setEventForm({ ...eventForm, videoUrl: e.target.value })} /></div>
              <div>
                <label className="form-label" style={{ marginBottom: "8px" }}>📸 Carrusel de Fotos (Podés elegir múltiples fotos a la vez)</label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                  {eventForm.mediaUrls.map((url: string, i: number) => (
                    <div key={i} style={{ position: "relative" }}>
                      <img src={url} alt="" style={{ width: "70px", height: "70px", objectFit: "contain", borderRadius: "8px", background: "rgba(0,0,0,0.3)" }} />
                      <button onClick={() => removeMedia(i, eventForm, setEventForm)} type="button" style={{ position: "absolute", top: "-4px", right: "-4px", background: "#ef4444", color: "white", borderRadius: "50%", width: "20px", height: "20px", border: "none", cursor: "pointer", fontSize: "10px" }}>×</button>
                    </div>
                  ))}
                  {eventForm.mediaUrls.length < 50 && (
                    <ImageUploader onUploaded={url => addMedia(url, eventForm, setEventForm)} folder="event-gallery" placeholder="Agregar foto" size="small" disableCrop={true} multiple={true} />
                  )}
                </div>
              </div>
              <div className="form-group"><label className="form-label">📢 Notas / Notificación</label><textarea className="form-input" rows={2} value={eventForm.notes} placeholder="Nota que verán los seguidores..." onChange={e => setEventForm({ ...eventForm, notes: e.target.value })} /></div>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "var(--text-secondary)" }}>
                <input type="checkbox" checked={eventForm.isPublic} onChange={e => setEventForm({ ...eventForm, isPublic: e.target.checked })} />
                Evento público (visible en el mapa)
              </label>
              <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                <button type="button" className="btn-secondary" onClick={() => setIsEventOpen(false)} style={{ flex: 1, padding: "12px" }}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={isPending} style={{ flex: 2, padding: "12px" }}>{isPending ? "Guardando..." : (editingEvent ? "💾 Actualizar" : "✅ Crear")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ACTIVITY MODAL ── */}
      {isActivityOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "560px", padding: "28px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
              <h2 style={{ color: "white", fontSize: "1.3rem", fontWeight: 800 }}>{editingActivity ? "✏️ Editar Actividad" : "🏃 Nueva Actividad"}</h2>
              <button onClick={() => setIsActivityOpen(false)} style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "1.5rem", cursor: "pointer" }}>×</button>
            </div>
            <form onSubmit={saveActivity} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="form-group"><label className="form-label">Nombre de la Actividad *</label><input required className="form-input" value={activityForm.title} onChange={e => setActivityForm({ ...activityForm, title: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Descripción</label><textarea className="form-input" rows={3} value={activityForm.description} onChange={e => setActivityForm({ ...activityForm, description: e.target.value })} /></div>
              <div>
                <label className="form-label" style={{ marginBottom: "8px" }}>Días de la semana</label>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {DAYS.map((d, i) => (
                    <button key={d} type="button" onClick={() => toggleDay(DAY_KEYS[i])} style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid", cursor: "pointer", fontWeight: 700, fontSize: "0.8rem", background: activityForm.days.includes(DAY_KEYS[i]) ? "rgba(99,102,241,0.3)" : "transparent", color: activityForm.days.includes(DAY_KEYS[i]) ? "#818cf8" : "var(--text-secondary)", borderColor: activityForm.days.includes(DAY_KEYS[i]) ? "#6366f1" : "var(--border)" }}>{d}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Hora inicio</label><input type="time" className="form-input" value={activityForm.startTime} onChange={e => setActivityForm({ ...activityForm, startTime: e.target.value })} /></div>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Hora fin</label><input type="time" className="form-input" value={activityForm.endTime} onChange={e => setActivityForm({ ...activityForm, endTime: e.target.value })} /></div>
              </div>
              <div>
                <label className="form-label" style={{ marginBottom: "8px" }}>Imagen Principal</label>
                <ImageUploader currentUrl={activityForm.imageUrl} onUploaded={url => setActivityForm(f => ({ ...f, imageUrl: url }))} folder="activity-covers" placeholder="Imagen actividad" size="medium" />
              </div>
              <div className="form-group"><label className="form-label">🎥 Link de Video (YouTube/Instagram)</label><input className="form-input" type="url" placeholder="https://youtube.com/..." value={activityForm.videoUrl} onChange={e => setActivityForm({ ...activityForm, videoUrl: e.target.value })} /></div>
              <div>
                <label className="form-label" style={{ marginBottom: "8px" }}>📸 Galería de Fotos</label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                  {activityForm.mediaUrls.map((url: string, i: number) => (
                    <div key={i} style={{ position: "relative" }}>
                      <img src={url} alt="" style={{ width: "70px", height: "70px", objectFit: "contain", borderRadius: "8px", background: "rgba(0,0,0,0.3)" }} />
                      <button onClick={() => removeMedia(i, activityForm, setActivityForm)} type="button" style={{ position: "absolute", top: "-6px", right: "-6px", background: "#ef4444", border: "none", color: "white", borderRadius: "50%", width: "18px", height: "18px", cursor: "pointer", fontSize: "10px" }}>×</button>
                    </div>
                  ))}
                  {activityForm.mediaUrls.length < 50 && (
                    <ImageUploader onUploaded={url => addMedia(url, activityForm, setActivityForm)} folder="activity-gallery" placeholder="Agregar foto" size="small" disableCrop={true} multiple={true} />
                  )}
                </div>
              </div>
              <div className="form-group"><label className="form-label">📢 Notas / Notificación</label><textarea className="form-input" rows={2} value={activityForm.notes} placeholder="Nota visible para los seguidores..." onChange={e => setActivityForm({ ...activityForm, notes: e.target.value })} /></div>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "var(--text-secondary)" }}>
                <input type="checkbox" checked={activityForm.isActive} onChange={e => setActivityForm({ ...activityForm, isActive: e.target.checked })} />
                Actividad activa (visible públicamente)
              </label>
              <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                <button type="button" className="btn-secondary" onClick={() => setIsActivityOpen(false)} style={{ flex: 1, padding: "12px" }}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={isPending} style={{ flex: 2, padding: "12px" }}>{isPending ? "Guardando..." : (editingActivity ? "💾 Actualizar" : "✅ Crear")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
