"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="navbar-inner">
        <Link href="/" className="logo">
          <span className="text-holy">⦿</span>
          <span>HOLYFIND</span>
        </Link>

        <div className="nav-links">
          <a href="#comunidad" className="nav-link">Explorar</a>
          <a href="#iglesias" className="nav-link">Para Iglesias</a>
          <a href="#como-funciona" className="nav-link">Cómo funciona</a>
          <Link href="/maps" className="btn-primary" style={{ padding: "8px 20px", fontSize: "0.875rem" }}>
            Abrir HolyFind ↗
          </Link>
        </div>
      </div>
    </nav>
  );
}
