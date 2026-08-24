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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError(ERROR_MESSAGES.CredentialsSignin);
      setLoading(false);
    } else {
      // Fetch session to know the role and redirect accordingly
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
  };

  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-gradient-start)" }}>
      <div className="glass-panel" style={{ width: "90%", maxWidth: "420px", padding: "30px" }}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span className="text-gradient" style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "1.8rem" }}>Holyfind</span>
          </Link>
          <h2 style={{ color: "white", fontSize: "1.3rem", marginTop: "8px" }}>Iniciar Sesión</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "4px" }}>
            Ingresá a tu cuenta
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

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="text"
              required
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ingresa tu email o usuario"
              autoComplete="email"
            />
          </div>

          <div className="form-group" style={{ marginTop: "12px" }}>
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              required
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: "100%", marginTop: "20px", padding: "12px", fontSize: "0.95rem" }}
            disabled={loading}
          >
            {loading ? "Ingresando..." : "Entrar al Sistema"}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "20px 0" }}>
          <div style={{ height: "1px", background: "var(--border)", flex: 1 }}></div>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600 }}>USUARIOS COMUNES</span>
          <div style={{ height: "1px", background: "var(--border)", flex: 1 }}></div>
        </div>

        <button 
          onClick={() => { setLoading(true); signIn("google"); }}
          style={{ width: "100%", padding: "12px", fontSize: "0.95rem", borderRadius: "12px", border: "1px solid var(--border)", background: "white", color: "#334155", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", transition: "background 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
          onMouseLeave={e => e.currentTarget.style.background = "white"}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continuar con Google
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
