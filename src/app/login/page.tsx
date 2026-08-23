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
      } else {
        router.push("/dashboard");
      }
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-gradient-start)" }}>
      <div className="glass-panel" style={{ width: "100%", maxWidth: "450px", padding: "40px" }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span className="text-gradient" style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "2rem" }}>Holyfind</span>
          </Link>
          <h2 style={{ color: "white", fontSize: "1.4rem", marginTop: "8px" }}>Iniciar Sesión</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "4px" }}>
            Para gestores de iglesias y administradores
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
              type="email"
              required
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
            />
          </div>

          <div className="form-group" style={{ marginTop: "16px" }}>
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
            style={{ width: "100%", marginTop: "24px", padding: "14px", fontSize: "1rem" }}
            disabled={loading}
          >
            {loading ? "Ingresando..." : "Entrar al Sistema"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <Link href="/" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem" }}>
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
