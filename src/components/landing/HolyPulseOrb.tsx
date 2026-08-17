"use client";

import { useState, useEffect } from "react";

const STATES = [
  { label: "Buscando comunidades cerca tuyo...", color: "#7CE7AC" },
  { label: "Conectando con la comunidad...", color: "#78A9FF" },
  { label: "Encontrando iglesias...", color: "#31C97B" },
  { label: "Descubriendo tu lugar de fe...", color: "#FFF1C7" },
];

export default function HolyPulseOrb() {
  const [stateIdx, setStateIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStateIdx((i) => (i + 1) % STATES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const current = STATES[stateIdx];

  return (
    <div style={{ textAlign: "center", padding: "80px 0" }}>
      {/* The Orb */}
      <div style={{ position: "relative", display: "inline-block", marginBottom: "40px" }}>
        {/* Outer rings */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: `-${i * 28}px`,
              borderRadius: "50%",
              border: `1px solid ${current.color}`,
              opacity: 0.08 * (4 - i),
              animation: `orbPulse ${1.5 + i * 0.5}s ease-out infinite`,
              animationDelay: `${i * 0.3}s`,
              transition: "border-color 1s ease",
            }}
          />
        ))}

        {/* Inner orb */}
        <div style={{
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          background: `radial-gradient(circle at 35% 35%, ${current.color}33, ${current.color}08 60%, transparent)`,
          border: `1px solid ${current.color}44`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          transition: "all 1s ease",
          boxShadow: `0 0 40px ${current.color}20, inset 0 0 30px ${current.color}08`,
        }}>
          {/* Rotating ring */}
          <div style={{
            position: "absolute",
            inset: "10px",
            borderRadius: "50%",
            border: `1px dashed ${current.color}44`,
            animation: "orbRotate 8s linear infinite",
          }} />
          {/* Core */}
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: `radial-gradient(circle at 40% 40%, ${current.color}, ${current.color}66)`,
            boxShadow: `0 0 20px ${current.color}80`,
            animation: "pulse 2s ease-in-out infinite",
            transition: "all 1s ease",
          }} />
        </div>
      </div>

      {/* State label */}
      <div style={{
        display: "inline-block",
        padding: "8px 20px",
        background: `${current.color}10`,
        border: `1px solid ${current.color}25`,
        borderRadius: "99px",
        transition: "all 0.8s ease",
      }}>
        <p style={{ color: current.color, fontSize: "0.9rem", fontWeight: 500, transition: "color 1s ease" }}>
          {current.label}
        </p>
      </div>
    </div>
  );
}
