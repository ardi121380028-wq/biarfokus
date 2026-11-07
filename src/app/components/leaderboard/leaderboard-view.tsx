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

const LEAGUE_SHOWCASE = [
  { icon: "🌱", title: "Bibit Fokus", sub: "0 - 3 Jam" },
  { icon: "⚡", title: "Pejuang Konsisten", sub: "3 - 10 Jam" },
  { icon: "🏆", title: "Master Deep Work", sub: "10 - 20 Jam" },
  { icon: "👑", title: "Zen Legend", sub: "20+ Jam" },
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
      {/* Floating Info Above Step */}
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

      {/* 3D Physical Step Pillar */}
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
    otherEntries,
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
      {/* 1. Hero Banner with League Tiers Row (Inspired by User Images 3 & 4) */}
      <div className="leaderboard-hero-banner">
        <div className="leaderboard-hero-tag">
          <span>🏆</span>
          <span>KOMUNITAS BIARFOKUS</span>
        </div>
        <h1 className="leaderboard-hero-title">Papan Peringkat Fokus</h1>
        <p className="leaderboard-hero-sub">
          Bersaing dalam hening, buktikan lewat konsistensi. Akumulasi jam fokus nyata dari seluruh pejuang produktivitas.
        </p>

        {/* League Badges Showcase */}
        <div className="leaderboard-leagues-bar" aria-label="Tingkatan Liga Fokus">
          {LEAGUE_SHOWCASE.map((league) => (
            <div key={league.title} className="league-badge-card">
              <span className="league-card-icon">{league.icon}</span>
              <span className="league-card-title">{league.title}</span>
              <span className="league-card-sub">{league.sub}</span>
            </div>
          ))}
        </div>

        {/* Period Switcher & Refresh */}
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

      {/* 2. Podium Arena (Top 3 3D Stadium Steps) */}
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
            <span>Semua Peringkat ({entries.length} Pejuang)</span>
          </div>
          <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
            {activePeriodInfo.description}
          </span>
        </div>

        {loading && entries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
            Memuat data pengguna asli...
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
