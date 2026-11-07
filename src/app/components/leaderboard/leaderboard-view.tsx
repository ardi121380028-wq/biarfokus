"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAppContext } from "@/app/providers/app-provider";
import { ProBadge } from "@/app/components/ui/pro-badge";
import { getSafeAvatarUrl } from "@/features/profile/profile-service";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  LEADERBOARD_PERIODS,
  formatFocusTime,
  getTierDetails,
} from "@/features/leaderboard/leaderboard-service";
import { useLeaderboard } from "@/features/leaderboard/use-leaderboard";
import type { LeaderboardEntry } from "@/types/domain";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "BF";
}

/* ------------------------------------------------------------------ */
/* Luxury Game-Grade 3D SVG Badges (Matching User Design Ref)         */
/* ------------------------------------------------------------------ */

function BronzeEmeraldCrest() {
  return (
    <svg width="58" height="58" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bronzeShieldGrad" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="40%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        <linearGradient id="emeraldInnerGrad" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <filter id="badgeShadow" x="0" y="2" width="64" height="62" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.35" />
        </filter>
      </defs>
      <g filter="url(#badgeShadow)">
        {/* Outer Pentagon Shield */}
        <path
          d="M32 4L54 14V32C54 45 44 55 32 60C20 55 10 45 10 32V14L32 4Z"
          fill="url(#bronzeShieldGrad)"
          stroke="#fef3c7"
          strokeWidth="1.5"
        />
        {/* Inner Facet Shield */}
        <path
          d="M32 10L47 18V31C47 41 39 49 32 53C25 49 17 41 17 31V18L32 10Z"
          fill="url(#emeraldInnerGrad)"
          stroke="#34d399"
          strokeWidth="1"
        />
        {/* Sprout Emblem with Golden Aura */}
        <path
          d="M32 42V25M32 25C32 20 23 19 23 27C23 32 30 33 32 33M32 25C32 20 41 19 41 27C41 32 34 33 32 33"
          stroke="#fef3c7"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="32" cy="18" r="2.5" fill="#fde68a" />
      </g>
    </svg>
  );
}

