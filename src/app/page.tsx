import Link from "next/link";
import ContactForm from "@/components/ContactForm";

export default function LandingPage() {
  return (
    <>
      <nav className="navbar">
        <div className="container navbar-container">
          <Link href="/" className="logo">
            <span className="text-gradient">Holyfind</span>
          </Link>
          <div className="nav-links">
            <Link href="#mision" className="nav-link">Misión</Link>
            <Link href="#funcionalidades" className="nav-link">Funcionalidades</Link>
            <Link href="#contacto" className="nav-link">Sumar Iglesia</Link>
            <Link href="/maps" className="btn-primary" style={{ padding: "8px 24px" }}>Ver Mapa</Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="section" style={{ minHeight: "100vh", display: "flex", alignItems: "center", paddingTop: "100px" }}>
          <div className="container" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "40px" }}>
            <div style={{ flex: "1 1 500px" }} className="animate-fade-in">
              <h1 style={{ fontSize: "4rem", marginBottom: "20px" }}>
                Encuentra tu lugar de <span className="text-gradient">Paz y Fe</span>
              </h1>
              <p style={{ fontSize: "1.2rem", color: "var(--text-secondary)", marginBottom: "40px", maxWidth: "600px" }}>
                “Si no podés ir a tu iglesia, dejá que la fe te guíe desde donde estés.” Holyfind conecta a la comunidad con iglesias en todo el mundo a través de un mapa interactivo y moderno.
              </p>
              <div style={{ display: "flex", gap: "20px" }}>
                <Link href="/maps" className="btn-primary">Explorar Mapa Público</Link>
                <Link href="#contacto" className="btn-secondary">Unirse como Iglesia</Link>
              </div>
            </div>
            
            <div style={{ flex: "1 1 400px", position: "relative" }} className="animate-float">
              {/* Abstract Graphic / Glass Card */}
              <div className="glass-panel" style={{ height: "400px", width: "100%", borderRadius: "40px", background: "linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(236,72,153,0.2) 100%)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: "20%", left: "10%", width: "100px", height: "100px", background: "var(--primary-color)", borderRadius: "50%", filter: "blur(40px)" }}></div>
                <div style={{ position: "absolute", bottom: "20%", right: "10%", width: "150px", height: "150px", background: "var(--secondary-color)", borderRadius: "50%", filter: "blur(60px)" }}></div>
                
                <div style={{ position: "absolute", inset: "0", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "15px" }}>
                  <div style={{ width: "60px", height: "60px", background: "white", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  </div>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: "600", color: "white" }}>Ubicación Global</h3>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Misión y Objetivos */}
        <section id="mision" className="section" style={{ background: "rgba(0,0,0,0.2)" }}>
          <div className="container" style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: "3rem", marginBottom: "30px" }}>Nuestra <span className="text-gradient">Misión</span></h2>
            <p style={{ fontSize: "1.2rem", color: "var(--text-secondary)", maxWidth: "800px", margin: "0 auto", lineHeight: "1.8" }}>
              Nuestra misión es hacer que la fe sea accesible para todos, en cualquier lugar. Holyfind no es solo un mapa, es una herramienta para mantener conectada a la comunidad con sus líderes espirituales y espacios de adoración, facilitando el descubrimiento y el acceso seguro.
            </p>
          </div>
        </section>

        {/* Funcionalidades */}
        <section id="funcionalidades" className="section">
          <div className="container">
            <h2 style={{ fontSize: "3rem", textAlign: "center", marginBottom: "60px" }}>Descubre las <span className="text-gradient">Funcionalidades</span></h2>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "30px" }}>
              <div className="glass-panel" style={{ padding: "40px", textAlign: "center" }}>
                <h3 style={{ fontSize: "1.5rem", marginBottom: "15px", color: "var(--primary-color)" }}>Mapa Interactivo</h3>
                <p style={{ color: "var(--text-secondary)" }}>Explora iglesias cercanas utilizando nuestro mapa público gratuito impulsado por OpenStreetMap.</p>
              </div>
              <div className="glass-panel" style={{ padding: "40px", textAlign: "center" }}>
                <h3 style={{ fontSize: "1.5rem", marginBottom: "15px", color: "var(--secondary-color)" }}>Gestión Personalizada</h3>
                <p style={{ color: "var(--text-secondary)" }}>Los líderes eclesiásticos pueden administrar la información de su iglesia a través de paneles exclusivos.</p>
              </div>
              <div className="glass-panel" style={{ padding: "40px", textAlign: "center" }}>
                <h3 style={{ fontSize: "1.5rem", marginBottom: "15px", color: "var(--accent-color)" }}>Seguridad y Control</h3>
                <p style={{ color: "var(--text-secondary)" }}>Un robusto sistema de roles garantiza que solo personal autorizado modifique datos e imágenes en tiempo real.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contacto / Sumar Iglesia */}
        <section id="contacto" className="section" style={{ paddingBottom: "120px" }}>
          <div className="container" style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ maxWidth: "600px", width: "100%" }}>
              <ContactForm />
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Holyfind. Todos los derechos reservados.</p>
          <div style={{ marginTop: "20px", display: "flex", justifyContent: "center", gap: "20px" }}>
            <Link href="/admin/maps" className="nav-link" style={{ fontSize: "0.9rem" }}>Acceso Administrador</Link>
            <Link href="/service/access/maps/admin" className="nav-link" style={{ fontSize: "0.9rem" }}>Acceso Cliente</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
