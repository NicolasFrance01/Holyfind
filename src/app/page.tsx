import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

async function getUpcomingEvents() {
  try {
    return await prisma.event.findMany({
      where: {
        isPublic: true,
        eventDate: { gte: new Date() },
      },
      orderBy: { eventDate: "asc" },
      take: 6,
      include: {
        church: { select: { name: true, type: true } },
      },
    });
  } catch {
    return [];
  }
}

const EVENT_ICONS: Record<string, string> = {
  MISA: "🕯️",
  RETIRO: "⛰️",
  CONCIERTO: "🎶",
  CONFERENCIA: "🎤",
  BAUTISMO: "💧",
  BODA: "💒",
  OTRO: "📅",
};

export default async function LandingPage() {
  const events = await getUpcomingEvents();

  return (
    <>
      <nav className="navbar">
        <div className="container navbar-container">
          <Link href="/" className="logo">
            <span className="text-gradient">Holyfind</span>
          </Link>
          <div className="nav-links" id="main-nav">
            <Link href="#mision" className="nav-link">Misión</Link>
            <Link href="#funcionalidades" className="nav-link">Funcionalidades</Link>
            <Link href="#eventos" className="nav-link">Eventos</Link>
            <Link href="#contacto" className="nav-link">Sumar Iglesia</Link>
            <Link href="/maps" className="btn-primary" style={{ padding: "8px 24px" }}>Ver Mapa →</Link>
          </div>
        </div>
      </nav>

      <main>
        {/* ─── HERO ─── */}
        <section className="section" style={{ minHeight: "100vh", display: "flex", alignItems: "center", paddingTop: "100px" }}>
          <div className="container" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "60px" }}>
            <div style={{ flex: "1 1 480px" }} className="animate-fade-in">
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 16px", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "99px", marginBottom: "24px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#6366f1", animation: "pulse 2s infinite" }} />
                <span style={{ color: "#a5b4fc", fontSize: "0.85rem", fontWeight: 600 }}>Plataforma activa · Iglesias en todo el país</span>
              </div>
              <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)", marginBottom: "20px", lineHeight: 1.1 }}>
                Encuentra tu lugar de{" "}
                <span className="text-gradient">Paz y Fe</span>
              </h1>
              <p style={{ fontSize: "1.15rem", color: "var(--text-secondary)", marginBottom: "40px", maxWidth: "560px", lineHeight: 1.8 }}>
                Holyfind conecta a la comunidad con iglesias, congregaciones y eventos espirituales de todo el mundo a través de un mapa interactivo y moderno.
              </p>
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <Link href="/maps" className="btn-primary">🗺️ Explorar Mapa</Link>
                <Link href="#eventos" className="btn-secondary">📅 Ver Eventos</Link>
              </div>

              {/* Stats */}
              <div style={{ display: "flex", gap: "40px", marginTop: "50px", flexWrap: "wrap" }}>
                {[["Iglesias", "100+"], ["Denominaciones", "15+"], ["Países", "3"]].map(([label, val]) => (
                  <div key={label}>
                    <p style={{ fontSize: "2rem", fontWeight: 800, background: "linear-gradient(to right, var(--primary-color), var(--secondary-color))", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{val}</p>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Graphic */}
            <div style={{ flex: "1 1 360px" }} className="animate-float">
              <div className="glass-panel" style={{ height: "420px", width: "100%", borderRadius: "40px", overflow: "hidden", position: "relative", background: "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(236,72,153,0.15) 100%)" }}>
                <div style={{ position: "absolute", top: "15%", left: "8%", width: "120px", height: "120px", background: "var(--primary-color)", borderRadius: "50%", filter: "blur(60px)", opacity: 0.5 }} />
                <div style={{ position: "absolute", bottom: "15%", right: "8%", width: "160px", height: "160px", background: "var(--secondary-color)", borderRadius: "50%", filter: "blur(80px)", opacity: 0.4 }} />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "20px" }}>
                  {/* Mini Map Pin Stack */}
                  {["Iglesia San Martín", "Comunidad Alfa y Omega", "Templo Monte Sinai"].map((name, i) => (
                    <div key={name} className="glass-panel" style={{ padding: "12px 20px", borderRadius: "14px", display: "flex", alignItems: "center", gap: "12px", width: "260px", animation: `fadeIn ${0.5 + i * 0.2}s ease-out both` }}>
                      <span style={{ fontSize: "1.3rem" }}>📍</span>
                      <div>
                        <p style={{ color: "white", fontWeight: 600, fontSize: "0.85rem" }}>{name}</p>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.72rem" }}>Disponible en el mapa</p>
                      </div>
                      <span style={{ marginLeft: "auto", width: "8px", height: "8px", borderRadius: "50%", background: "#34d399" }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── MISIÓN ─── */}
        <section id="mision" className="section" style={{ background: "rgba(0,0,0,0.25)" }}>
          <div className="container" style={{ textAlign: "center" }}>
            <p style={{ color: "var(--primary-color)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.85rem", marginBottom: "12px" }}>Nuestra Misión</p>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", marginBottom: "30px" }}>Fe sin fronteras, <span className="text-gradient">fe accesible</span></h2>
            <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)", maxWidth: "800px", margin: "0 auto", lineHeight: 1.9 }}>
              Holyfind nació para hacer que la fe sea accesible para todos, desde cualquier lugar. No es solo un mapa de iglesias — es una plataforma que conecta comunidades, facilita el descubrimiento de espacios espirituales y mantiene a los creyentes informados sobre eventos y actividades.
            </p>
          </div>
        </section>

        {/* ─── FUNCIONALIDADES ─── */}
        <section id="funcionalidades" className="section">
          <div className="container">
            <p style={{ color: "var(--secondary-color)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.85rem", marginBottom: "12px", textAlign: "center" }}>Plataforma Completa</p>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", textAlign: "center", marginBottom: "60px" }}>
              Todo lo que tu comunidad <span className="text-gradient">necesita</span>
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
              {[
                { icon: "🗺️", title: "Mapa Interactivo", desc: "Tecnología MapLibre GL sobre OpenStreetMap — completamente gratuito, rápido y con marcadores en tiempo real.", color: "var(--primary-color)" },
                { icon: "📅", title: "Alertas de Eventos", desc: "Misas, retiros, conciertos, conferencias — encuentra actividades espirituales cercanas antes de que sucedan.", color: "var(--secondary-color)" },
                { icon: "🔒", title: "Gestión Segura", desc: "Sistema de roles con doble factor: Superadmin controla los accesos, y cada gestor administra solo su iglesia.", color: "var(--accent-color)" },
                { icon: "📱", title: "100% Responsive", desc: "Diseñado para funcionar perfectamente en celular, tablet y computadora con el mismo nivel de detalle.", color: "#f59e0b" },
                { icon: "🚀", title: "Acceso Inmediato", desc: "El mapa público es accesible sin registro. Cualquier persona puede encontrar una iglesia en segundos.", color: "#34d399" },
                { icon: "🛡️", title: "Ciberseguridad", desc: "El Superadmin puede suspender accesos al instante. Las sesiones se gestionan con tokens JWT encriptados.", color: "#e879f9" },
              ].map(({ icon, title, desc, color }) => (
                <div key={title} className="glass-panel feature-card" style={{ padding: "35px", borderRadius: "20px" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "20px" }}>{icon}</div>
                  <h3 style={{ fontSize: "1.2rem", marginBottom: "12px", color }}>{title}</h3>
                  <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, fontSize: "0.9rem" }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── EVENTS ─── */}
        <section id="eventos" className="section" style={{ background: "rgba(0,0,0,0.25)" }}>
          <div className="container">
            <p style={{ color: "var(--accent-color)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.85rem", marginBottom: "12px", textAlign: "center" }}>Próximas Actividades</p>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", textAlign: "center", marginBottom: "60px" }}>
              Alertas de <span className="text-gradient">Eventos</span>
            </h2>

            {events.length === 0 ? (
              <div className="glass-panel" style={{ padding: "60px", textAlign: "center", borderRadius: "24px" }}>
                <p style={{ fontSize: "3rem", marginBottom: "15px" }}>📅</p>
                <h3 style={{ color: "white", marginBottom: "10px" }}>Próximamente</h3>
                <p style={{ color: "var(--text-secondary)" }}>Las iglesias asociadas publicarán sus eventos aquí pronto.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
                {events.map((ev: typeof events[number]) => {
                  const date = new Date(ev.eventDate);
                  return (
                    <div key={ev.id} className="glass-panel feature-card" style={{ padding: "25px", borderRadius: "20px" }}>
                      <div style={{ display: "flex", gap: "15px" }}>
                        {/* Date block */}
                        <div style={{ textAlign: "center", background: "rgba(99,102,241,0.15)", borderRadius: "12px", padding: "12px 16px", flexShrink: 0 }}>
                          <p style={{ color: "var(--primary-color)", fontSize: "1.8rem", fontWeight: 800, lineHeight: 1 }}>{date.getDate()}</p>
                          <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", textTransform: "uppercase" }}>{date.toLocaleString("es", { month: "short" })}</p>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
                            <span style={{ fontSize: "1rem" }}>{EVENT_ICONS[ev.type] || "📅"}</span>
                            <span style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: "99px", background: "rgba(99,102,241,0.15)", color: "#a5b4fc", fontWeight: 700 }}>{ev.type}</span>
                          </div>
                          <h3 style={{ color: "white", fontSize: "1rem", fontWeight: 700, marginBottom: "6px" }}>{ev.title}</h3>
                          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "8px" }}>⛪ {ev.church.name}</p>
                          {ev.description && (
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                              {ev.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ textAlign: "center", marginTop: "40px" }}>
              <Link href="/maps" className="btn-secondary">Ver todas las iglesias en el mapa →</Link>
            </div>
          </div>
        </section>

        {/* ─── CONTACTO ─── */}
        <section id="contacto" className="section" style={{ paddingBottom: "120px" }}>
          <div className="container" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <p style={{ color: "var(--secondary-color)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.85rem", marginBottom: "12px" }}>¿Tenés una iglesia?</p>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", marginBottom: "15px", textAlign: "center" }}>
              Sumarate a <span className="text-gradient">Holyfind</span>
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "50px", textAlign: "center", maxWidth: "500px" }}>
              Registrá tu iglesia o congregación para que miles de personas puedan encontrarla en el mapa y seguir sus eventos.
            </p>
            <div style={{ maxWidth: "600px", width: "100%" }}>
              <ContactForm />
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
            <Link href="/" className="logo" style={{ fontSize: "1.4rem" }}>
              <span className="text-gradient">Holyfind</span>
            </Link>
            <div style={{ display: "flex", gap: "24px" }}>
              <Link href="/maps" className="nav-link" style={{ fontSize: "0.9rem" }}>Mapa Público</Link>
              <Link href="/admin/maps" className="nav-link" style={{ fontSize: "0.9rem" }}>Admin</Link>
              <Link href="/service/access/maps/admin" className="nav-link" style={{ fontSize: "0.9rem" }}>Portal Cliente</Link>
            </div>
          </div>
          <p style={{ marginTop: "30px", fontSize: "0.85rem" }}>© {new Date().getFullYear()} Holyfind. Todos los derechos reservados.</p>
        </div>
      </footer>
    </>
  );
}
