"use client";

import { useEffect, useRef, useState } from "react";

const cards = [
  { icon: "🙏", title: "Reunión General", subtitle: "Domingo · 10:00 hs", color: "#7CE7AC", delay: 0 },
  { icon: "📖", title: "Estudio Bíblico", subtitle: "Miércoles · 20:00 hs", color: "#78A9FF", delay: 0.3 },
  { icon: "👥", title: "Grupo de Jóvenes", subtitle: "Viernes · 21:00 hs", color: "#FFF1C7", delay: 0.6 },
  { icon: "🎶", title: "Noche de Alabanza", subtitle: "Sábado · 19:00 hs", color: "#f472b6", delay: 0.9 },
];

export default function MoreThanLocation() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} style={{ padding: "120px 0", background: "var(--surface)" }}>
      <div className="container" style={{ display: "flex", flexWrap: "wrap", gap: "80px", alignItems: "center" }}>
        {/* Left text */}
        <div style={{ flex: "1 1 400px" }}>
          <div className="section-label">Más que un mapa</div>
          <h2 style={{ fontSize: "clamp(2.2rem, 4vw, 3.5rem)", marginBottom: "24px", lineHeight: 1.1 }}>
            Una iglesia no es solo<br />
            <span className="serif" style={{ fontStyle: "italic", color: "var(--holy-green)" }}>un punto en el mapa.</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.8, fontSize: "1.05rem", maxWidth: "480px" }}>
            Es comunidad, actividades, acompañamiento y pertenencia. Por eso Holyfind va más allá de la ubicación — conecta personas con experiencias.
          </p>

          <div style={{ marginTop: "40px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {["Es comunidad.", "Es actividad.", "Es acompañamiento.", "Es pertenencia."].map((text, i) => (
              <div
                key={text}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  opacity: visible ? 1 : 0,
                  transform: visible ? "none" : "translateX(-20px)",
                  transition: `all 0.6s ease ${i * 0.15}s`,
                }}
              >
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--holy-green)", flexShrink: 0 }} />
                <span style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: floating event cards */}
        <div style={{ flex: "1 1 360px", position: "relative", minHeight: "320px" }}>
          {cards.map((card, i) => (
            <div
              key={card.title}
              style={{
                position: i === 0 ? "relative" : "absolute",
                ...(i === 1 && { top: "-20px", right: "0", left: "auto" }),
                ...(i === 2 && { bottom: "20px", left: "10px" }),
                ...(i === 3 && { top: "60px", right: "-10px" }),
                background: "var(--bg)",
                border: `1px solid ${card.color}30`,
                borderRadius: "16px",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                minWidth: "220px",
                boxShadow: `0 8px 30px rgba(0,0,0,0.3), 0 0 0 1px ${card.color}10`,
                animation: `cardFloat ${4 + i * 0.8}s ease-in-out infinite`,
                animationDelay: `${card.delay}s`,
                opacity: visible ? 1 : 0,
                transition: `opacity 0.8s ease ${card.delay + 0.3}s`,
              }}
            >
              <div style={{
                width: "40px", height: "40px", borderRadius: "10px", flexShrink: 0,
                background: `${card.color}15`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem",
                border: `1px solid ${card.color}25`,
              }}>
                {card.icon}
              </div>
              <div>
                <p style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "0.9rem" }}>{card.title}</p>
                <p style={{ color: card.color, fontSize: "0.78rem", marginTop: "2px" }}>{card.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
