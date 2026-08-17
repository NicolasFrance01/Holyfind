"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/admin/maps"); // Default redirect, can be handled based on role later
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-gradient-start)" }}>
      <div className="glass-panel" style={{ width: "100%", maxWidth: "450px", padding: "40px" }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <Link href="/" className="logo" style={{ justifyContent: "center", fontSize: "2rem", marginBottom: "10px" }}>
            <span className="text-gradient">Holyfind</span>
          </Link>
          <h2 style={{ color: "white", fontSize: "1.5rem" }}>Iniciar Sesión</h2>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", color: "#ef4444", padding: "10px", borderRadius: "8px", marginBottom: "20px", textAlign: "center" }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email o Usuario</label>
            <input 
              type="text" 
              required 
              className="form-input" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com o master"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input 
              type="password" 
              required 
              className="form-input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "10px" }} disabled={loading}>
            {loading ? "Ingresando..." : "Entrar al Sistema"}
          </button>
        </form>
        
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <Link href="/" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem" }}>
            &larr; Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
