"use client";

import { useEffect, useRef } from "react";

export default function HeroGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const dots: { x: number; y: number; r: number; speed: number; opacity: number; delay: number }[] = [];

    // Create dots representing churches around the world
    for (let i = 0; i < 120; i++) {
      dots.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2.5 + 0.5,
        speed: Math.random() * 0.5 + 0.1,
        opacity: Math.random() * 0.7 + 0.1,
        delay: Math.random() * Math.PI * 2,
      });
    }

    let frame = 0;
    let animId: number;

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connecting lines between nearby dots
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.12;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(124, 231, 172, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw dots
      dots.forEach((dot) => {
        const pulse = Math.sin(frame * dot.speed * 0.05 + dot.delay);
        const currentOpacity = dot.opacity * (0.5 + 0.5 * pulse);
        const currentR = dot.r * (0.8 + 0.2 * pulse);

        // Glow
        const gradient = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, currentR * 4);
        gradient.addColorStop(0, `rgba(124, 231, 172, ${currentOpacity})`);
        gradient.addColorStop(1, "rgba(124, 231, 172, 0)");
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, currentR * 4, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, currentR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(124, 231, 172, ${currentOpacity + 0.2})`;
        ctx.fill();
      });

      frame++;
      animId = requestAnimationFrame(draw);
    }

    draw();

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity: 0.7,
      }}
    />
  );
}
