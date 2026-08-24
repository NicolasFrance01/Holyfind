"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import ImageUploader from "@/components/ImageUploader";
import { updateUserProfile, toggleFollowChurch, toggleEventLike, toggleEventSave, toggleActivitySave } from "./userActions";

const MARITAL_STATUS = ["SOLTERO", "CASADO", "DIVORCIADO", "VIUDO", "OTRO"];
const MARITAL_LABELS: Record<string, string> = { SOLTERO: "Soltero/a", CASADO: "Casado/a", DIVORCIADO: "Divorciado/a", VIUDO: "Viudo/a", OTRO: "Otro" };
type Section = "perfil" | "miIglesia" | "guardados" | "actividades";

export default function UserDashboardClient({ user, followedChurches, savedEvents, savedActivities, likedEventIds, savedEventIds }: {
  user: any; followedChurches: any[]; savedEvents: any[]; savedActivities: any[];
  likedEventIds: string[]; savedEventIds: string[];
}) {
  const [activeSection, setActiveSection] = useState<Section>("perfil");
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: user.name || "", phone: user.phone || "",
    birthDate: user.birthDate ? new Date(user.birthDate).toISOString().slice(0, 10) : "",
    maritalStatus: user.maritalStatus || "", recoveryEmail: user.recoveryEmail || "",
    profileImage: user.profileImage || "",
  });

  const [localLikes, setLocalLikes] = useState<Set<string>>(new Set(likedEventIds));
  const [localSaves, setLocalSaves] = useState<Set<string>>(new Set(savedEventIds));

  const showMsg = (text: string, ok: boolean) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 4000); };

  const sBtn = (active: boolean) => ({
    width: "100%", textAlign: "left" as const, padding: "10px 14px", borderRadius: "10px",
    border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", transition: "all 0.2s",
    background: active ? "rgba(99,102,241,0.2)" : "transparent",
    color: active ? "#818cf8" : "rgba(255,255,255,0.65)",
    borderLeft: active ? "3px solid #6366f1" : "3px solid transparent",
    marginBottom: "2px",
  });

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const r = await updateUserProfile(user.id, profileForm);
      r.error ? showMsg(r.error, false) : showMsg("✅ Perfil actualizado", true);
    });
  };

  const doUnfollow = (churchId: string) => {
    startTransition(async () => {
      await toggleFollowChurch(user.id, churchId);
      showMsg("Dejaste de seguir esta iglesia", true);
    });
  };

  const doLike = (eventId: string) => {
    startTransition(async () => {
      const r = await toggleEventLike(user.id, eventId);
      setLocalLikes(prev => { const s = new Set(prev); r.liked ? s.add(eventId) : s.delete(eventId); return s; });
    });
  };

  const doSave = (eventId: string) => {
    startTransition(async () => {
      const r = await toggleEventSave(user.id, eventId);
      setLocalSaves(prev => { const s = new Set(prev); r.saved ? s.add(eventId) : s.delete(eventId); return s; });
    });
  };

  const doUnsaveActivity = (activityId: string) => {
    startTransition(async () => { await toggleActivitySave(user.id, activityId); });
  };

  const age = user.birthDate ? Math.floor((Date.now() - new Date(user.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000)) : null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-gradient-start)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ padding: "14px 24px", background: "rgba(15,23,42,0.95)", borderBottom: "1px solid var(--glass-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span className="text-gradient" style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "1.4rem" }}>Holyfind</span>
          </Link>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem", padding: "3px 10px", background: "rgba(99,102,241,0.1)", borderRadius: "20px", border: "1px solid rgba(99,102,241,0.2)" }}>Mi Cuenta</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link href="/maps" className="btn-secondary" style={{ padding: "6px 14px", fontSize: "0.85rem", textDecoration: "none" }}>🗺️ Ver Mapa</Link>
          <button onClick={() => signOut({ callbackUrl: "/" })} className="btn-secondary" style={{ padding: "6px 14px", fontSize: "0.85rem" }}>Salir</button>
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Sidebar */}
        <aside style={{ width: "230px", background: "rgba(10,15,30,0.9)", borderRight: "1px solid var(--glass-border)", padding: "20px 10px", display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto" }}>
          {/* Avatar */}
          <div style={{ textAlign: "center", padding: "16px 0 20px" }}>
            {profileForm.profileImage ? (
              <img src={profileForm.profileImage} alt={profileForm.name} style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(99,102,241,0.5)" }} />
            ) : (
              <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "rgba(99,102,241,0.2)", border: "2px solid rgba(99,102,241,0.4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", fontSize: "1.5rem" }}>👤</div>
            )}
            <p style={{ color: "white", fontWeight: 700, fontSize: "0.9rem", margin: "8px 0 2px" }}>{profileForm.name || "Usuario"}</p>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", margin: 0 }}>{user.email}</p>
          </div>

          <div style={{ height: "1px", background: "var(--border)", margin: "4px 0 12px" }} />

          {([
            ["perfil", "👤", "Mi Perfil"],
            ["miIglesia", "⛪", `Mi Iglesia (${followedChurches.length})`],
            ["guardados", "🔖", `Guardados (${savedEvents.length + savedActivities.length})`],
            ["actividades", "📋", "Actividades"],
          ] as [Section, string, string][]).map(([key, icon, label]) => (
            <button key={key} onClick={() => setActiveSection(key)} style={sBtn(activeSection === key)}>
              {icon} {label}
            </button>
          ))}

          <div style={{ height: "1px", background: "var(--border)", margin: "12px 0 4px" }} />
          <button onClick={() => signOut({ callbackUrl: "/" })} style={{ ...sBtn(false), color: "#f87171" }}>🚪 Cerrar Sesión</button>
        </aside>

        {/* Content */}
        <div style={{ flex: 1, padding: "28px", overflowY: "auto", maxWidth: "900px" }}>
          {msg && (
            <div style={{ padding: "12px 16px", borderRadius: "10px", marginBottom: "20px", background: msg.ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", border: `1px solid ${msg.ok ? "#10b981" : "#ef4444"}`, color: msg.ok ? "#10b981" : "#ef4444", fontWeight: 600 }}>
              {msg.text}
            </div>
          )}

          {/* ── MI PERFIL ── */}
          {activeSection === "perfil" && (
            <div>
              <h1 style={{ color: "white", fontSize: "1.6rem", fontWeight: 800, marginBottom: "24px" }}>👤 Mi Perfil</h1>
              <div className="glass-panel" style={{ padding: "28px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "28px" }}>
                  <ImageUploader
                    currentUrl={profileForm.profileImage}
                    onUploaded={url => setProfileForm(f => ({ ...f, profileImage: url }))}
                    folder="user-avatars"
                    placeholder="Foto de perfil"
                    size="large"
                    shape="circle"
                  />
                  <div>
                    <h2 style={{ color: "white", fontSize: "1.3rem", fontWeight: 800, margin: "0 0 4px" }}>{profileForm.name || "Completá tu perfil"}</h2>
                    {age && <p style={{ color: "var(--text-secondary)", margin: "0 0 4px", fontSize: "0.9rem" }}>{age} años {profileForm.maritalStatus ? `· ${MARITAL_LABELS[profileForm.maritalStatus]}` : ""}</p>}
                    <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.8rem" }}>Miembro desde {new Date(user.createdAt).toLocaleDateString("es-AR", { month: "long", year: "numeric" })}</p>
                  </div>
                </div>

                <form onSubmit={saveProfile} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="form-group"><label className="form-label">Nombre Completo</label><input className="form-input" value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} placeholder="Tu nombre completo" /></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div className="form-group">
                      <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        Teléfono / WhatsApp
                        <span title="Tu número se verificará manualmente en un plazo de 24 a 72hs." style={{ cursor: "help", fontSize: "0.75rem", width: "16px", height: "16px", borderRadius: "50%", background: "rgba(99,102,241,0.3)", color: "#818cf8", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>ℹ</span>
                      </label>
                      <input className="form-input" value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} placeholder="+549..." />
                      {user.phone && !user.phoneVerified && <p style={{ color: "#fbbf24", fontSize: "0.72rem", marginTop: "4px" }}>⏳ Pendiente de verificación (24-72hs)</p>}
                      {user.phoneVerified && <p style={{ color: "#10b981", fontSize: "0.72rem", marginTop: "4px" }}>✅ Verificado</p>}
                    </div>
                    <div className="form-group"><label className="form-label">Fecha de Nacimiento</label><input type="date" className="form-input" value={profileForm.birthDate} onChange={e => setProfileForm(f => ({ ...f, birthDate: e.target.value }))} /></div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div className="form-group">
                      <label className="form-label">Estado Civil</label>
                      <select className="form-input" value={profileForm.maritalStatus} onChange={e => setProfileForm(f => ({ ...f, maritalStatus: e.target.value }))}>
                        <option value="">Seleccioná...</option>
                        {MARITAL_STATUS.map(s => <option key={s} value={s}>{MARITAL_LABELS[s]}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        Email Secundario
                        <span title="Email de recuperación de cuenta (opcional)" style={{ cursor: "help", fontSize: "0.75rem", width: "16px", height: "16px", borderRadius: "50%", background: "rgba(99,102,241,0.3)", color: "#818cf8", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>ℹ</span>
                      </label>
                      <input type="email" className="form-input" value={profileForm.recoveryEmail} onChange={e => setProfileForm(f => ({ ...f, recoveryEmail: e.target.value }))} placeholder="Opcional" />
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button type="submit" className="btn-primary" disabled={isPending} style={{ padding: "12px 28px" }}>{isPending ? "Guardando..." : "💾 Guardar"}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── MI IGLESIA ── */}
          {activeSection === "miIglesia" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
                <h1 style={{ color: "white", fontSize: "1.6rem", fontWeight: 800 }}>⛪ Mi Iglesia</h1>
                <Link href="/maps" className="btn-primary" style={{ padding: "8px 18px", fontSize: "0.85rem", textDecoration: "none" }}>+ Buscar en el Mapa</Link>
              </div>
              {followedChurches.length === 0 ? (
                <div className="glass-panel" style={{ padding: "50px", textAlign: "center" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "12px" }}>⛪</div>
                  <h2 style={{ color: "white" }}>Todavía no seguís ninguna iglesia</h2>
                  <p style={{ color: "var(--text-secondary)" }}>Encontrá iglesias en el mapa y hacé clic en "Seguir" para verlas acá.</p>
                  <Link href="/maps" className="btn-primary" style={{ display: "inline-block", marginTop: "16px", padding: "10px 24px", textDecoration: "none" }}>🗺️ Ir al Mapa</Link>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {followedChurches.map((church: any) => (
                    <div key={church.id} className="glass-panel" style={{ padding: "20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                        <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                          {church.imageUrl ? <img src={church.imageUrl} alt={church.name} style={{ width: "50px", height: "50px", borderRadius: "10px", objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: "50px", height: "50px", borderRadius: "10px", background: "rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>⛪</div>}
                          <div>
                            <h3 style={{ color: "white", fontSize: "1rem", fontWeight: 700, margin: "0 0 4px" }}>{church.name}</h3>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", margin: 0 }}>{church.type}</p>
                          </div>
                        </div>
                        <button onClick={() => doUnfollow(church.id)} className="btn-secondary" style={{ padding: "6px 14px", fontSize: "0.8rem", flexShrink: 0 }}>Dejar de seguir</button>
                      </div>
                      {church.events?.length > 0 && (
                        <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--border)" }}>
                          <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Próximos Eventos</p>
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            {church.events.slice(0, 3).map((ev: any) => (
                              <div key={ev.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                                <span style={{ color: "white" }}>📅 {ev.title}</span>
                                <span style={{ color: "var(--text-secondary)" }}>{new Date(ev.eventDate).toLocaleDateString("es-AR")}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {church.activities?.length > 0 && (
                        <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {church.activities.map((act: any) => (
                            <span key={act.id} style={{ padding: "3px 10px", borderRadius: "99px", fontSize: "0.75rem", background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}>🏃 {act.title}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── GUARDADOS ── */}
          {activeSection === "guardados" && (
            <div>
              <h1 style={{ color: "white", fontSize: "1.6rem", fontWeight: 800, marginBottom: "22px" }}>🔖 Guardados</h1>
              {savedEvents.length === 0 && savedActivities.length === 0 ? (
                <div className="glass-panel" style={{ padding: "50px", textAlign: "center" }}>
                  <div style={{ fontSize: "3rem" }}>🔖</div>
                  <h2 style={{ color: "white", marginTop: "12px" }}>Sin guardados todavía</h2>
                  <p style={{ color: "var(--text-secondary)" }}>Guardá eventos o actividades para verlos fácilmente acá.</p>
                </div>
              ) : (
                <div>
                  {savedEvents.length > 0 && (
                    <div style={{ marginBottom: "28px" }}>
                      <h2 style={{ color: "white", fontSize: "1rem", fontWeight: 700, marginBottom: "14px" }}>📅 Eventos guardados</h2>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "12px" }}>
                        {savedEvents.map((ev: any) => (
                          <div key={ev.id} className="glass-panel" style={{ padding: "16px" }}>
                            {ev.imageUrl && <img src={ev.imageUrl} alt={ev.title} style={{ width: "100%", height: "90px", objectFit: "cover", borderRadius: "8px", marginBottom: "10px" }} />}
                            <h3 style={{ color: "white", fontSize: "0.9rem", fontWeight: 700, margin: "0 0 4px" }}>{ev.title}</h3>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.78rem", margin: "0 0 8px" }}>{ev.church?.name} · {new Date(ev.eventDate).toLocaleDateString("es-AR")}</p>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button onClick={() => doLike(ev.id)} style={{ flex: 1, padding: "5px", fontSize: "0.8rem", borderRadius: "6px", border: "1px solid var(--border)", cursor: "pointer", background: localLikes.has(ev.id) ? "rgba(239,68,68,0.2)" : "transparent", color: localLikes.has(ev.id) ? "#f87171" : "var(--text-secondary)" }}>
                                {localLikes.has(ev.id) ? "❤️" : "🤍"} {(ev.likes?.length || 0) + (localLikes.has(ev.id) && !likedEventIds.includes(ev.id) ? 1 : 0)}
                              </button>
                              <button onClick={() => doSave(ev.id)} style={{ flex: 1, padding: "5px", fontSize: "0.8rem", borderRadius: "6px", border: "1px solid var(--border)", cursor: "pointer", background: "rgba(99,102,241,0.2)", color: "#818cf8" }}>🔖 Quitar</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {savedActivities.length > 0 && (
                    <div>
                      <h2 style={{ color: "white", fontSize: "1rem", fontWeight: 700, marginBottom: "14px" }}>🏃 Actividades guardadas</h2>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "12px" }}>
                        {savedActivities.map((act: any) => (
                          <div key={act.id} className="glass-panel" style={{ padding: "16px" }}>
                            {act.imageUrl && <img src={act.imageUrl} alt={act.title} style={{ width: "100%", height: "80px", objectFit: "cover", borderRadius: "8px", marginBottom: "10px" }} />}
                            <h3 style={{ color: "white", fontSize: "0.9rem", fontWeight: 700, margin: "0 0 4px" }}>{act.title}</h3>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.78rem", margin: "0 0 8px" }}>{act.church?.name}</p>
                            <button onClick={() => doUnsaveActivity(act.id)} style={{ width: "100%", padding: "5px", fontSize: "0.8rem", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer", background: "rgba(239,68,68,0.1)", color: "#f87171" }}>Quitar guardado</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── ACTIVIDADES ── */}
          {activeSection === "actividades" && (
            <div>
              <h1 style={{ color: "white", fontSize: "1.6rem", fontWeight: 800, marginBottom: "22px" }}>📋 Actividades</h1>
              {followedChurches.length === 0 ? (
                <div className="glass-panel" style={{ padding: "50px", textAlign: "center" }}>
                  <div style={{ fontSize: "3rem" }}>📋</div>
                  <h2 style={{ color: "white", marginTop: "12px" }}>Sin actividades todavía</h2>
                  <p style={{ color: "var(--text-secondary)" }}>Las actividades de las iglesias que seguís aparecerán acá.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {followedChurches.flatMap((church: any) =>
                    (church.activities || []).map((act: any) => ({...act, churchName: church.name, churchImage: church.imageUrl}))
                  ).map((act: any) => {
                    const days: string[] = JSON.parse(act.days || "[]");
                    const DAY_MAP: Record<string, string> = { MONDAY: "Lun", TUESDAY: "Mar", WEDNESDAY: "Mié", THURSDAY: "Jue", FRIDAY: "Vie", SATURDAY: "Sáb", SUNDAY: "Dom" };
                    return (
                      <div key={act.id} className="glass-panel" style={{ padding: "18px", display: "flex", gap: "14px" }}>
                        {act.imageUrl ? <img src={act.imageUrl} alt={act.title} style={{ width: "70px", height: "70px", borderRadius: "10px", objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: "70px", height: "70px", borderRadius: "10px", background: "rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "2rem" }}>🏃</div>}
                        <div style={{ flex: 1 }}>
                          <h3 style={{ color: "white", fontSize: "0.95rem", fontWeight: 700, margin: "0 0 4px" }}>{act.title}</h3>
                          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", margin: "0 0 6px" }}>⛪ {act.churchName}</p>
                          {days.length > 0 && <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", margin: "0 0 4px" }}>📅 {days.map((d: string) => DAY_MAP[d] || d).join(", ")}</p>}
                          {(act.startTime || act.endTime) && <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", margin: 0 }}>🕐 {act.startTime} - {act.endTime}</p>}
                          {act.notes && <p style={{ color: "#818cf8", fontSize: "0.8rem", marginTop: "8px", padding: "6px 10px", background: "rgba(99,102,241,0.1)", borderRadius: "6px" }}>📢 {act.notes}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
