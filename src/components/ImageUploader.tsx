"use client";

import { useState, useRef, useCallback } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/cropImage";

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

  // Cropper states
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const sizes = { small: 60, medium: 100, large: 140 };
  const px = sizes[size];
  const borderRadius = shape === "circle" ? "50%" : "14px";

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    // Load file for cropping
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageSrc(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // reset input so the same file can be selected again if needed
    e.target.value = "";
  };

  const handleApplyCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setUploading(true);
      
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, 0);
      if (!croppedBlob) throw new Error("Error al recortar la imagen");

      // Hide cropper immediately and show local preview
      const previewUrl = URL.createObjectURL(croppedBlob);
      setPreview(previewUrl);
      setImageSrc(null); // Close modal

      const formData = new FormData();
      formData.append("file", croppedBlob, "profile.jpg");
      formData.append("folder", folder);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al subir");
        setUploading(false);
        return;
      }

      onUploaded(data.url);
    } catch (e) {
      console.error(e);
      setError("Error al procesar o subir la imagen");
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
            <div style={{ color: "white", fontSize: "0.75rem", fontWeight: 700 }}>Subiendo...</div>
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

      {/* Cropper Modal */}
      {imageSrc && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.9)", zIndex: 9999,
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape={shape === "circle" ? "round" : "rect"}
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          <div style={{ padding: "20px", background: "#050708", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px" }}>
            <div style={{ display: "flex", gap: "15px", alignItems: "center", flex: 1 }}>
              <span style={{ color: "white", fontSize: "0.9rem" }}>Zoom:</span>
              <input 
                type="range" 
                min={1} max={3} step={0.1} 
                value={zoom} 
                onChange={(e) => setZoom(Number(e.target.value))} 
                style={{ flex: 1, maxWidth: "200px" }}
              />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button 
                type="button"
                className="btn-secondary" 
                style={{ padding: "8px 16px" }}
                onClick={() => setImageSrc(null)}
                disabled={uploading}
              >
                Cancelar
              </button>
              <button 
                type="button"
                className="btn-primary" 
                style={{ padding: "8px 16px" }}
                onClick={handleApplyCrop}
                disabled={uploading}
              >
                {uploading ? "Recortando..." : "Aplicar y Subir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
