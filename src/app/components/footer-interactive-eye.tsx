"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";

const ZEN_PILLS = [
  { icon: "⏱️", label: "25m Fokus", delay: "0s" },
  { icon: "🧘", label: "Zen Flow", delay: "1.2s" },
  { icon: "⚡", label: "Deep Work", delay: "2.4s" },
  { icon: "🎯", label: "Anti Distraksi", delay: "3.6s" },
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

    // Subtle max tilt of ±14 degrees for high-end feel
    setTilt({
      x: -deltaY * 12,
      y: deltaX * 12,
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
      "✦ Fokus Adalah Kekuatan Supermu ✦",
      "✦ 25 Menit Yang Berharga Hari Ini ✦",
      "✦ Ritme Kerja Tenang Tanpa Beban ✦",
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

        {/* Orbiting Balanced Zen Feature Pills */}
        <div className="footer-zen-orbit" aria-hidden="true">
          {ZEN_PILLS.map((pill, idx) => (
            <span
              key={pill.label}
              className={`footer-zen-orbit-pill pill-pos-${idx + 1}`}
              style={{ animationDelay: pill.delay }}
            >
              <span className="zen-orbit-icon">{pill.icon}</span>
              <span className="zen-orbit-label">{pill.label}</span>
            </span>
          ))}
        </div>

        {/* 3D Interactive Center Focus Eye Sphere */}
        <div
          className="footer-zen-eye-core"
          style={{
            transform: tilt.active
              ? `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.06, 1.06, 1.06)`
              : "perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
          }}
        >
          {/* Specular Light Reflection Ring */}
          <div className="zen-eye-specular" />

          {/* BiarFokus Iris Logo Emblem */}
          <div className="zen-eye-iris">
            <Image
              src="/biarfokus-icon.png"
              alt="BiarFokus Focus Eye"
              width={56}
              height={56}
              className="zen-eye-icon-img"
              priority={false}
            />
            {/* Pupil Center Light dot */}
            <div
              className="zen-eye-pupil"
              style={{
                transform: tilt.active
                  ? `translate(${tilt.y * 0.4}px, ${-tilt.x * 0.4}px)`
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
            <span className="zen-sparkle-icon">✦</span> Sentuh &amp; rasakan ruang fokus tenang
          </span>
        )}
      </div>
    </div>
  );
}
