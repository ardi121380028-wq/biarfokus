"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";

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
        aria-label="Denyut Fokus Tenang BiarFokus"
        title="Ketuk untuk rasakan ketenangan fokus"
      >
        {/* Hypnotic Slow Gentle Ambient Ripples */}
        <div className="footer-zen-ripple ripple-1" aria-hidden="true" />
        <div className="footer-zen-ripple ripple-2" aria-hidden="true" />

        {/* 100% Perfectly Rounded Circle with Slow Breathing Pulse (Denyut Pelan) */}
        <div
          className="footer-zen-eye-core"
          style={{
            transform: tilt.active
              ? `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.08, 1.08, 1.08)`
              : undefined,
          }}
        >
          {/* Specular Light Reflection Ring */}
          <div className="zen-eye-specular" />

          {/* BiarFokus Iris Logo Emblem - Full Circular Masking */}
          <div className="zen-eye-iris-circle">
            <Image
              src="/biarfokus-icon.png"
              alt="BiarFokus Logo"
              width={62}
              height={62}
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
