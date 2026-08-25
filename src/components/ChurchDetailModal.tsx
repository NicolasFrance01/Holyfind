"use client";

import { useState, useTransition, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toggleFollowChurch, toggleEventLike, toggleEventSave, addComment, trackChurchClick, submitPrayerRequest, createForumTopic, createForumComment } from "@/app/dashboard/userActions";

const DAY_MAP: Record<string, string> = { MONDAY: "Lun", TUESDAY: "Mar", WEDNESDAY: "Mié", THURSDAY: "Jue", FRIDAY: "Vie", SATURDAY: "Sáb", SUNDAY: "Dom" };

function embedUrl(url: string): { src: string; type: "youtube" | "instagram" } | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
  if (yt) return { src: `https://www.youtube.com/embed/${yt[1]}?rel=0`, type: "youtube" };
  const ytShort = url.match(/youtube\.com\/shorts\/([^?&/]+)/);
  if (ytShort) return { src: `https://www.youtube.com/embed/${ytShort[1]}`, type: "youtube" };
  const ig = url.match(/instagram\.com\/(?:p|reel|tv)\/([^/?]+)/);
  if (ig) return { src: `https://www.instagram.com/p/${ig[1]}/embed/`, type: "instagram" };
  return null;
}

interface ChurchDetailModalProps {
  church: any;
  onClose: () => void;
  userId?: string;
  followingChurchIds?: string[];
  likedEventIds?: string[];
  savedEventIds?: string[];
}

