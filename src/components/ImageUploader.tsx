"use client";

import { useState, useRef } from "react";

interface ImageUploaderProps {
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
  folder?: string;
  placeholder?: string;
  size?: "small" | "medium" | "large";
  shape?: "circle" | "square";
}

export default function ImageUploader({
  currentUrl,
  onUploaded,
  folder = "uploads",
  placeholder = "Subir imagen",
  size = "medium",
  shape = "square",
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sizes = { small: 60, medium: 100, large: 140 };
  const px = sizes[size];
  const borderRadius = shape === "circle" ? "50%" : "14px";

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);

    // Local preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al subir");
        setUploading(false);
        return;
      }

      onUploaded(data.url);
    } catch {
      setError("Error de red al subir");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "8px" }}>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          width: px, height: px, borderRadius,
          border: "2px dashed var(--glass-border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: uploading ? "default" : "pointer",
          overflow: "hidden", position: "relative",
          background: "rgba(255,255,255,0.04)",
          transition: "border-color 0.2s",
        }}
        onMouseEnter={e => { if (!uploading) (e.currentTarget as HTMLElement).style.borderColor = "#6366f1"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--glass-border)"; }}
      >
        {preview ? (
          <>
            <img src={preview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{
              position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: 0, transition: "opacity 0.2s",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "0"; }}
            >
              <span style={{ color: "white", fontSize: "0.75rem", fontWeight: 600 }}>Cambiar</span>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "8px" }}>
            {uploading ? (
              <div style={{ color: "#6366f1", fontSize: "0.75rem" }}>Subiendo...</div>
            ) : (
              <>
                <div style={{ fontSize: px > 80 ? "1.8rem" : "1.2rem", marginBottom: "4px" }}>📷</div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.7rem", lineHeight: "1.3" }}>{placeholder}</div>
              </>
            )}
          </div>
        )}
        {uploading && (
          <div style={{
            position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <div style={{ color: "white", fontSize: "0.75rem" }}>Subiendo...</div>
          </div>
        )}
      </div>

      {error && <p style={{ color: "#ef4444", fontSize: "0.75rem", margin: 0 }}>{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFile}
      />
    </div>
  );
}
