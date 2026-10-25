"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";

const FEATURE_ORBITS = [
  {
    id: "pomodoro",
    label: "Pomodoro Timer",
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.12)",
    delay: "0s",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l2.5 2.5" />
        <path d="M10 2h4" />
        <path d="M18.5 5.5l1.5-1.5" />
      </svg>
    ),
  },
  {
    id: "calendar",
    label: "Time-Blocking",
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.12)",
    delay: "1.1s",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="3" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: "kanban",
    label: "Project Kanban",
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.12)",
    delay: "2.2s",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="5" height="18" rx="1.5" />
        <rect x="10" y="3" width="5" height="12" rx="1.5" />
        <rect x="17" y="3" width="5" height="15" rx="1.5" />
      </svg>
    ),
  },
  {
    id: "notes",
    label: "Catatan Cepat",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.12)",
    delay: "3.3s",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
      </svg>
    ),
  },
];

export function FooterInteractiveEye() {
  const [tilt, setTilt] = useState({ x: 0, y: 0, active: false });
  const [clicked, setClicked] = useState(false);
  const [sparkleMessage, setSparkleMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) / (rect.width / 2);
    const deltaY = (e.clientY - centerY) / (rect.height / 2);

    setTilt({
      x: -deltaY * 14,
      y: deltaX * 14,
      active: true,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0, active: false });
  }, []);

  const handleClick = useCallback(() => {
    setClicked(true);
    const messages = [
      "✦ Tetap Tenang, Selesaikan Satu Hal ✦",
      "✦ Fokus Adalah Kekuatan Terbesarmu ✦",
      "✦ 25 Menit Yang Berharga Hari Ini ✦",
      "✦ Ritme Kerja Rapi Tanpa Gangguan ✦",
    ];
    const msg = messages[Math.floor(Math.random() * messages.length)];
    setSparkleMessage(msg);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setClicked(false);
      setSparkleMessage(null);
    }, 2800);
  }, []);

  return (
    <div className="footer-zen-interactive-wrap">
      <div
        ref={containerRef}
        className={`footer-zen-stage ${tilt.active ? "is-hovered" : ""} ${clicked ? "is-clicked" : ""}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label="Interaksi Zen Fokus BiarFokus"
        title="Ketuk atau gerakkan mouse untuk fokus interaktif"
      >
        {/* Hypnotic Looping Concentric Zen Ripples */}
        <div className="footer-zen-ripple ripple-1" aria-hidden="true" />
        <div className="footer-zen-ripple ripple-2" aria-hidden="true" />
        <div className="footer-zen-ripple ripple-3" aria-hidden="true" />

        {/* Orbiting Balanced Zen Feature Pills with Rich Crisp SVG Icons */}
        <div className="footer-zen-orbit" aria-hidden="true">
          {FEATURE_ORBITS.map((pill, idx) => (
            <span
              key={pill.id}
              className={`footer-zen-orbit-pill pill-pos-${idx + 1}`}
              style={{
                animationDelay: pill.delay,
                color: pill.color,
                borderColor: `color-mix(in srgb, ${pill.color} 30%, transparent)`,
              }}
            >
              <span className="zen-orbit-icon-wrap" style={{ background: pill.bg }}>
                {pill.icon}
              </span>
              <span className="zen-orbit-label">{pill.label}</span>
            </span>
          ))}
        </div>

        {/* 3D Interactive Center Focus Eye Sphere - 100% Perfectly Rounded Circle */}
        <div
          className="footer-zen-eye-core"
          style={{
            transform: tilt.active
              ? `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.08, 1.08, 1.08)`
              : "perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
          }}
        >
          {/* Specular Light Reflection Ring */}
          <div className="zen-eye-specular" />

          {/* BiarFokus Iris Logo Emblem - Full Circular Masking */}
          <div className="zen-eye-iris-circle">
            <Image
              src="/biarfokus-icon.png"
              alt="BiarFokus Logo"
              width={68}
              height={68}
              className="zen-eye-icon-img"
              priority={false}
            />
            {/* Pupil Center Light dot */}
            <div
              className="zen-eye-pupil"
              style={{
                transform: tilt.active
                  ? `translate(${tilt.y * 0.45}px, ${-tilt.x * 0.45}px)`
                  : "translate(0, 0)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Motivational Zen Interactive Message on click */}
      <div className="footer-zen-caption">
        {sparkleMessage ? (
          <span className="footer-zen-sparkle-text">{sparkleMessage}</span>
        ) : (
          <span className="footer-zen-subtle-hint">
            <span className="zen-sparkle-icon">✦</span> Sentuh &amp; rasakan ketenangan ekosistem fokus
          </span>
        )}
      </div>
    </div>
  );
}
