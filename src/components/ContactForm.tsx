"use client";

import { useState } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      address: formData.get("address"),
      message: formData.get("message"),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setStatus("success");
        (e.target as HTMLFormElement).reset();
      } else {
        setStatus("error");
      }
    } catch (error) {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: "40px" }}>
      <h3 style={{ fontSize: "1.8rem", marginBottom: "20px" }}>Solicitar Acceso</h3>
      <p style={{ color: "var(--text-secondary)", marginBottom: "30px" }}>
        Completá tus datos y nos pondremos en contacto para integrar tu iglesia a la plataforma.
      </p>

      <div className="form-group">
        <label className="form-label" htmlFor="name">Nombre de la Iglesia</label>
        <input required type="text" id="name" name="name" className="form-input" placeholder="Ej: Parroquia San José" />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="address">Dirección / Ubicación</label>
        <input required type="text" id="address" name="address" className="form-input" placeholder="Ciudad, País o Dirección" />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="message">Comentarios o Información</label>
        <textarea required id="message" name="message" className="form-input" rows={4} placeholder="Contanos un poco sobre tu comunidad..."></textarea>
      </div>

      <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "10px" }} disabled={status === "loading"}>
        {status === "loading" ? "Enviando..." : "Enviar Solicitud"}
      </button>

      {status === "success" && (
        <p style={{ color: "#34d399", marginTop: "15px", textAlign: "center", fontWeight: "500" }}>
          ¡Solicitud enviada con éxito! Te contactaremos pronto.
        </p>
      )}
      {status === "error" && (
        <p style={{ color: "#ef4444", marginTop: "15px", textAlign: "center", fontWeight: "500" }}>
          Ocurrió un error. Por favor intentá de nuevo.
        </p>
      )}
    </form>
  );
}