export default function ChurchDetailModal({ church, onClose, userId, followingChurchIds = [], likedEventIds = [], savedEventIds = [] }: ChurchDetailModalProps) {
  const { data: session } = useSession();
  const currentUserId = userId || (session?.user as any)?.id;
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<"info" | "eventos" | "actividades" | "devocionales" | "oraciones" | "foro" | "comentarios">("info");
  const [isFollowing, setIsFollowing] = useState(followingChurchIds.includes(church.id));
  const [localLikes, setLocalLikes] = useState<Set<string>>(new Set(likedEventIds));
  const [localSaves, setLocalSaves] = useState<Set<string>>(new Set(savedEventIds));
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [rating, setRating] = useState(5);
  const [commentText, setCommentText] = useState("");
  const [commentSent, setCommentSent] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [prayerText, setPrayerText] = useState("");
  const [prayerPublic, setPrayerPublic] = useState(false);
  const [prayerSent, setPrayerSent] = useState(false);
  const [forumTitle, setForumTitle] = useState("");
  const [forumText, setForumText] = useState("");
  const [activeForumTopic, setActiveForumTopic] = useState<any>(null);
  const [commentForumText, setCommentForumText] = useState("");

  useEffect(() => {
    trackChurchClick(church.id, "profile_view");
  }, [church.id]);

  const doFollow = () => {
    if (!currentUserId) { setShowAuthPrompt(true); return; }
    startTransition(async () => {
      const r = await toggleFollowChurch(currentUserId, church.id);
      setIsFollowing(r.following);
    });
  };

  const doLike = (eventId: string) => {
    if (!currentUserId) { setShowAuthPrompt(true); return; }
    startTransition(async () => {
      const r = await toggleEventLike(currentUserId, eventId);
      setLocalLikes(prev => { const s = new Set(prev); r.liked ? s.add(eventId) : s.delete(eventId); return s; });
    });
  };

  const doSave = (eventId: string) => {
    if (!currentUserId) { setShowAuthPrompt(true); return; }
    startTransition(async () => {
      const r = await toggleEventSave(currentUserId, eventId);
      setLocalSaves(prev => { const s = new Set(prev); r.saved ? s.add(eventId) : s.delete(eventId); return s; });
    });
  };

  const submitComment = () => {
    if (!currentUserId || !commentText.trim()) return;
    startTransition(async () => {
      const r = await addComment(currentUserId, church.id, rating, commentText.trim());
      if (!r.error) { setCommentText(""); setCommentSent(true); }
    });
  };

  const submitPrayer = () => {
    if (!currentUserId) { setShowAuthPrompt(true); return; }
    if (!prayerText.trim()) return;
    startTransition(async () => {
      const r = await submitPrayerRequest(currentUserId, church.id, prayerText.trim(), prayerPublic);
      if (!r.error) { setPrayerText(""); setPrayerSent(true); }
    });
  };

  const submitForumTopic = () => {
    if (!currentUserId) { setShowAuthPrompt(true); return; }
    if (!forumTitle.trim() || !forumText.trim()) return;
    startTransition(async () => {
      const r = await createForumTopic(currentUserId, church.id, forumTitle.trim(), forumText.trim());
      if (!r.error) { setForumTitle(""); setForumText(""); setTab("foro"); }
    });
  };

  const submitForumComment = (topicId: string) => {
    if (!currentUserId) { setShowAuthPrompt(true); return; }
    if (!commentForumText.trim()) return;
    startTransition(async () => {
      const r = await createForumComment(currentUserId, topicId, commentForumText.trim());
      if (!r.error) { setCommentForumText(""); }
    });
  };

  const tabBtn = (key: typeof tab, label: string) => (
    <button onClick={() => setTab(key)} style={{
      padding: "8px 14px", borderRadius: "8px", border: "none", cursor: "pointer",
      fontWeight: 700, fontSize: "0.82rem", transition: "all 0.15s",
      background: tab === key ? "rgba(99,102,241,0.25)" : "transparent",
      color: tab === key ? "#818cf8" : "var(--text-secondary)",
      borderBottom: tab === key ? "2px solid #6366f1" : "2px solid transparent",
    }}>{label}</button>
  );

  const avgRating = church.comments?.length > 0
    ? Math.round(church.comments.reduce((a: number, c: any) => a + c.rating, 0) / church.comments.length * 10) / 10
    : null;

  const followerCount = church.followers?.length || 0;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: "16px" }}>
      <div style={{ width: "100%", maxWidth: "640px", maxHeight: "94vh", background: "#0b0f19", border: "1px solid rgba(99,102,241,0.3)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)", borderRadius: "20px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* Hero */}
          <div style={{ position: "relative" }}>
            <div style={{ width: "100%", height: "100px", background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))", borderRadius: "20px 20px 0 0" }}></div>
            {church.imageUrl ? (
              <img src={church.imageUrl} alt={church.name} style={{ width: "84px", height: "84px", objectFit: "cover", borderRadius: "50%", position: "absolute", bottom: "-36px", left: "24px", border: "4px solid rgba(26,31,44,0.5)", background: "rgba(26,31,44,0.8)", backdropFilter: "blur(8px)" }} />
            ) : (
              <div style={{ width: "84px", height: "84px", borderRadius: "50%", position: "absolute", bottom: "-36px", left: "24px", border: "4px solid rgba(26,31,44,0.5)", background: "linear-gradient(135deg, rgba(79,70,229,0.8), rgba(168,85,247,0.8))", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>⛪</div>
            )}
            <button onClick={onClose} style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(0,0,0,0.6)", border: "none", color: "white", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>

          <div style={{ padding: "46px 24px 20px 24px" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "14px" }}>
              <div>
                <h2 style={{ color: "white", fontSize: "1.4rem", fontWeight: 800, margin: "0 0 4px" }}>{church.name}</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", margin: "0 0 4px" }}>📍 {church.address}</p>
                {church.type && <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "2px 10px", borderRadius: "99px", background: "rgba(99,102,241,0.2)", color: "#818cf8" }}>{church.type}</span>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                {avgRating && <div style={{ color: "#f59e0b", fontSize: "0.85rem", fontWeight: 700 }}>{"⭐".repeat(Math.round(avgRating))} {avgRating}</div>}
                <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>🔔 {followerCount} seguidores</div>
              </div>
            </div>

          {/* Follow + Directions + Donations */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "18px" }}>
            <button onClick={doFollow} disabled={isPending} style={{
              flex: 1, minWidth: "120px", padding: "10px", borderRadius: "10px", border: "1px solid", cursor: "pointer", fontWeight: 700, fontSize: "0.88rem", transition: "all 0.2s",
              background: isFollowing ? "rgba(99,102,241,0.25)" : "transparent",
              color: isFollowing ? "#818cf8" : "var(--text-secondary)",
              borderColor: isFollowing ? "rgba(99,102,241,0.5)" : "var(--border)"
            }}>
              {isFollowing ? "🔔 Siguiendo" : "🔕 Seguir"}
            </button>
            {church.latitude && church.longitude && (
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${church.latitude},${church.longitude}`} target="_blank" rel="noopener" style={{ flex: 1, minWidth: "120px", padding: "10px", borderRadius: "10px", background: "#4f46e5", color: "white", textDecoration: "none", textAlign: "center", fontWeight: 700, fontSize: "0.88rem" }}>🧭 Cómo Llegar</a>
            )}
            {church.donationUrl && (
              <a href={church.donationUrl} target="_blank" rel="noopener" style={{ flex: 1, minWidth: "120px", padding: "10px", borderRadius: "10px", background: "linear-gradient(135deg, #0ea5e9, #3b82f6)", color: "white", textDecoration: "none", textAlign: "center", fontWeight: 700, fontSize: "0.88rem", border: "1px solid rgba(56,189,248,0.5)", boxShadow: "0 4px 12px rgba(14, 165, 233, 0.2)" }}>💳 Donar / Ofrendar</a>
            )}
          </div>

          {/* Social links */}
          {(church.instagram || church.youtube || church.facebook || church.whatsapp || church.website || church.phone) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "18px" }}>
              {church.instagram && <a href={church.instagram} target="_blank" rel="noopener" style={{ padding: "5px 12px", borderRadius: "8px", textDecoration: "none", fontSize: "0.78rem", fontWeight: 700, background: "linear-gradient(135deg,#f43f5e,#ec4899,#a855f7)", color: "white" }}>📸 Instagram</a>}
              {church.youtube && <a href={church.youtube} target="_blank" rel="noopener" style={{ padding: "5px 12px", borderRadius: "8px", textDecoration: "none", fontSize: "0.78rem", fontWeight: 700, background: "#ef4444", color: "white" }}>▶️ YouTube</a>}
              {church.facebook && <a href={church.facebook} target="_blank" rel="noopener" style={{ padding: "5px 12px", borderRadius: "8px", textDecoration: "none", fontSize: "0.78rem", fontWeight: 700, background: "#3b82f6", color: "white" }}>📘 Facebook</a>}
              {church.whatsapp && <a href={church.whatsapp?.trim().startsWith("http") ? church.whatsapp.trim() : `https://wa.me/${church.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener" style={{ padding: "5px 12px", borderRadius: "8px", textDecoration: "none", fontSize: "0.78rem", fontWeight: 700, background: "#22c55e", color: "white" }}>💬 WhatsApp</a>}
              {church.website && <a href={church.website} target="_blank" rel="noopener" style={{ padding: "5px 12px", borderRadius: "8px", textDecoration: "none", fontSize: "0.78rem", fontWeight: 700, background: "rgba(99,102,241,0.3)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.4)" }}>🌐 Web</a>}
              {church.phone && <a href={`tel:${church.phone}`} style={{ padding: "5px 12px", borderRadius: "8px", textDecoration: "none", fontSize: "0.78rem", fontWeight: 700, background: "rgba(255,255,255,0.08)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>📞 {church.phone}</a>}
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid var(--border)", marginBottom: "18px", overflowX: "auto", paddingBottom: "4px" }}>
            {tabBtn("info", "ℹ️ Info")}
            {tabBtn("eventos", `📅 Eventos (${church.events?.length || 0})`)}
            {tabBtn("actividades", `🏃 Actividades (${church.activities?.length || 0})`)}
            {tabBtn("devocionales", "📖 Devocionales")}
            {tabBtn("oraciones", "🙏 Oración")}
            {tabBtn("foro", "💬 Foro")}
            {tabBtn("comentarios", `⭐ Reseñas (${church.comments?.filter((c: any) => c.isVisible).length || 0})`)}
          </div>

          {/* Tab: Info */}
          {tab === "info" && (
            <div>
              {church.description ? <p style={{ color: "var(--text-secondary)", lineHeight: "1.7" }}>{church.description}</p> : <p style={{ color: "var(--text-secondary)" }}>Esta iglesia no tiene descripción todavía.</p>}
            </div>
          )}

          {/* Tab: Eventos */}
          {tab === "eventos" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {(church.events || []).length === 0 ? (
                <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "20px" }}>Sin eventos próximos</p>
              ) : (church.events || []).map((ev: any) => (
                <div key={ev.id} style={{ padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}>
                    {ev.imageUrl && <img src={ev.imageUrl} alt={ev.title} style={{ width: "100%", height: "120px", objectFit: "contain", background: "rgba(0,0,0,0.4)", borderRadius: "8px", marginBottom: "8px" }} />}
                    <h3 style={{ color: "white", fontSize: "0.95rem", fontWeight: 700, margin: "0 0 4px" }}>{ev.title}</h3>
                    
                    {/* Organiza / Conjunto */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px", fontSize: "0.78rem" }}>
                      <span style={{ color: "#a5b4fc", background: "rgba(99,102,241,0.15)", padding: "2px 8px", borderRadius: "6px", fontWeight: 600 }}>⛪ Patrocina: {church.name}</span>
                      {ev.jointChurches && (typeof ev.jointChurches === "string" ? JSON.parse(ev.jointChurches) : ev.jointChurches)?.length > 0 && (
                        <span style={{ color: "#f472b6", background: "rgba(244,114,182,0.15)", padding: "2px 8px", borderRadius: "6px", fontWeight: 600 }}>
                          🤝 Con: {(typeof ev.jointChurches === "string" ? JSON.parse(ev.jointChurches) : ev.jointChurches).map((j: any) => j.name).join(", ")}
                        </span>
                      )}
                    </div>

                    <p style={{ color: "var(--text-secondary)", fontSize: "0.78rem", margin: "0 0 8px" }}>🗓️ {new Date(ev.eventDate).toLocaleString("es-AR", { dateStyle: "long", timeStyle: "short" })}</p>
                    {ev.description && <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", marginBottom: "8px" }}>{ev.description}</p>}
                    {ev.notes && <p style={{ color: "#818cf8", fontSize: "0.8rem", padding: "6px 10px", background: "rgba(99,102,241,0.1)", borderRadius: "6px", marginBottom: "8px" }}>📢 {ev.notes}</p>}
                    {ev.media?.length > 0 && (
                      <div style={{ display: "flex", gap: "6px", overflowX: "auto", marginBottom: "8px" }}>
                        {ev.media.map((m: any, i: number) => <img key={i} src={m.url} alt="" style={{ height: "60px", width: "80px", objectFit: "contain", background: "rgba(0,0,0,0.3)", borderRadius: "6px", flexShrink: 0 }} />)}
                      </div>
                    )}
                    {ev.videoUrl && (() => {
                      const embed = embedUrl(ev.videoUrl);
                      if (embed) {
                        return (
                          <div style={{ marginBottom: "8px" }}>
                            <div style={{ borderRadius: "8px", overflow: "hidden", height: "180px", maxWidth: "320px", marginBottom: "4px", background: "#000" }}>
                              <iframe src={embed.src} style={{ width: "100%", height: "100%" }} frameBorder={0} allowFullScreen scrolling="no" />
                            </div>
                            <a href={ev.videoUrl} target="_blank" rel="noopener" style={{ display: "inline-block", color: "#818cf8", fontSize: "0.82rem" }}>🎥 Abrir en {embed.type === "youtube" ? "YouTube" : "Instagram"}</a>
                          </div>
                        );
                      }
                      return <a href={ev.videoUrl} target="_blank" rel="noopener" style={{ display: "inline-block", marginBottom: "8px", color: "#818cf8", fontSize: "0.82rem" }}>🎥 Ver Video asociado</a>;
                    })()}
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => doLike(ev.id)} disabled={isPending} style={{ flex: 1, padding: "6px", borderRadius: "7px", border: "1px solid", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, background: localLikes.has(ev.id) ? "rgba(239,68,68,0.2)" : "transparent", color: localLikes.has(ev.id) ? "#f87171" : "var(--text-secondary)", borderColor: localLikes.has(ev.id) ? "rgba(239,68,68,0.4)" : "var(--border)" }}>
                        {localLikes.has(ev.id) ? "❤️" : "🤍"} {ev.likes?.length || 0}
                      </button>
                      <button onClick={() => doSave(ev.id)} disabled={isPending} style={{ flex: 1, padding: "6px", borderRadius: "7px", border: "1px solid", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, background: localSaves.has(ev.id) ? "rgba(99,102,241,0.2)" : "transparent", color: localSaves.has(ev.id) ? "#818cf8" : "var(--text-secondary)", borderColor: localSaves.has(ev.id) ? "rgba(99,102,241,0.4)" : "var(--border)" }}>
                        {localSaves.has(ev.id) ? "🔖" : "🏷️"} {localSaves.has(ev.id) ? "Guardado" : "Guardar"}
                      </button>
                    </div>
                  </div>
              ))}
            </div>
          )}

          {/* Tab: Actividades */}
          {tab === "actividades" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {(church.activities || []).length === 0 ? (
                <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "20px" }}>Sin actividades publicadas</p>
              ) : (church.activities || []).filter((a: any) => a.isActive).map((act: any) => {
                const days: string[] = JSON.parse(act.days || "[]");
                return (
                  <div key={act.id} style={{ padding: "14px", borderRadius: "12px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.03)" }}>
                    {act.imageUrl && <img src={act.imageUrl} alt={act.title} style={{ width: "100%", maxHeight: "200px", objectFit: "contain", background: "#060810", borderRadius: "8px", marginBottom: "8px" }} />}
                    <h3 style={{ color: "white", fontSize: "0.9rem", fontWeight: 700, margin: "0 0 4px" }}>{act.title}</h3>
                    {days.length > 0 && <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", margin: "0 0 2px" }}>📅 {days.map((d: string) => DAY_MAP[d] || d).join(", ")}</p>}
                    {(act.startTime || act.endTime) && <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", margin: "0 0 6px" }}>🕐 {act.startTime} - {act.endTime}</p>}
                    {act.description && <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", marginBottom: "6px" }}>{act.description}</p>}
                    {act.notes && <p style={{ color: "#818cf8", fontSize: "0.8rem", padding: "6px 10px", background: "rgba(99,102,241,0.1)", borderRadius: "6px" }}>📢 {act.notes}</p>}
                    {act.media?.length > 0 && (
                      <div style={{ display: "flex", gap: "6px", overflowX: "auto", marginTop: "8px" }}>
                        {act.media.map((m: any, i: number) => <img key={i} src={m.url} alt="" style={{ height: "55px", width: "70px", objectFit: "contain", background: "rgba(0,0,0,0.3)", borderRadius: "6px", flexShrink: 0 }} />)}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: "6px", marginTop: "8px", color: "var(--text-secondary)", fontSize: "0.78rem" }}>
                      <span>❤️ {act.likes?.length || 0}</span>
                      <span>🔖 {act.saves?.length || 0}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab: Devocionales */}
          {tab === "devocionales" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {(!church.devotionals || church.devotionals.length === 0) ? (
                <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "20px" }}>Sin devocionales compartidos</p>
              ) : (
                church.devotionals.map((dev: any) => (
                  <div key={dev.id} style={{ padding: "16px", borderRadius: "12px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.03)" }}>
                    {dev.imageUrl && <img src={dev.imageUrl} alt="" style={{ width: "100%", height: "140px", objectFit: "cover", borderRadius: "8px", marginBottom: "12px" }} />}
                    <h3 style={{ color: "white", fontSize: "1.05rem", fontWeight: 700, margin: "0 0 4px" }}>{dev.title}</h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", margin: "0 0 10px" }}>
                      🗓️ {new Date(dev.createdAt).toLocaleDateString("es-AR")}
                      {dev.author && ` • ✍️ ${dev.author}`}
                    </p>
                    <p style={{ color: "white", fontSize: "0.95rem", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>{dev.content}</p>
                    {dev.videoUrl && (
                      <a href={dev.videoUrl} target="_blank" rel="noopener" style={{ display: "inline-block", color: "#818cf8", fontSize: "0.85rem", marginTop: "10px" }}>🎥 Ver Video Adjunto</a>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab: Oraciones */}
          {tab === "oraciones" && (
            <div>
              <div style={{ padding: "20px", borderRadius: "12px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.03)", marginBottom: "20px" }}>
                <h3 style={{ color: "white", fontSize: "1.1rem", marginBottom: "6px" }}>🙏 Enviar Petición</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "12px" }}>Escribe tu petición de oración. Puedes hacerla pública para que otros se unan, o mantenerla privada solo para la iglesia.</p>
                {prayerSent ? (
                  <div style={{ padding: "16px", background: "rgba(16,185,129,0.15)", border: "1px solid #10b981", borderRadius: "8px", color: "#10b981", textAlign: "center" }}>
                    ✅ ¡Petición enviada! La iglesia estará orando por ti.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <textarea value={prayerText} onChange={e => setPrayerText(e.target.value)} rows={4} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)", background: "rgba(0,0,0,0.4)", color: "white", fontSize: "0.9rem" }} placeholder="Mi petición es..."></textarea>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "0.85rem", cursor: "pointer" }}>
                      <input type="checkbox" checked={prayerPublic} onChange={e => setPrayerPublic(e.target.checked)} />
                      Hacer petición pública (otros usuarios podrán verla)
                    </label>
                    <button onClick={submitPrayer} disabled={isPending || !prayerText.trim()} style={{ padding: "10px 16px", borderRadius: "8px", background: "#4f46e5", color: "white", border: "none", fontWeight: 700, cursor: "pointer", opacity: (!prayerText.trim() || isPending) ? 0.5 : 1 }}>{isPending ? "Enviando..." : "Enviar Petición"}</button>
                  </div>
                )}
              </div>
              
              <h3 style={{ color: "white", fontSize: "1rem", marginBottom: "10px" }}>📢 Peticiones Públicas</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {(!church.prayerRequests || church.prayerRequests.filter((r: any) => r.isPublic).length === 0) ? (
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textAlign: "center" }}>No hay peticiones públicas recientes.</p>
                ) : (
                  church.prayerRequests.filter((r: any) => r.isPublic).map((req: any) => (
                    <div key={req.id} style={{ padding: "12px", borderRadius: "10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <p style={{ color: "white", fontSize: "0.9rem", margin: "0 0 6px" }}>{req.content}</p>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", margin: 0 }}>🗓️ {new Date(req.createdAt).toLocaleDateString("es-AR")} {req.status === "PRAYING" && "• 🙏 Orando"} {req.status === "ANSWERED" && "• ✨ Respondida"}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab: Foro */}
          {tab === "foro" && (
            <div>
              {!activeForumTopic ? (
                <>
                  <div style={{ padding: "16px", borderRadius: "12px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.03)", marginBottom: "20px" }}>
                    <h3 style={{ color: "white", fontSize: "1rem", marginBottom: "10px" }}>💬 Nuevo Tema de Discusión</h3>
                    <input value={forumTitle} onChange={e => setForumTitle(e.target.value)} placeholder="Título del tema" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "rgba(0,0,0,0.4)", color: "white", fontSize: "0.9rem", marginBottom: "8px" }} />
                    <textarea value={forumText} onChange={e => setForumText(e.target.value)} rows={3} placeholder="Contenido o pregunta..." style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "rgba(0,0,0,0.4)", color: "white", fontSize: "0.9rem", marginBottom: "10px" }}></textarea>
                    <button onClick={submitForumTopic} disabled={isPending || !forumTitle.trim() || !forumText.trim()} style={{ padding: "8px 16px", borderRadius: "8px", background: "#4f46e5", color: "white", border: "none", fontWeight: 700, cursor: "pointer", opacity: (!forumTitle.trim() || !forumText.trim() || isPending) ? 0.5 : 1 }}>{isPending ? "Publicando..." : "Publicar Tema"}</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {(!church.forumTopics || church.forumTopics.length === 0) ? (
                      <p style={{ color: "var(--text-secondary)", textAlign: "center" }}>No hay temas de discusión aún.</p>
                    ) : (
                      church.forumTopics.map((topic: any) => (
                        <div key={topic.id} onClick={() => setActiveForumTopic(topic)} style={{ padding: "14px", borderRadius: "12px", border: "1px solid var(--border)", cursor: "pointer", transition: "background 0.2s" }} className="hover:bg-white/5">
                          <h4 style={{ color: "white", fontSize: "1rem", margin: "0 0 4px" }}>{topic.title}</h4>
                          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "0 0 8px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{topic.content}</p>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                            <span>🗓️ {new Date(topic.createdAt).toLocaleDateString("es-AR")}</span>
                            <span>💬 {topic.comments?.length || 0} comentarios</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div>
                  <button onClick={() => setActiveForumTopic(null)} style={{ background: "none", border: "none", color: "#818cf8", cursor: "pointer", fontSize: "0.85rem", marginBottom: "14px" }}>← Volver a los temas</button>
                  <div style={{ padding: "16px", borderRadius: "12px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", marginBottom: "20px" }}>
                    <h3 style={{ color: "white", fontSize: "1.2rem", margin: "0 0 8px" }}>{activeForumTopic.title}</h3>
                    <p style={{ color: "white", fontSize: "0.95rem", lineHeight: "1.5" }}>{activeForumTopic.content}</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                    {(activeForumTopic.comments || []).length === 0 ? (
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textAlign: "center" }}>No hay comentarios en este tema.</p>
                    ) : (
                      activeForumTopic.comments.map((c: any) => (
                        <div key={c.id} style={{ padding: "12px", borderRadius: "8px", background: "rgba(255,255,255,0.05)" }}>
                          <p style={{ color: "white", fontSize: "0.9rem", margin: "0 0 4px" }}>{c.content}</p>
                          <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", margin: 0 }}>🗓️ {new Date(c.createdAt).toLocaleDateString("es-AR")}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input value={commentForumText} onChange={e => setCommentForumText(e.target.value)} placeholder="Escribe un comentario..." style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "rgba(0,0,0,0.4)", color: "white" }} />
                    <button onClick={() => submitForumComment(activeForumTopic.id)} disabled={isPending || !commentForumText.trim()} style={{ padding: "0 16px", borderRadius: "8px", background: "#4f46e5", color: "white", border: "none", fontWeight: 700, cursor: "pointer", opacity: (!commentForumText.trim() || isPending) ? 0.5 : 1 }}>Enviar</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Comentarios */}
          {tab === "comentarios" && (
            <div>
              {currentUserId && !commentSent && (
                <div style={{ padding: "16px", borderRadius: "12px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.03)", marginBottom: "16px" }}>
                  <h3 style={{ color: "white", fontSize: "0.95rem", fontWeight: 700, margin: "0 0 12px" }}>Dejar un comentario</h3>
                  <div style={{ display: "flex", gap: "4px", marginBottom: "10px" }}>
                    {[1,2,3,4,5].map(star => (
                      <button key={star} onClick={() => setRating(star)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.5rem", color: star <= rating ? "#f59e0b" : "rgba(255,255,255,0.2)" }}>⭐</button>
                    ))}
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem", alignSelf: "center", marginLeft: "4px" }}>{rating}/5</span>
                  </div>
                  <textarea className="form-input" rows={3} value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Compartí tu experiencia con esta iglesia..." style={{ marginBottom: "10px" }} />
                  <button onClick={submitComment} disabled={!commentText.trim() || isPending} className="btn-primary" style={{ padding: "8px 20px", fontSize: "0.85rem" }}>
                    {isPending ? "Enviando..." : "📤 Publicar"}
                  </button>
                </div>
              )}
              {commentSent && <div style={{ padding: "12px", background: "rgba(16,185,129,0.15)", border: "1px solid #10b981", borderRadius: "10px", color: "#10b981", marginBottom: "14px", fontWeight: 600 }}>✅ Comentario publicado. Será visible en breve.</div>}
              {!currentUserId && <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", marginBottom: "14px" }}>Iniciá sesión para dejar un comentario.</p>}

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {(church.comments || []).filter((c: any) => c.isVisible).length === 0 ? (
                  <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "20px" }}>Sin comentarios todavía. ¡Sé el primero!</p>
                ) : (church.comments || []).filter((c: any) => c.isVisible).map((c: any) => (
                  <div key={c.id} style={{ padding: "14px", borderRadius: "12px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.03)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      {c.user?.profileImage ? <img src={c.user.profileImage} alt="" style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }} /> : <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>👤</div>}
                      <div>
                        <p style={{ color: "white", fontWeight: 700, margin: "0 0 2px", fontSize: "0.88rem" }}>{c.user?.name || "Usuario"}</p>
                        <div style={{ color: "#f59e0b", fontSize: "0.85rem" }}>{"⭐".repeat(c.rating)}</div>
                      </div>
                      <span style={{ marginLeft: "auto", color: "var(--text-secondary)", fontSize: "0.72rem" }}>{new Date(c.createdAt).toLocaleDateString("es-AR")}</span>
                    </div>
                    <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.88rem", lineHeight: "1.5" }}>{c.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Auth Prompt Modal */}
      {showAuthPrompt && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000, padding: "20px" }}>
          <div style={{ background: "#0f172a", border: "1px solid rgba(99,102,241,0.4)", borderRadius: "16px", padding: "24px", maxWidth: "400px", width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🔒</div>
            <h3 style={{ color: "white", fontSize: "1.2rem", fontWeight: 800, margin: "0 0 8px" }}>¡Iniciá Sesión para Interactuar!</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "20px" }}>Para seguir esta iglesia o guardar eventos en tu perfil necesitás tener una cuenta.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button onClick={() => window.location.href = "/login"} className="btn-primary" style={{ padding: "10px" }}>🔑 Iniciar Sesión</button>
              <button onClick={() => window.location.href = "/login?signup=true"} className="btn-secondary" style={{ padding: "10px" }}>✨ Crear una Cuenta</button>
              <button onClick={() => setShowAuthPrompt(false)} style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "0.8rem", cursor: "pointer", marginTop: "4px" }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
