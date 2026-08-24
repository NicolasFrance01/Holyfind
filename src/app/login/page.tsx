"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin:        "⚠️ El inicio de sesión con Google no está disponible aún. Usá email y contraseña.",
  OAuthCallback:      "⚠️ Error al conectar con Google. Usá email y contraseña.",
  OAuthCreateAccount: "⚠️ No se pudo crear la cuenta con Google.",
  Callback:           "⚠️ Error de autenticación. Intentá de nuevo.",
  CredentialsSignin:  "❌ Email o contraseña incorrectos.",
  default:            "⚠️ Ocurrió un error. Intentá de nuevo.",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [dni, setDni] = useState("");
  const [phone, setPhone] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError) setError(ERROR_MESSAGES[urlError] || ERROR_MESSAGES.default);
    const signup = searchParams.get("signup");
    if (signup === "true") setIsRegistering(true);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isRegistering) {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email: email.toLowerCase(), password, dni, phone, recoveryEmail })
        });
        const data = await res.json();
        if (!res.ok) { setError(`❌ ${data.error || "Error al crear la cuenta."}`); setLoading(false); return; }
        setSuccessMsg("✅ ¡Cuenta creada exitosamente! Revisá tu correo electrónico.");
        setIsRegistering(false);
        setLoading(false);
      } catch {
        setError("⚠️ Ocurrió un error de red al crear la cuenta.");
        setLoading(false);
      }
    } else {
      const result = await signIn("credentials", { redirect: false, email, password });
      if (result?.error) {
        setError(ERROR_MESSAGES.CredentialsSignin);
        setLoading(false);
      } else {
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        const role = sessionData?.user?.role;
        if (role === "SUPERADMIN") router.push("/admin/maps");
        else if (role === "CLIENT") router.push("/churchdashboard");
        else router.push("/dashboard");
      }
    }
  };

  const panelStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: "460px",
    background: "rgba(8, 12, 24, 0.94)",
    border: "1px solid rgba(99,102,241,0.3)",
    borderRadius: "24px",
    boxShadow: "0 25px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)",
    padding: "36px 32px",
    backdropFilter: "blur(24px)",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-gradient-start)", padding: "20px" }}>
      <div style={panelStyle}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span className="text-gradient" style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "2rem" }}>Holyfind</span>
          </Link>
          <h2 style={{ color: "white", fontSize: "1.25rem", fontWeight: 700, marginTop: "10px", marginBottom: "4px" }}>
            {isRegistering ? "✨ Crear Nueva Cuenta" : "👋 Bienvenido de vuelta"}
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            {isRegistering ? "Completá tus datos para unirte a Holyfind" : "Ingresá a tu cuenta"}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{
            background: error.startsWith("⚠️") ? "rgba(251,191,36,0.1)" : "rgba(239,68,68,0.1)",
            border: `1px solid ${error.startsWith("⚠️") ? "#fbbf24" : "#ef4444"}`,
            color: error.startsWith("⚠️") ? "#fbbf24" : "#ef4444",
            padding: "12px 16px", borderRadius: "12px", marginBottom: "20px", fontSize: "0.85rem", lineHeight: "1.5"
          }}>
            {error}
          </div>
        )}
        {successMsg && (
          <div style={{
            background: "rgba(16,185,129,0.15)", border: "1px solid #10b981", color: "#10b981",
            padding: "12px 16px", borderRadius: "12px", marginBottom: "20px", fontSize: "0.85rem"
          }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Registration extra fields */}
          {isRegistering && (
            <>
              <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: "6px" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.71rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Información Personal</p>
              </div>
              <div className="form-group">
                <label className="form-label">Nombre Completo *</label>
                <input type="text" required className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Juan Pérez" autoComplete="name" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="form-group">
                  <label className="form-label">Teléfono <span style={{ color: "var(--text-secondary)", fontWeight: 400, fontSize: "0.75rem" }}>(opcional)</span></label>
                  <input type="text" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+54 9 11..." autoComplete="tel" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email de recuperación <span style={{ color: "var(--text-secondary)", fontWeight: 400, fontSize: "0.75rem" }}>(opcional)</span></label>
                  <input type="email" className="form-input" value={recoveryEmail} onChange={e => setRecoveryEmail(e.target.value.trim())} placeholder="otro@email.com" />
                </div>
              </div>
            </>
          )}

          {/* Credentials section */}
          <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: "6px" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.71rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
              {isRegistering ? "Credenciales de Acceso" : "Acceso"}
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Email *</label>
            <input type="text" required className="form-input" value={email} onChange={e => setEmail(e.target.value.trim())} placeholder="tu@email.com" autoComplete="email" />
          </div>

          {isRegistering && (
            <div className="form-group">
              <label className="form-label">DNI *</label>
              <input type="text" required className="form-input" value={dni} onChange={e => setDni(e.target.value)} placeholder="Sin puntos ni espacios" />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Contraseña *</label>
            <input type="password" required className="form-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete={isRegistering ? "new-password" : "current-password"} />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: "100%", marginTop: "4px", padding: "13px", fontSize: "0.95rem", fontWeight: 700, borderRadius: "12px" }}
            disabled={loading}
          >
            {loading ? "Procesando..." : (isRegistering ? "🚀 Crear Cuenta" : "🔑 Entrar al Sistema")}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "22px 0 16px" }}>
          <div style={{ height: "1px", background: "rgba(255,255,255,0.07)", flex: 1 }} />
          <span style={{ color: "var(--text-secondary)", fontSize: "0.71rem", fontWeight: 700, letterSpacing: "0.06em" }}>
            {isRegistering ? "¿YA TENÉS CUENTA?" : "¿PRIMERA VEZ?"}
          </span>
          <div style={{ height: "1px", background: "rgba(255,255,255,0.07)", flex: 1 }} />
        </div>

        <button
          onClick={() => { setIsRegistering(!isRegistering); setError(""); setSuccessMsg(""); }}
          type="button"
          style={{
            width: "100%", padding: "12px", fontSize: "0.9rem", borderRadius: "12px",
            border: "1px solid rgba(99,102,241,0.4)", background: "rgba(99,102,241,0.08)",
            color: "#818cf8", fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.18)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,102,241,0.08)"; }}
        >
          {isRegistering ? "← Volver al Login" : "✨ Crear Nueva Cuenta"}
        </button>

        <div style={{ textAlign: "center", marginTop: "18px" }}>
          <Link href="/" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.82rem" }}>
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ height: "100vh", background: "var(--bg-gradient-start)" }} />}>
      <LoginForm />
    </Suspense>
  );
}
