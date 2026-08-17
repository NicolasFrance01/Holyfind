import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ContactForm from "@/components/ContactForm";
import LandingNavbar from "@/components/landing/LandingNavbar";
import HeroSection from "@/components/landing/HeroSection";
import HolyPulseOrb from "@/components/landing/HolyPulseOrb";
import MoreThanLocation from "@/components/landing/MoreThanLocation";

export const dynamic = "force-dynamic";

const EVENT_ICONS: Record<string, string> = {
  MISA: "🕯️", RETIRO: "⛰️", CONCIERTO: "🎶",
  CONFERENCIA: "🎤", BAUTISMO: "💧", BODA: "💒", OTRO: "📅",
};

const WORLD_STATS = [
  { flag: "🇦🇷", country: "Argentina", count: "2.431" },
  { flag: "🇧🇷", country: "Brasil", count: "4.218" },
  { flag: "🇲🇽", country: "México", count: "3.892" },
  { flag: "🇨🇱", country: "Chile", count: "1.847" },
  { flag: "🇺🇾", country: "Uruguay", count: "892" },
  { flag: "🇪🇸", country: "España", count: "1.204" },
];

async function getUpcomingEvents() {
  try {
    return await prisma.event.findMany({
      where: { isPublic: true, eventDate: { gte: new Date() } },
      orderBy: { eventDate: "asc" },
      take: 6,
      include: { church: { select: { name: true, type: true } } },
    });
  } catch { return []; }
}

