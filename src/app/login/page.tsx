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

  // Show friendly error from URL param (e.g. ?error=OAuthSignin)
  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError) {
      setError(ERROR_MESSAGES[urlError] || ERROR_MESSAGES.default);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isRegistering) {
      // Handle Registration
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email: email.toLowerCase(), password, dni, phone, recoveryEmail })
        });
        const data = await res.json();
        
        if (!res.ok) {
          setError(`❌ ${data.error || "Error al crear la cuenta."}`);
          setLoading(false);
          return;
        }
        
        setSuccessMsg("✅ ¡Cuenta creada exitosamente! Revisa tu correo electrónico.");
        // Switch back to login form
        setIsRegistering(false);
        setLoading(false);
      } catch (err) {
        setError("⚠️ Ocurrió un error de red al crear la cuenta.");
        setLoading(false);
      }
    } else {
      // Handle Login
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError(ERROR_MESSAGES.CredentialsSignin);
        setLoading(false);
      } else {
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        const role = sessionData?.user?.role;

        if (role === "SUPERADMIN") {
          router.push("/admin/maps");
        } else if (role === "CLIENT") {
          router.push("/churchdashboard");
        } else {
          router.push("/dashboard");
        }
      }
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-gradient-start)" }}>
      <div className="glass-panel" style={{ width: "90%", maxWidth: "420px", padding: "30px" }}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span className="text-gradient" style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "1.8rem" }}>Holyfind</span>
          </Link>
          <h2 style={{ color: "white", fontSize: "1.3rem", marginTop: "8px" }}>
            {isRegistering ? "Crear Nueva Cuenta" : "Iniciar Sesión"}
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "4px" }}>
            {isRegistering ? "Unite a Holyfind" : "Ingresá a tu cuenta"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: error.startsWith("⚠️") ? "rgba(251,191,36,0.1)" : "rgba(239, 68, 68, 0.1)",
              border: `1px solid ${error.startsWith("⚠️") ? "#fbbf24" : "#ef4444"}`,
              color: error.startsWith("⚠️") ? "#fbbf24" : "#ef4444",
              padding: "12px 16px", borderRadius: "10px", marginBottom: "20px",
              fontSize: "0.9rem", lineHeight: "1.4"
            }}>
              {error}
            </div>
          )}

          {successMsg && (
            <div style={{
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid #10b981",
              color: "#10b981",
              padding: "12px 16px", borderRadius: "10px", marginBottom: "20px",
              fontSize: "0.9rem", lineHeight: "1.4"
            }}>
              {successMsg}
            </div>
          )}

          {isRegistering && (
            <>
              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label className="form-label">Nombre Completo</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  autoComplete="name"
                />
              </div>

              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label className="form-label">Teléfono (opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej: +54 9 11 1234 5678"
                  autoComplete="tel"
                />
              </div>

              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label className="form-label">Email de recuperación (opcional)</label>
                <input
                  type="email"
                  className="form-input"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value.trim())}
                  placeholder="Ej: otro@email.com"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="text"
              required
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              placeholder="Ingresa tu email o usuario"
              autoComplete="email"
            />
          </div>

          {isRegistering && (
            <div className="form-group" style={{ marginTop: "12px" }}>
              <label className="form-label">DNI</label>
              <input
                type="text"
                required
                className="form-input"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="Sin puntos ni espacios"
              />
            </div>
          )}

          <div className="form-group" style={{ marginTop: "12px" }}>
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              required
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={isRegistering ? "new-password" : "current-password"}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: "100%", marginTop: "20px", padding: "12px", fontSize: "0.95rem" }}
            disabled={loading}
          >
            {loading ? "Procesando..." : (isRegistering ? "Crear Cuenta" : "Entrar al Sistema")}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "20px 0" }}>
          <div style={{ height: "1px", background: "var(--border)", flex: 1 }}></div>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600 }}>USUARIOS COMUNES</span>
          <div style={{ height: "1px", background: "var(--border)", flex: 1 }}></div>
        </div>

        <button 
          onClick={() => {
            setIsRegistering(!isRegistering);
            setError("");
            setSuccessMsg("");
          }}
          type="button"
          style={{ width: "100%", padding: "12px", fontSize: "0.95rem", borderRadius: "12px", border: "1px solid var(--border)", background: "white", color: "#334155", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", transition: "background 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
          onMouseLeave={e => e.currentTarget.style.background = "white"}
        >
          {isRegistering ? "Volver al Login" : "Crear Nueva Cuenta"}
        </button>

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <Link href="/" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.85rem" }}>
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