function SilverCobaltCrest() {
  return (
    <svg width="58" height="58" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="silverShieldGrad" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="45%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="cobaltInnerGrad" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="lightningGrad" x1="24" y1="14" x2="40" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#93c5fd" />
        </linearGradient>
      </defs>
      <g filter="url(#badgeShadow)">
        {/* Outer Silver Crest */}
        <path
          d="M32 4L54 14V32C54 45 44 55 32 60C20 55 10 45 10 32V14L32 4Z"
          fill="url(#silverShieldGrad)"
          stroke="#ffffff"
          strokeWidth="1.5"
        />
        {/* Inner Sapphire Blue Shield */}
        <path
          d="M32 10L47 18V31C47 41 39 49 32 53C25 49 17 41 17 31V18L32 10Z"
          fill="url(#cobaltInnerGrad)"
          stroke="#93c5fd"
          strokeWidth="1"
        />
        {/* 3D Lightning Bolt */}
        <path
          d="M34 16L24 31H33L30 46L41 29H32L34 16Z"
          fill="url(#lightningGrad)"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

function ImperialGoldCrest() {
  return (
    <svg width="58" height="58" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="goldOuterGrad" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="35%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="goldInnerGrad" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
      </defs>
      <g filter="url(#badgeShadow)">
        {/* Outer Golden Crest */}
        <path
          d="M32 4L54 14V32C54 45 44 55 32 60C20 55 10 45 10 32V14L32 4Z"
          fill="url(#goldOuterGrad)"
          stroke="#ffffff"
          strokeWidth="1.5"
        />
        {/* Inner Gold Shield */}
        <path
          d="M32 10L47 18V31C47 41 39 49 32 53C25 49 17 41 17 31V18L32 10Z"
          fill="url(#goldInnerGrad)"
          stroke="#fef08a"
          strokeWidth="1"
        />
        {/* Gold Trophy Chalice */}
        <path
          d="M24 20H40V28C40 33 36 37 32 37C28 37 24 33 24 28V20ZM32 37V44M26 44H38M20 22C18 22 17 24 17 26C17 29 20 31 24 31M44 22C46 22 47 24 47 26C47 29 44 31 40 31"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polygon points="32,15 33.5,18.5 37,18.5 34.2,20.8 35.2,24 32,22 28.8,24 29.8,20.8 27,18.5 30.5,18.5" fill="#ffffff" />
      </g>
    </svg>
  );
}

function DiamondAstralCrest() {
  return (
    <svg width="58" height="58" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="astralShieldGrad" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>
        <linearGradient id="diamondCoreGrad" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <g filter="url(#badgeShadow)">
        {/* Outer Astral Crest */}
        <path
          d="M32 4L54 14V32C54 45 44 55 32 60C20 55 10 45 10 32V14L32 4Z"
          fill="url(#astralShieldGrad)"
          stroke="#fdf4ff"
          strokeWidth="1.5"
        />
        {/* Inner Diamond Core Shield */}
        <path
          d="M32 10L47 18V31C47 41 39 49 32 53C25 49 17 41 17 31V18L32 10Z"
          fill="url(#diamondCoreGrad)"
          stroke="#a5f3fc"
          strokeWidth="1"
        />
        {/* Royal Crown Emblem with Gemstones */}
        <path
          d="M21 38L23 23L29 30L32 20L35 30L41 23L43 38H21Z"
          fill="#ffffff"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="23" cy="21" r="1.8" fill="#f43f5e" />
        <circle cx="32" cy="18" r="2.2" fill="#38bdf8" />
        <circle cx="41" cy="21" r="1.8" fill="#f43f5e" />
      </g>
    </svg>
  );
}

const LUXURY_LEAGUES = [
  {
    tier: "bronze",
    tag: "TIER I",
    title: "Bibit Fokus",
    sub: "0 – 3 Jam",
    renderCrest: () => <BronzeEmeraldCrest />,
  },
  {
    tier: "silver",
    tag: "TIER II",
    title: "Pejuang Konsisten",
    sub: "3 – 10 Jam",
    renderCrest: () => <SilverCobaltCrest />,
  },
  {
    tier: "gold",
    tag: "TIER III",
    title: "Master Deep Work",
    sub: "10 – 20 Jam",
    renderCrest: () => <ImperialGoldCrest />,
  },
  {
    tier: "legend",
    tag: "TIER IV",
    title: "Zen Legend",
    sub: "20+ Jam",
    renderCrest: () => <DiamondAstralCrest />,
  },
] as const;

function PodiumStep({
  entry,
  place,
  rankNumber,
}: {
  entry?: LeaderboardEntry;
  place: "rank-1" | "rank-2" | "rank-3";
  rankNumber: 1 | 2 | 3;
}) {
  if (!entry) return null;

  const safeAvatar = getSafeAvatarUrl(entry.avatarUrl);
  const initials = getInitials(entry.displayName);
  const tier = getTierDetails(entry.tier);

  return (
    <div className={`podium-column ${place}`}>
      <div className="podium-user-floater">
        <div className="podium-user-avatar-wrap">
          {rankNumber === 1 && <span className="podium-crown-icon">👑</span>}
          {safeAvatar ? (
            <Image
              src={safeAvatar}
              alt={entry.displayName}
              width={rankNumber === 1 ? 84 : 68}
              height={rankNumber === 1 ? 84 : 68}
              className="podium-img-avatar"
              unoptimized
            />
          ) : (
            <div className="podium-avatar-initials">{initials}</div>
          )}
        </div>

        <div className="podium-user-name" title={entry.displayName}>
          <span>{entry.displayName}</span>
          {entry.isPro && <ProBadge />}
          {entry.isCurrentUser && (
            <span
              style={{
                fontSize: "0.68rem",
                background: "#f59e0b",
                color: "#fff",
                padding: "1px 6px",
                borderRadius: "9999px",
                fontWeight: 800,
              }}
            >
              Kamu
            </span>
          )}
        </div>

        <div className="podium-user-time">{formatFocusTime(entry.totalMinutes)}</div>
        <div className="podium-user-poms">{entry.pomodoroCount} sesi 🍅</div>

        <div
          style={{
            fontSize: "0.72rem",
            fontWeight: 700,
            color: tier.color,
            marginTop: "4px",
          }}
        >
          {tier.badge} {tier.label}
        </div>
      </div>

      <div className="podium-step-pillar">
        <span className="podium-step-number">{rankNumber}</span>
      </div>
    </div>
  );
}

export function LeaderboardView() {
  const {
    user,
    userName,
    userAvatar,
    isPro,
    completedPomodoros,
    setLoginOpen,
  } = useAppContext();

  const supabase = useMemo(() => {
    try {
      return getSupabaseBrowserClient();
    } catch {
      return null;
    }
  }, []);

  const totalSeconds = completedPomodoros * 25 * 60;

  const {
    period,
    setPeriod,
    entries,
    loading,
    refresh,
    currentUserEntry,
    podium,
    surpassInfo,
  } = useLeaderboard({
    supabase,
    userId: user?.id,
    userName,
    userAvatar,
    isPro,
    totalFocusSeconds: totalSeconds,
    completedPomodoros,
  });

  const activePeriodInfo = useMemo(() => {
    return LEADERBOARD_PERIODS.find((p) => p.id === period) || LEADERBOARD_PERIODS[0];
  }, [period]);

  return (
    <div className="leaderboard-workspace">
      {/* 1. Hero Banner with Luxury League Badges (Matching User Image) */}
      <div className="leaderboard-hero-banner">
        <div className="leaderboard-hero-tag">
          <span>🏆</span>
          <span>KOMUNITAS BIARFOKUS</span>
        </div>
        <h1 className="leaderboard-hero-title">Papan Peringkat Fokus</h1>
        <p className="leaderboard-hero-sub">
          Bersaing dalam hening, buktikan lewat konsistensi. Akumulasi jam fokus nyata dari seluruh pejuang produktivitas.
        </p>

        {/* 4 Luxury League Crests */}
        <div className="leaderboard-leagues-bar" aria-label="Tingkatan Liga Fokus">
          {LUXURY_LEAGUES.map((league) => (
            <div key={league.title} className={`league-badge-card ${league.tier}`}>
              <div className="league-crest-container">
                {league.renderCrest()}
              </div>
              <span className="league-tier-tag">{league.tag}</span>
              <span className="league-card-title">{league.title}</span>
              <span className="league-card-sub">{league.sub}</span>
            </div>
          ))}
        </div>

        {/* Period Switcher & Refresh Button */}
        <div className="leaderboard-period-controls">
          <div className="leaderboard-period-tabs" role="tablist">
            {LEADERBOARD_PERIODS.map((p) => {
              const isActive = period === p.id;
              return (
                <button
                  key={p.id}
                  role="tab"
                  aria-selected={isActive}
                  className={`leaderboard-period-btn ${isActive ? "active" : ""}`}
                  onClick={() => setPeriod(p.id)}
                >
                  <span>{p.icon}</span>
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          <button
            className="leaderboard-refresh-btn"
            onClick={() => void refresh()}
            disabled={loading}
            title="Perbarui data peringkat"
          >
            <span>↻</span>
            <span>{loading ? "Memuat..." : "Segarkan"}</span>
          </button>
        </div>
      </div>

      {/* 2. 3D Stadium Pedestal Podium */}
      {entries.length > 0 && (
        <div className="podium-arena-wrapper">
          <div className="podium-arena-title">
            <span>👑</span>
            <span>Podium 3 Pejuang Fokus Teratas ({activePeriodInfo.label})</span>
          </div>

          <div className="podium-stage">
            <PodiumStep entry={podium.second} place="rank-2" rankNumber={2} />
            <PodiumStep entry={podium.first} place="rank-1" rankNumber={1} />
            <PodiumStep entry={podium.third} place="rank-3" rankNumber={3} />
          </div>
        </div>
      )}

      {/* 3. 100% Full-Width Ranked List Table (Matching User Image 4) */}
      <div className="leaderboard-table-section">
        <div className="leaderboard-table-header-bar">
          <div className="leaderboard-table-title">
            <span>📊</span>
            <span>Semua Peringkat ({entries.length} Pejuang Terdaftar)</span>
          </div>
          <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
            {activePeriodInfo.description}
          </span>
        </div>

        {loading && entries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
            Memuat data pengguna dari database...
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🌱</div>
            <h3>Belum Ada Sesi untuk Periode Ini</h3>
            <p>Jadilah yang pertama mencatatkan rekor fokus dengan menyalakan Pomodoro!</p>
            <Link
              href="/"
              style={{
                display: "inline-block",
                marginTop: "12px",
                padding: "8px 20px",
                borderRadius: "9999px",
                background: "var(--ink)",
                color: "var(--paper)",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "0.85rem",
              }}
            >
              Mulai Fokus Sekarang ⏱️
            </Link>
          </div>
        ) : (
          <table className="leaderboard-full-table">
            <thead>
              <tr>
                <th className="col-rank">Rank</th>
                <th className="col-user">Pejuang Fokus</th>
                <th className="col-tier">Tingkat Liga</th>
                <th className="col-sessions">Sesi Selesai</th>
                <th className="col-time">Total Waktu</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((item) => {
                const safeAvatar = getSafeAvatarUrl(item.avatarUrl);
                const initials = getInitials(item.displayName);
                const tier = getTierDetails(item.tier);

                return (
                  <tr
                    key={item.userId}
                    className={`leaderboard-table-row ${item.isCurrentUser ? "is-current-user" : ""}`}
                  >
                    <td className="col-rank">
                      {item.rank === 1 ? "🥇 #1" : item.rank === 2 ? "🥈 #2" : item.rank === 3 ? "🥉 #3" : `#${item.rank}`}
                    </td>

                    <td className="col-user">
                      <div className="table-user-cell">
                        {safeAvatar ? (
                          <Image
                            src={safeAvatar}
                            alt={item.displayName}
                            width={42}
                            height={42}
                            className="table-avatar"
                            unoptimized
                          />
                        ) : (
                          <div className="table-avatar-placeholder">
                            {initials}
                          </div>
                        )}

                        <div>
                          <div className="table-user-name">
                            <span>{item.displayName}</span>
                            {item.isPro && <ProBadge />}
                            {item.isCurrentUser && (
                              <span
                                style={{
                                  fontSize: "0.68rem",
                                  background: "#f59e0b",
                                  color: "#fff",
                                  padding: "1px 6px",
                                  borderRadius: "9999px",
                                  fontWeight: 800,
                                }}
                              >
                                Kamu
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="col-tier">
                      <span
                        className="table-tier-pill"
                        style={{
                          background: tier.bg,
                          color: tier.color,
                          border: `1px solid color-mix(in srgb, ${tier.color} 30%, transparent)`,
                        }}
                      >
                        <span>{tier.badge}</span>
                        <span>{tier.label}</span>
                      </span>
                    </td>

                    <td className="col-sessions">{item.pomodoroCount} sesi 🍅</td>

                    <td className="col-time">{formatFocusTime(item.totalMinutes)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 4. Sticky Bottom Rank Bar */}
      {user ? (
        currentUserEntry ? (
          <div className="leaderboard-sticky-bar">
            <div className="sticky-bar-left">
              <div className="sticky-bar-rank-badge">
                <span>#{currentUserEntry.rank}</span>
              </div>
              <div className="sticky-bar-text">
                <div className="sticky-bar-title">
                  {currentUserEntry.displayName} • {formatFocusTime(currentUserEntry.totalMinutes)} ({currentUserEntry.pomodoroCount} 🍅)
                </div>
                <div className="sticky-bar-sub">
                  {surpassInfo ? (
                    <span>
                      Butuh {formatFocusTime(surpassInfo.minutesToSurpass)} ({surpassInfo.pomodorosNeeded} 🍅) lagi untuk naik peringkat!
                    </span>
                  ) : (
                    <span>🎉 Kamu berada di puncak peringkat teratas!</span>
                  )}
                </div>
              </div>
            </div>

            <Link href="/" className="sticky-bar-action" style={{ textDecoration: "none" }}>
              Fokus Lagi ⏱️
            </Link>
          </div>
        ) : (
          <div className="leaderboard-sticky-bar">
            <div className="sticky-bar-left">
              <div className="sticky-bar-rank-badge">
                <span>🌱</span>
              </div>
              <div className="sticky-bar-text">
                <div className="sticky-bar-title">Selesaikan 1 Pomodoro untuk Masuk Peringkat</div>
                <div className="sticky-bar-sub">Mulai sesi fokusmu hari ini dan catat namamu di papan komunitas!</div>
              </div>
            </div>

            <Link href="/" className="sticky-bar-action" style={{ textDecoration: "none" }}>
              Mulai Sesi ⏱️
            </Link>
          </div>
        )
      ) : (
        <div className="leaderboard-sticky-bar">
          <div className="sticky-bar-left">
            <div className="sticky-bar-rank-badge">
              <span>👤</span>
            </div>
            <div className="sticky-bar-text">
              <div className="sticky-bar-title">Ingin namamu ada di Papan Peringkat?</div>
              <div className="sticky-bar-sub">Masuk atau buat akun gratis untuk bergabung dalam kompetisi fokus.</div>
            </div>
          </div>

          <button
            className="sticky-bar-action"
            onClick={() => setLoginOpen(true)}
          >
            Masuk / Daftar
          </button>
        </div>
      )}
    </div>
  );
}