export default async function LandingPage() {
  const events = await getUpcomingEvents();

  return (
    <>
      {/* SVG Gooey filter */}
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id="gooey-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" result="gooey" />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
        </defs>
      </svg>

      <LandingNavbar />
      <HeroSection />

      {/* ─── HOW IT WORKS ─── */}
      <section id="como-funciona" style={{ padding: "120px 0", background: "var(--surface)" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <div className="section-label" style={{ display: "inline-flex" }}>Cómo funciona</div>
          <h2 style={{ fontSize: "clamp(2.2rem, 4vw, 3.5rem)", marginBottom: "16px", marginTop: "4px" }}>
            Simple como <span className="text-holy">encontrar el camino</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", maxWidth: "500px", margin: "0 auto 80px", lineHeight: 1.8 }}>
            Sin registros, sin complicaciones. Holyfind funciona en tres pasos.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "2px" }}>
            {[
              { n: "01", icon: "📍", title: "Ingresá tu ubicación", desc: "Escribí tu ciudad o permitinos acceder a tu ubicación actual. También podés buscar cualquier lugar del mundo." },
              { n: "02", icon: "🗺️", title: "Explorá el mapa", desc: "Encontrás iglesias, congregaciones y comunidades cerca tuyo marcadas según su denominación." },
              { n: "03", icon: "⛪", title: "Conectate", desc: "Revisá información, horarios, eventos próximos y cómo llegar. Todo desde el mismo lugar." },
            ].map(({ n, icon, title, desc }, i) => (
              <div key={n} style={{
                background: "var(--bg)", padding: "48px 36px", textAlign: "left",
                borderRadius: i === 0 ? "var(--radius-lg) 0 0 var(--radius-lg)" : i === 2 ? "0 var(--radius-lg) var(--radius-lg) 0" : "0",
                border: "1px solid var(--border)",
                borderRight: i < 2 ? "none" : "1px solid var(--border)",
              }}>
                <p style={{ color: "var(--holy-green)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "20px" }}>{n}</p>
                <div style={{ fontSize: "2.5rem", marginBottom: "20px" }}>{icon}</div>
                <h3 style={{ fontSize: "1.15rem", marginBottom: "12px", fontWeight: 700 }}>{title}</h3>
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, fontSize: "0.9rem" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PULSE ORB ─── */}
      <section style={{ padding: "60px 0", background: "var(--bg)", textAlign: "center" }}>
        <div className="container">
          <div className="section-label" style={{ display: "inline-flex", marginBottom: "24px" }}>HolyFind Pulse</div>
          <HolyPulseOrb />
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", maxWidth: "360px", margin: "0 auto", lineHeight: 1.7 }}>
            Nuestra plataforma conecta personas con comunidades en tiempo real, alrededor del mundo.
          </p>
        </div>
      </section>

      {/* ─── MORE THAN LOCATION ─── */}
      <MoreThanLocation />

      {/* ─── EVENTS ─── */}
      <section id="eventos" style={{ padding: "120px 0", background: "var(--bg)" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px", marginBottom: "60px" }}>
            <div>
              <div className="section-label">Actividad en vivo</div>
              <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", marginTop: "8px" }}>
                Próximos <span className="serif" style={{ fontStyle: "italic", color: "var(--holy-green)" }}>eventos</span>
              </h2>
            </div>
            <Link href="/maps" className="btn-secondary">Ver todas →</Link>
          </div>

          {events.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 40px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)" }}>
              <p style={{ fontSize: "3rem", marginBottom: "16px" }}>📅</p>
              <h3 style={{ marginBottom: "8px" }}>Próximamente</h3>
              <p style={{ color: "var(--text-secondary)" }}>Las iglesias asociadas publicarán sus eventos aquí.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
              {events.map((ev: typeof events[number]) => {
                const date = new Date(ev.eventDate);
                return (
                  <div key={ev.id} className="feature-card" style={{
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)", padding: "24px",
                  }}>
                    <div style={{ display: "flex", gap: "16px" }}>
                      <div style={{ textAlign: "center", background: "rgba(124,231,172,0.06)", borderRadius: "12px", padding: "12px 16px", border: "1px solid rgba(124,231,172,0.12)", flexShrink: 0 }}>
                        <p style={{ color: "var(--holy-green)", fontSize: "1.8rem", fontWeight: 800, lineHeight: 1 }}>{date.getDate()}</p>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>{date.toLocaleString("es", { month: "short" })}</p>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
                          <span>{EVENT_ICONS[ev.type] || "📅"}</span>
                          <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: "99px", background: "rgba(124,231,172,0.08)", color: "var(--holy-green)", fontWeight: 700, border: "1px solid rgba(124,231,172,0.15)" }}>{ev.type}</span>
                        </div>
                        <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "4px" }}>{ev.title}</h3>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>⛪ {ev.church.name}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── WORLD MAP STATS ─── */}
      <section style={{ padding: "120px 0", background: "var(--surface)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <div className="section-label" style={{ display: "inline-flex" }}>Presencia global</div>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", marginTop: "8px" }}>
              Fe <span className="text-holy">alrededor del mundo</span>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
            {WORLD_STATS.map(({ flag, country, count }) => (
              <div key={country} className="feature-card" style={{
                background: "var(--bg)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)", padding: "24px 20px", textAlign: "center",
              }}>
                <p style={{ fontSize: "2rem", marginBottom: "8px" }}>{flag}</p>
                <p style={{ fontWeight: 700, fontSize: "1.5rem", color: "var(--holy-green)", letterSpacing: "-0.02em" }}>{count}</p>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "4px" }}>{country}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOR CHURCHES ─── */}
      <section id="iglesias" style={{ padding: "120px 0", background: "var(--bg)" }}>
        <div className="container" style={{ display: "flex", flexWrap: "wrap", gap: "80px", alignItems: "center" }}>
          <div style={{ flex: "1 1 400px" }}>
            <div className="section-label">Para comunidades</div>
            <h2 style={{ fontSize: "clamp(2.2rem, 4vw, 3.5rem)", marginTop: "8px", marginBottom: "24px" }}>
              ¿Tu comunidad<br />
              <span className="serif" style={{ fontStyle: "italic", color: "var(--holy-green)" }}>todavía no está aquí?</span>
            </h2>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: "40px", maxWidth: "460px" }}>
              Llevá tu iglesia al mapa de Holyfind. Administrá tu perfil, publicá eventos y conectate con personas que están buscando una comunidad.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[
                ["📝", "Administrá tu perfil", "Fotos, descripción, ubicación, horarios y contacto."],
                ["📅", "Publicá actividades", "Cultos, reuniones, retiros, estudios y eventos especiales."],
                ["✓", "HolyFind Verified", "Perfil verificado por el equipo de Holyfind para mayor confianza."],
              ].map(([icon, title, desc]) => (
                <div key={String(title)} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(124,231,172,0.08)", border: "1px solid rgba(124,231,172,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>{icon}</div>
                  <div>
                    <p style={{ fontWeight: 700, marginBottom: "4px", fontSize: "0.95rem" }}>{title}</p>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard mockup */}
          <div style={{ flex: "1 1 360px" }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", overflow: "hidden" }}>
              {/* Window bar */}
              <div style={{ padding: "14px 20px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "8px" }}>
                {["#ef4444", "#f59e0b", "#22c55e"].map((c) => <div key={c} style={{ width: "10px", height: "10px", borderRadius: "50%", background: c }} />)}
                <span style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginLeft: "8px" }}>holyfind.com/dashboard</span>
              </div>
              <div style={{ padding: "28px" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "20px" }}>Panel de tu iglesia</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
                  {[
                    { label: "Visitantes", val: "1.284", icon: "👥", color: "#7CE7AC" },
                    { label: "En el mapa", val: "4.829", icon: "📍", color: "#78A9FF" },
                    { label: "Favoritos", val: "247", icon: "❤️", color: "#f472b6" },
                    { label: "Eventos activos", val: "6", icon: "📅", color: "#FFF1C7" },
                  ].map(({ label, val, icon, color }) => (
                    <div key={label} style={{ background: "var(--bg)", borderRadius: "12px", padding: "16px", border: "1px solid var(--border)" }}>
                      <p style={{ fontSize: "1.1rem", marginBottom: "6px" }}>{icon}</p>
                      <p style={{ color, fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.04em" }}>{val}</p>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginTop: "2px" }}>{label}</p>
                    </div>
                  ))}
                </div>
                <div style={{ background: "var(--bg)", borderRadius: "12px", padding: "16px", border: "1px solid var(--border)" }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.78rem", marginBottom: "10px", fontWeight: 600 }}>Actividad reciente</p>
                  {[80, 55, 90, 40, 70, 60, 85].map((h, i) => (
                    <div key={i} style={{ display: "inline-block", width: "10%", marginRight: "2.5%", height: `${h * 0.4}px`, background: `rgba(124,231,172,${0.2 + h * 0.006})`, borderRadius: "3px", verticalAlign: "bottom" }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section style={{ padding: "120px 0", background: "var(--surface)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <div className="section-label" style={{ display: "inline-flex" }}>HolyFind Stories</div>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", marginTop: "8px" }}>
              Historias <span className="text-holy">reales</span>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
            {[
              { quote: "Llegué a Córdoba sin conocer a nadie. Holyfind me ayudó a encontrar una comunidad a seis cuadras de mi departamento.", name: "Martina G.", city: "Córdoba, Argentina" },
              { quote: "Personas que nunca habían conocido nuestra iglesia comenzaron a encontrarnos a través del mapa. El crecimiento fue notable.", name: "Pastor Rodrigo A.", city: "Rosario, Argentina" },
              { quote: "Lo que más me gustó es poder ver los eventos próximos directamente en el mapa. Ya no me pierdo nada de la comunidad.", name: "Alejandro V.", city: "Buenos Aires, Argentina" },
            ].map(({ quote, name, city }) => (
              <div key={name} className="testimonial-card">
                <p style={{ fontSize: "1.5rem", marginBottom: "20px", color: "var(--holy-green)" }}>"</p>
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.8, fontSize: "0.95rem", marginBottom: "24px" }}>{quote}</p>
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "20px" }}>
                  <p style={{ fontWeight: 700, fontSize: "0.9rem" }}>{name}</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section style={{ padding: "160px 0", background: "var(--bg)", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(124,231,172,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div className="container" style={{ position: "relative", zIndex: 2 }}>
          <p style={{ fontSize: "3rem", marginBottom: "24px" }}>⦿</p>
          <h2 style={{ fontSize: "clamp(2.5rem, 5vw, 5rem)", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: "20px", lineHeight: 1.05 }}>
            Hay miles de<br />
            <span className="serif" style={{ fontStyle: "italic", color: "var(--holy-green)" }}>comunidades.</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", marginBottom: "48px" }}>Encontrá la tuya.</p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/maps" className="btn-primary" style={{ fontSize: "1.05rem", padding: "14px 36px" }}>Explorar HolyFind →</Link>
            <a href="#iglesias" className="btn-secondary" style={{ fontSize: "1.05rem", padding: "14px 36px" }}>Registrar mi iglesia</a>
          </div>
        </div>
      </section>

      {/* ─── CONTACT ─── */}
      <section id="contacto" style={{ padding: "120px 0", background: "var(--surface)" }}>
        <div className="container" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div className="section-label" style={{ display: "inline-flex", marginBottom: "16px" }}>¿Tenés una iglesia?</div>
          <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", textAlign: "center", marginBottom: "12px" }}>Sumarate a <span className="text-holy">Holyfind</span></h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "50px", textAlign: "center", maxWidth: "480px", lineHeight: 1.7 }}>
            Registrá tu iglesia o congregación para que miles de personas puedan encontrarla en el mapa y seguir sus eventos.
          </p>
          <div style={{ maxWidth: "600px", width: "100%" }}>
            <ContactForm />
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="footer">
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "24px", marginBottom: "40px" }}>
            <Link href="/" className="logo"><span className="text-holy">⦿</span> HOLYFIND</Link>
            <div style={{ display: "flex", gap: "8px" }}>
              <Link href="/maps" className="btn-ghost">Explorar</Link>
              <Link href="/admin/maps" className="btn-ghost">Admin</Link>
              <Link href="/service/access/maps/admin" className="btn-ghost">Portal Iglesia</Link>
              <Link href="/login" className="btn-ghost">Ingresar</Link>
            </div>
          </div>
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "32px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>© {new Date().getFullYear()} Holyfind. Todos los derechos reservados.</p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Hecho con ❤️ para la comunidad</p>
          </div>
        </div>
      </footer>
    </>
  );
}
