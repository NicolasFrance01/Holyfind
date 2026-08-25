"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { toggleEventLike, toggleEventSave } from "@/app/dashboard/userActions";

const EVENT_EMOJI: Record<string, string> = {
  MISA: "🙏", RETIRO: "⛺", CONCIERTO: "🎵", CONFERENCIA: "🎤",
  BAUTISMO: "💧", BODA: "💍", CONGRESO: "🤝", OTRO: "📅"
};

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

function getInstagramPostId(url: string): string | null {
  const m = url.match(/instagram\.com\/(?:p|reel|tv)\/([^/?]+)/);
  return m ? m[1] : null;
}

function whatsappHref(raw: string): string {
  if (!raw) return "#";
  const cleaned = raw.trim();
  if (cleaned.startsWith("http")) return cleaned;
  return `https://wa.me/${cleaned.replace(/[^0-9]/g, "")}`;
}

// Liquid Glass style
const GLASS_MODAL: React.CSSProperties = {
  background: "rgba(8, 10, 22, 0.88)",
  border: "1px solid rgba(255, 255, 255, 0.18)",
  boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.45), inset 0 1px 0 rgba(255,255,255,0.12)",
  backdropFilter: "blur(24px) saturate(180%)",
  WebkitBackdropFilter: "blur(24px) saturate(180%)",
  borderRadius: "24px",
};

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
  const [activeTab, setActiveTab] = useState<"todos" | "guardados">("todos");
  const igRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const filtered = events.filter(ev => {
    if (new Date(ev.eventDate) < now) return false;
    if (!search) return true;
    return ev.title.toLowerCase().includes(search.toLowerCase()) ||
      ev.church?.name?.toLowerCase().includes(search.toLowerCase());
  });

  // Categorize events
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const isNew = (ev: any) => new Date(ev.createdAt) > sevenDaysAgo;
  const isPopular = (ev: any) => (ev.likes?.length || 0) + (ev.saves?.length || 0) >= 3;
  const isSaved = (ev: any) => localSaves.has(ev.id);

  const popularEvents = filtered.filter(isPopular);
  const newEvents = filtered.filter(ev => isNew(ev) && !isPopular(ev));
  const regularEvents = filtered.filter(ev => !isNew(ev) && !isPopular(ev));
  const savedEvents = filtered.filter(isSaved);

  // Removed instagram blockquote processing script since we use iframe

  useEffect(() => { if (selectedEvent) setCarouselIdx(0); }, [selectedEvent]);

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

  const EventCard = ({ ev, compact = false }: { ev: any; compact?: boolean }) => {
    const liked = localLikes.has(ev.id);
    const saved = localSaves.has(ev.id);
    const likeCount = (ev.likes?.length || 0) + (liked && !likedEventIds.includes(ev.id) ? 1 : !liked && likedEventIds.includes(ev.id) ? -1 : 0);
    return (
      <div
        onClick={() => setSelectedEvent(ev)}
        style={{
          cursor: "pointer", borderRadius: "14px", marginBottom: compact ? "6px" : "8px",
          border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)",
          overflow: "hidden", transition: "border-color 0.2s, transform 0.15s"
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.5)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
      >
        {ev.imageUrl && <img src={ev.imageUrl} alt={ev.title} style={{ width: "100%", height: "90px", objectFit: "contain", background: "#0a0c16" }} />}
        <div style={{ padding: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "1rem" }}>{EVENT_EMOJI[ev.type] || "📅"}</span>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "1px 7px", borderRadius: "99px", background: "rgba(99,102,241,0.2)", color: "#818cf8" }}>{ev.type}</span>
                {isNew(ev) && <span style={{ fontSize: "0.62rem", fontWeight: 700, padding: "1px 7px", borderRadius: "99px", background: "rgba(16,185,129,0.25)", color: "#10b981", animation: "pulse 2s infinite" }}>NUEVO</span>}
                {isPopular(ev) && <span style={{ fontSize: "0.62rem", fontWeight: 700, padding: "1px 7px", borderRadius: "99px", background: "rgba(251,191,36,0.25)", color: "#fbbf24" }}>🔥 Popular</span>}
              </div>
              <h3 style={{ color: "white", fontSize: "0.9rem", fontWeight: 700, margin: "0 0 2px", lineHeight: "1.3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.78rem", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>⛪ {ev.church?.name}</p>
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
  };

  const SectionHeader = ({ label, count }: { label: string; count: number }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", marginTop: "16px" }}>
      <span style={{ color: "var(--text-secondary)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label} ({count})</span>
      <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Tabs + Search */}
      <div style={{ padding: "12px", borderBottom: "1px solid var(--glass-border)" }}>
        <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
          {[["todos", "📅 Todos"], ["guardados", "🔖 Mis Guardados"]].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key as any)}
              style={{ flex: 1, padding: "7px", borderRadius: "10px", border: "1px solid", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700, transition: "all 0.15s",
                background: activeTab === key ? "rgba(99,102,241,0.2)" : "transparent",
                color: activeTab === key ? "#818cf8" : "var(--text-secondary)",
                borderColor: activeTab === key ? "rgba(99,102,241,0.5)" : "var(--border)" }}>
              {label}
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} className="form-input"
          placeholder="🔍 Buscar evento o iglesia..." style={{ fontSize: "0.85rem", padding: "10px 14px" }} />
        <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", marginTop: "8px" }}>
          {filtered.length} evento{filtered.length !== 1 ? "s" : ""} próximo{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Events list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
        {activeTab === "todos" && (
          <>
            {/* Popular */}
            {popularEvents.length > 0 && (
              <>
                <SectionHeader label="🔥 Populares" count={popularEvents.length} />
                {popularEvents.map(ev => <EventCard key={ev.id} ev={ev} />)}
              </>
            )}

            {/* New */}
            {newEvents.length > 0 && (
              <>
                <SectionHeader label="🌱 Recientes" count={newEvents.length} />
                {newEvents.map(ev => <EventCard key={ev.id} ev={ev} />)}
              </>
            )}

            {/* Regular */}
            {regularEvents.length > 0 && (
              <>
                <SectionHeader label="📋 Todos los Eventos" count={regularEvents.length} />
                {regularEvents.map(ev => <EventCard key={ev.id} ev={ev} />)}
              </>
            )}

            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--text-secondary)" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>📅</div>
                <p>No hay eventos próximos{search ? " con ese criterio" : ""}</p>
              </div>
            )}
          </>
        )}

        {activeTab === "guardados" && (
          <>
            {savedEvents.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--text-secondary)" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🔖</div>
                <p>No tenés eventos guardados</p>
              </div>
            ) : savedEvents.map(ev => <EventCard key={ev.id} ev={ev} />)}
          </>
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: "16px" }}>
          <div style={{ width: "100%", maxWidth: "640px", maxHeight: "92vh", overflowY: "auto", ...GLASS_MODAL }}>
            {/* Header image */}
            {selectedEvent.imageUrl && (
              <div style={{ width: "100%", background: "#060810", borderRadius: "24px 24px 0 0", overflow: "hidden" }}>
                <img src={selectedEvent.imageUrl} alt={selectedEvent.title} style={{ width: "100%", maxHeight: "280px", objectFit: "contain", display: "block" }} />
              </div>
            )}
            <div style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "1.3rem" }}>{EVENT_EMOJI[selectedEvent.type] || "📅"}</span>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "2px 10px", borderRadius: "99px", background: "rgba(99,102,241,0.2)", color: "#818cf8" }}>{selectedEvent.type}</span>
                    {isNew(selectedEvent) && <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "2px 8px", borderRadius: "99px", background: "rgba(16,185,129,0.2)", color: "#10b981" }}>🌱 NUEVO</span>}
                    {isPopular(selectedEvent) && <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "2px 8px", borderRadius: "99px", background: "rgba(251,191,36,0.2)", color: "#fbbf24" }}>🔥 Popular</span>}
                  </div>
                  <h2 style={{ color: "white", fontSize: "1.3rem", fontWeight: 800, margin: "0 0 4px" }}>{selectedEvent.title}</h2>
                  <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.85rem" }}>🗓️ {new Date(selectedEvent.eventDate).toLocaleString("es-AR", { dateStyle: "full", timeStyle: "short" })}</p>
                </div>
                <button onClick={() => setSelectedEvent(null)} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "white", borderRadius: "50%", width: "34px", height: "34px", cursor: "pointer", fontSize: "1.1rem", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
              </div>

              {/* Church info */}
              {selectedEvent.church && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", background: "rgba(255,255,255,0.04)", borderRadius: "12px", marginBottom: "16px", border: "1px solid rgba(255,255,255,0.07)" }}>
                  {selectedEvent.church.imageUrl ? <img src={selectedEvent.church.imageUrl} alt="" style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>⛪</div>}
                  <div>
                    <p style={{ color: "white", fontWeight: 700, margin: "0 0 2px", fontSize: "0.9rem" }}>{selectedEvent.church.name}</p>
                    <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.78rem" }}>{selectedEvent.church.type}</p>
                  </div>
                </div>
              )}

              {selectedEvent.description && <p style={{ color: "var(--text-secondary)", lineHeight: "1.7", marginBottom: "16px" }}>{selectedEvent.description}</p>}

              {selectedEvent.notes && (
                <div style={{ padding: "12px 16px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: "10px", marginBottom: "16px" }}>
                  <p style={{ color: "#818cf8", margin: 0, fontSize: "0.88rem" }}>📢 {selectedEvent.notes}</p>
                </div>
              )}

              {/* Carousel - original size */}
              {selectedEvent.media?.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>📸 Galería ({selectedEvent.media.length})</p>
                  <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", background: "#060810" }}>
                    <img src={selectedEvent.media[carouselIdx]?.url} alt="" style={{ width: "100%", maxHeight: "500px", objectFit: "contain", display: "block" }} />
                    {selectedEvent.media.length > 1 && (
                      <div style={{ display: "flex", justifyContent: "space-between", position: "absolute", top: "50%", transform: "translateY(-50%)", width: "100%", padding: "0 8px", boxSizing: "border-box" }}>
                        <button onClick={() => setCarouselIdx(i => (i - 1 + selectedEvent.media.length) % selectedEvent.media.length)} style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.15)", color: "white", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
                        <button onClick={() => setCarouselIdx(i => (i + 1) % selectedEvent.media.length)} style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.15)", color: "white", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
                      </div>
                    )}
                    <div style={{ position: "absolute", bottom: "8px", right: "8px", background: "rgba(0,0,0,0.7)", color: "white", borderRadius: "6px", padding: "2px 8px", fontSize: "0.72rem" }}>{carouselIdx + 1}/{selectedEvent.media.length}</div>
                  </div>
                </div>
              )}

              {/* Video embed */}
              {selectedEvent.videoUrl && (() => {
                const embed = embedUrl(selectedEvent.videoUrl);
                if (embed) {
                  return (
                    <div style={{ marginBottom: "16px" }}>
                      <div style={{ borderRadius: "12px", overflow: "hidden", position: "relative", paddingTop: embed.type === "youtube" ? "56.25%" : "120%", marginBottom: "8px" }}>
                        <iframe src={embed.src} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} frameBorder={0} allow="autoplay; encrypted-media" allowFullScreen scrolling="no" />
                      </div>
                      <a href={selectedEvent.videoUrl} target="_blank" rel="noopener" className="btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", textDecoration: "none", fontSize: "0.82rem" }}>
                        🔗 Abrir en {embed.type === "youtube" ? "YouTube" : "Instagram"}
                      </a>
                    </div>
                  );
                }
                return (
                  <div style={{ marginBottom: "16px" }}>
                    <a href={selectedEvent.videoUrl} target="_blank" rel="noopener" className="btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", textDecoration: "none", fontSize: "0.85rem" }}>
                      🎥 Ver Video asociado
                    </a>
                  </div>
                );
              })()}

              {/* Social links of church */}
              {selectedEvent.church && (selectedEvent.church.instagram || selectedEvent.church.youtube || selectedEvent.church.facebook || selectedEvent.church.whatsapp || selectedEvent.church.website || selectedEvent.church.phone) && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                  {selectedEvent.church.instagram && <a href={selectedEvent.church.instagram} target="_blank" rel="noopener" style={{ padding: "5px 12px", borderRadius: "8px", textDecoration: "none", fontSize: "0.78rem", fontWeight: 700, background: "linear-gradient(135deg,#f43f5e,#ec4899,#a855f7)", color: "white" }}>📸 Instagram</a>}
                  {selectedEvent.church.youtube && <a href={selectedEvent.church.youtube} target="_blank" rel="noopener" style={{ padding: "5px 12px", borderRadius: "8px", textDecoration: "none", fontSize: "0.78rem", fontWeight: 700, background: "#ef4444", color: "white" }}>▶️ YouTube</a>}
                  {selectedEvent.church.facebook && <a href={selectedEvent.church.facebook} target="_blank" rel="noopener" style={{ padding: "5px 12px", borderRadius: "8px", textDecoration: "none", fontSize: "0.78rem", fontWeight: 700, background: "#3b82f6", color: "white" }}>📘 Facebook</a>}
                  {selectedEvent.church.whatsapp && <a href={whatsappHref(selectedEvent.church.whatsapp)} target="_blank" rel="noopener" style={{ padding: "5px 12px", borderRadius: "8px", textDecoration: "none", fontSize: "0.78rem", fontWeight: 700, background: "#22c55e", color: "white" }}>💬 WhatsApp</a>}
                  {selectedEvent.church.website && <a href={selectedEvent.church.website} target="_blank" rel="noopener" style={{ padding: "5px 12px", borderRadius: "8px", textDecoration: "none", fontSize: "0.78rem", fontWeight: 700, background: "rgba(99,102,241,0.3)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.4)" }}>🌐 Sitio Web</a>}
                  {selectedEvent.church.phone && <a href={`tel:${selectedEvent.church.phone}`} style={{ padding: "5px 12px", borderRadius: "8px", textDecoration: "none", fontSize: "0.78rem", fontWeight: 700, background: "rgba(255,255,255,0.06)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>📞 {selectedEvent.church.phone}</a>}
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

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
