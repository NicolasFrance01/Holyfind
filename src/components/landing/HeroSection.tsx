"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const HeroGlobe = dynamic(() => import("./HeroGlobe"), { ssr: false });

const SUGGESTIONS = [
  "Córdoba, Argentina",
  "Buenos Aires, Argentina",
  "Rosario, Argentina",
  "Mendoza, Argentina",
  "Mar del Plata, Argentina",
];

export default function HeroSection() {
  const [query, setQuery] = useState("");
  const [placeholder, setPlaceholder] = useState(SUGGESTIONS[0]);
  const [cmdOpen, setCmdOpen] = useState(false);
  const router = useRouter();

  // Cycle through placeholder suggestions
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % SUGGESTIONS.length;
      setPlaceholder(SUGGESTIONS[i]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // ⌘K command search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
      if (e.key === "Escape") setCmdOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/maps${query ? `?search=${encodeURIComponent(query)}` : ""}`);
  };

  return (
    <>
      {/* ⌘K Command Palette */}
      {cmdOpen && (
        <div className="command-overlay" onClick={() => setCmdOpen(false)}>
          <div className="command-palette" onClick={(e) => e.stopPropagation()}>
            <div className="command-input-wrap">
              <span style={{ fontSize: "1.1rem" }}>🔍</span>
              <input
                className="command-input"
                placeholder="¿Dónde querés encontrar una comunidad?"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && router.push("/maps")}
              />
              <kbd style={{ fontSize: "0.72rem", color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: "4px", padding: "2px 6px" }}>ESC</kbd>
            </div>
            <div className="command-results">
              <div className="command-section-title">Acceso rápido</div>
              <div className="command-item" onClick={() => router.push("/maps")}>
                <span>📍</span> Usar mi ubicación actual
              </div>
              <div className="command-section-title">Ciudades populares</div>
              {SUGGESTIONS.map((s) => (
                <div key={s} className="command-item" onClick={() => router.push(`/maps?search=${encodeURIComponent(s)}`)}>
                  <span>🌎</span> {s}
                </div>
              ))}
              <div className="command-section-title">Acciones</div>
              <div className="command-item" onClick={() => router.push("/login")}>
                <span>⚙️</span> Panel Administrador
              </div>
              <div className="command-item" onClick={() => { setCmdOpen(false); document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" }); }}>
                <span>⛪</span> Registrar mi iglesia
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <section style={{
        minHeight: "100vh",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        paddingTop: "80px",
      }}>
        {/* Animated globe background */}
        <HeroGlobe />

        {/* Radial gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(124,231,172,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Content */}
        <div className="container" style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
          <div className="animate-fade-up" style={{ animationDelay: "0.1s", opacity: 0 }}>
            <div className="section-label" style={{ display: "inline-flex", marginBottom: "32px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--holy-green)", animation: "pulse 2s infinite" }} />
              Plataforma activa en Argentina y el mundo
            </div>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: "0.2s", opacity: 0 }}>
            <h1 style={{ fontSize: "clamp(3rem, 7vw, 6rem)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.05, marginBottom: "24px" }}>
              Encontrá dónde<br />
              <span className="serif" style={{ fontStyle: "italic", color: "var(--holy-green)", fontSize: "1.1em" }}>pertenecés.</span>
            </h1>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: "0.35s", opacity: 0 }}>
            <p style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)", color: "var(--text-secondary)", maxWidth: "580px", margin: "0 auto 48px", lineHeight: 1.8 }}>
              Descubrí iglesias, comunidades, actividades y espacios de fe cerca tuyo o en cualquier lugar del mundo.
            </p>
          </div>

          {/* Giant Search Bar */}
          <div className="animate-fade-up" style={{ animationDelay: "0.45s", opacity: 0 }}>
            <form onSubmit={handleSearch} style={{ maxWidth: "600px", margin: "0 auto 40px", position: "relative" }}>
              <div style={{
                display: "flex",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid var(--border-strong)",
                borderRadius: "99px",
                padding: "6px 6px 6px 24px",
                backdropFilter: "blur(20px)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
                gap: "8px",
                alignItems: "center",
              }}>
                <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>📍</span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={placeholder}
                  style={{
                    flex: 1, background: "none", border: "none", outline: "none",
                    color: "var(--text-primary)", fontSize: "1rem", fontFamily: "var(--font-ui)",
                    minWidth: 0,
                  }}
                />
                <button type="submit" className="btn-primary" style={{ borderRadius: "99px", flexShrink: 0, whiteSpace: "nowrap" }}>
                  Explorar →
                </button>
              </div>

              {/* ⌘K hint */}
              <button
                type="button"
                onClick={() => setCmdOpen(true)}
                style={{
                  position: "absolute", right: "130px", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "4px",
                  color: "var(--text-muted)", fontSize: "0.72rem",
                }}
              >
                <kbd style={{ border: "1px solid var(--border-strong)", borderRadius: "4px", padding: "1px 5px", fontSize: "0.7rem" }}>⌘K</kbd>
              </button>
            </form>

            <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn-ghost" onClick={() => setCmdOpen(true)}>
                Buscar por ciudad
              </button>
              <Link href="#iglesias" className="btn-ghost">
                ¿Tenés una iglesia?
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="animate-fade-up" style={{ animationDelay: "0.6s", opacity: 0, marginTop: "80px" }}>
            <div style={{ display: "flex", gap: "60px", justifyContent: "center", flexWrap: "wrap" }}>
              {[
                ["100+", "Iglesias"],
                ["15+", "Denominaciones"],
                ["3", "Países"],
              ].map(([val, label]) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--holy-green)", lineHeight: 1 }}>{val}</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: "absolute", bottom: "32px", left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
          animation: "float 2s ease-in-out infinite",
        }}>
          <div style={{ width: "20px", height: "32px", border: "1px solid var(--border-strong)", borderRadius: "99px", display: "flex", justifyContent: "center", paddingTop: "6px" }}>
            <div style={{ width: "3px", height: "6px", background: "var(--holy-green)", borderRadius: "99px", animation: "pulse 1.5s ease-in-out infinite" }} />
          </div>
        </div>
      </section>
    </>
  );
}
