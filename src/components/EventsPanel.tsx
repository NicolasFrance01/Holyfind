"use client";

import { useState, useTransition, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toggleEventLike, toggleEventSave, addComment, trackChurchClick } from "@/app/dashboard/userActions";

const EVENT_EMOJI: Record<string, string> = {
  MISA: "🙏", RETIRO: "⛺", CONCIERTO: "🎵", CONFERENCIA: "🎤",
  BAUTISMO: "💧", BODA: "💍", OTRO: "📅"
};

function embedUrl(url: string): string | null {
  if (!url) return null;
  // YouTube
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  // Instagram (reels/video — just show link)
  return null;
}

interface EventsPanelProps {
  events: any[];
  userId?: string;
  likedEventIds?: string[];
  savedEventIds?: string[];
}

export default function EventsPanel({ events, userId, likedEventIds = [], savedEventIds = [] }: EventsPanelProps) {
  const { data: session } = useSession();
  const currentUserId = userId || (session?.user as any)?.id;
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [localLikes, setLocalLikes] = useState<Set<string>>(new Set(likedEventIds));
  const [localSaves, setLocalSaves] = useState<Set<string>>(new Set(savedEventIds));
  const [carouselIdx, setCarouselIdx] = useState(0);

  const now = new Date();
  const filtered = events.filter(ev => {
    if (new Date(ev.eventDate) < now) return false;
    if (!search) return true;
    return ev.title.toLowerCase().includes(search.toLowerCase()) ||
      ev.church?.name.toLowerCase().includes(search.toLowerCase());
  });

  const doLike = (eventId: string) => {
    if (!currentUserId) return;
    startTransition(async () => {
      const r = await toggleEventLike(currentUserId, eventId);
      setLocalLikes(prev => { const s = new Set(prev); r.liked ? s.add(eventId) : s.delete(eventId); return s; });
    });
  };

  const doSave = (eventId: string) => {
    if (!currentUserId) return;
    startTransition(async () => {
      const r = await toggleEventSave(currentUserId, eventId);
      setLocalSaves(prev => { const s = new Set(prev); r.saved ? s.add(eventId) : s.delete(eventId); return s; });
    });
  };

  useEffect(() => { if (selectedEvent) setCarouselIdx(0); }, [selectedEvent]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Search */}
      <div style={{ padding: "14px", borderBottom: "1px solid var(--glass-border)" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="form-input"
          placeholder="🔍 Buscar evento o iglesia..."
          style={{ fontSize: "0.85rem", padding: "10px 14px" }}
        />
        <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", marginTop: "8px" }}>
          {filtered.length} evento{filtered.length !== 1 ? "s" : ""} próximo{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Events list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--text-secondary)" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>📅</div>
            <p>No hay eventos próximos{search ? " con ese criterio" : ""}</p>
          </div>
        ) : (
          filtered.map((ev: any) => {
            const liked = localLikes.has(ev.id);
            const saved = localSaves.has(ev.id);
            const likeCount = (ev.likes?.length || 0) + (liked && !likedEventIds.includes(ev.id) ? 1 : !liked && likedEventIds.includes(ev.id) ? -1 : 0);
            return (
              <div key={ev.id} onClick={() => setSelectedEvent(ev)}
                style={{ cursor: "pointer", borderRadius: "12px", marginBottom: "8px", border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.03)", overflow: "hidden", transition: "border-color 0.2s" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.5)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--glass-border)"}
              >
                {ev.imageUrl && <img src={ev.imageUrl} alt={ev.title} style={{ width: "100%", height: "100px", objectFit: "cover" }} />}
                <div style={{ padding: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                        <span style={{ fontSize: "1rem" }}>{EVENT_EMOJI[ev.type] || "📅"}</span>
                        <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "1px 7px", borderRadius: "99px", background: "rgba(99,102,241,0.2)", color: "#818cf8" }}>{ev.type}</span>
                      </div>
                      <h3 style={{ color: "white", fontSize: "0.9rem", fontWeight: 700, margin: "0 0 2px", lineHeight: "1.3" }}>{ev.title}</h3>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.78rem", margin: "0 0 4px" }}>⛪ {ev.church?.name}</p>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", margin: 0 }}>
                        🗓️ {new Date(ev.eventDate).toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px", marginTop: "10px" }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => doLike(ev.id)} disabled={!currentUserId || isPending}
                      style={{ flex: 1, padding: "5px 4px", borderRadius: "7px", border: "1px solid", cursor: currentUserId ? "pointer" : "default", fontSize: "0.78rem", fontWeight: 600, background: liked ? "rgba(239,68,68,0.2)" : "transparent", color: liked ? "#f87171" : "var(--text-secondary)", borderColor: liked ? "rgba(239,68,68,0.4)" : "var(--border)", transition: "all 0.15s" }}>
                      {liked ? "❤️" : "🤍"} {likeCount}
                    </button>
                    <button onClick={() => doSave(ev.id)} disabled={!currentUserId || isPending}
                      style={{ flex: 1, padding: "5px 4px", borderRadius: "7px", border: "1px solid", cursor: currentUserId ? "pointer" : "default", fontSize: "0.78rem", fontWeight: 600, background: saved ? "rgba(99,102,241,0.2)" : "transparent", color: saved ? "#818cf8" : "var(--text-secondary)", borderColor: saved ? "rgba(99,102,241,0.4)" : "var(--border)", transition: "all 0.15s" }}>
                      {saved ? "🔖" : "🏷️"} {saved ? "Guardado" : "Guardar"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: "16px" }}>
          <div style={{ width: "100%", maxWidth: "620px", maxHeight: "92vh", overflowY: "auto", background: "var(--card-bg)", border: "1px solid var(--glass-border)", borderRadius: "20px" }}>
            {/* Header image */}
            {selectedEvent.imageUrl && <img src={selectedEvent.imageUrl} alt={selectedEvent.title} style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "20px 20px 0 0" }} />}
            <div style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "1.3rem" }}>{EVENT_EMOJI[selectedEvent.type] || "📅"}</span>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "2px 10px", borderRadius: "99px", background: "rgba(99,102,241,0.2)", color: "#818cf8" }}>{selectedEvent.type}</span>
                  </div>
                  <h2 style={{ color: "white", fontSize: "1.3rem", fontWeight: 800, margin: "0 0 4px" }}>{selectedEvent.title}</h2>
                  <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.85rem" }}>🗓️ {new Date(selectedEvent.eventDate).toLocaleString("es-AR", { dateStyle: "full", timeStyle: "short" })}</p>
                </div>
                <button onClick={() => setSelectedEvent(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", fontSize: "1.1rem", flexShrink: 0 }}>×</button>
              </div>

              {/* Church info */}
              {selectedEvent.church && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", background: "rgba(255,255,255,0.05)", borderRadius: "12px", marginBottom: "16px" }}>
                  {selectedEvent.church.imageUrl ? <img src={selectedEvent.church.imageUrl} alt={selectedEvent.church.name} style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover" }} /> : <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>⛪</div>}
                  <div>
                    <p style={{ color: "white", fontWeight: 700, margin: "0 0 2px", fontSize: "0.9rem" }}>{selectedEvent.church.name}</p>
                    <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.78rem" }}>{selectedEvent.church.type}</p>
                  </div>
                </div>
              )}

              {selectedEvent.description && <p style={{ color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "16px" }}>{selectedEvent.description}</p>}

              {/* Notes */}
              {selectedEvent.notes && (
                <div style={{ padding: "12px 16px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: "10px", marginBottom: "16px" }}>
                  <p style={{ color: "#818cf8", margin: 0, fontSize: "0.88rem" }}>📢 {selectedEvent.notes}</p>
                </div>
              )}

              {/* Carousel */}
              {selectedEvent.media?.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>📸 Galería ({selectedEvent.media.length})</p>
                  <div style={{ position: "relative" }}>
                    <img src={selectedEvent.media[carouselIdx]?.url} alt="" style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "12px" }} />
                    {selectedEvent.media.length > 1 && (
                      <div style={{ display: "flex", justifyContent: "space-between", position: "absolute", top: "50%", transform: "translateY(-50%)", width: "100%", padding: "0 8px", boxSizing: "border-box" }}>
                        <button onClick={() => setCarouselIdx(i => (i - 1 + selectedEvent.media.length) % selectedEvent.media.length)} style={{ background: "rgba(0,0,0,0.6)", border: "none", color: "white", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", fontSize: "1rem" }}>‹</button>
                        <button onClick={() => setCarouselIdx(i => (i + 1) % selectedEvent.media.length)} style={{ background: "rgba(0,0,0,0.6)", border: "none", color: "white", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", fontSize: "1rem" }}>›</button>
                      </div>
                    )}
                    <div style={{ position: "absolute", bottom: "8px", right: "8px", background: "rgba(0,0,0,0.6)", color: "white", borderRadius: "6px", padding: "2px 8px", fontSize: "0.72rem" }}>{carouselIdx + 1}/{selectedEvent.media.length}</div>
                  </div>
                </div>
              )}

              {/* Video embed */}
              {selectedEvent.videoUrl && (
                <div style={{ marginBottom: "16px" }}>
                  {embedUrl(selectedEvent.videoUrl) ? (
                    <div style={{ borderRadius: "12px", overflow: "hidden", position: "relative", paddingTop: "56.25%" }}>
                      <iframe src={embedUrl(selectedEvent.videoUrl)!} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} frameBorder={0} allow="autoplay; encrypted-media" allowFullScreen />
                    </div>
                  ) : (
                    <a href={selectedEvent.videoUrl} target="_blank" rel="noopener" className="btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", textDecoration: "none", fontSize: "0.85rem" }}>
                      🎥 Ver Video / Instagram
                    </a>
                  )}
                </div>
              )}

              {/* Social links of church */}
              {selectedEvent.church && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                  {selectedEvent.church.instagram && <a href={selectedEvent.church.instagram} target="_blank" rel="noopener" style={{ padding: "5px 12px", borderRadius: "8px", textDecoration: "none", fontSize: "0.78rem", fontWeight: 700, background: "linear-gradient(135deg,#f43f5e,#ec4899,#a855f7)", color: "white" }}>📸 Instagram</a>}
                  {selectedEvent.church.youtube && <a href={selectedEvent.church.youtube} target="_blank" rel="noopener" style={{ padding: "5px 12px", borderRadius: "8px", textDecoration: "none", fontSize: "0.78rem", fontWeight: 700, background: "#ef4444", color: "white" }}>▶️ YouTube</a>}
                  {selectedEvent.church.facebook && <a href={selectedEvent.church.facebook} target="_blank" rel="noopener" style={{ padding: "5px 12px", borderRadius: "8px", textDecoration: "none", fontSize: "0.78rem", fontWeight: 700, background: "#3b82f6", color: "white" }}>📘 Facebook</a>}
                  {selectedEvent.church.whatsapp && <a href={`https://wa.me/${selectedEvent.church.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener" style={{ padding: "5px 12px", borderRadius: "8px", textDecoration: "none", fontSize: "0.78rem", fontWeight: 700, background: "#22c55e", color: "white" }}>💬 WhatsApp</a>}
                  {selectedEvent.church.website && <a href={selectedEvent.church.website} target="_blank" rel="noopener" style={{ padding: "5px 12px", borderRadius: "8px", textDecoration: "none", fontSize: "0.78rem", fontWeight: 700, background: "rgba(99,102,241,0.3)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.4)" }}>🌐 Sitio Web</a>}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => doLike(selectedEvent.id)} disabled={!currentUserId || isPending}
                  style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid", cursor: currentUserId ? "pointer" : "not-allowed", fontSize: "0.9rem", fontWeight: 700, transition: "all 0.2s", background: localLikes.has(selectedEvent.id) ? "rgba(239,68,68,0.2)" : "transparent", color: localLikes.has(selectedEvent.id) ? "#f87171" : "var(--text-secondary)", borderColor: localLikes.has(selectedEvent.id) ? "rgba(239,68,68,0.4)" : "var(--border)" }}>
                  {localLikes.has(selectedEvent.id) ? "❤️ Destacado" : "🤍 Destacar"}
                </button>
                <button onClick={() => doSave(selectedEvent.id)} disabled={!currentUserId || isPending}
                  style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid", cursor: currentUserId ? "pointer" : "not-allowed", fontSize: "0.9rem", fontWeight: 700, transition: "all 0.2s", background: localSaves.has(selectedEvent.id) ? "rgba(99,102,241,0.2)" : "transparent", color: localSaves.has(selectedEvent.id) ? "#818cf8" : "var(--text-secondary)", borderColor: localSaves.has(selectedEvent.id) ? "rgba(99,102,241,0.4)" : "var(--border)" }}>
                  {localSaves.has(selectedEvent.id) ? "🔖 Guardado" : "🏷️ Guardar"}
                </button>
              </div>
              {!currentUserId && <p style={{ color: "var(--text-secondary)", fontSize: "0.78rem", textAlign: "center", marginTop: "8px" }}>Iniciá sesión para destacar o guardar eventos</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
