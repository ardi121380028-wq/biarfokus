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

function PodiumItem({
  entry,
  place,
}: {
  entry?: LeaderboardEntry;
  place: "first" | "second" | "third";
}) {
  if (!entry) return null;

  const safeAvatar = getSafeAvatarUrl(entry.avatarUrl);
  const initials = getInitials(entry.displayName);
  const tier = getTierDetails(entry.tier);

  const medal = place === "first" ? "🥇" : place === "second" ? "🥈" : "🥉";

  return (
    <div className={`podium-card ${place}`}>
      <div className="podium-rank-badge" title={`Peringkat #${entry.rank}`}>
        {medal}
      </div>

      <div className="podium-avatar-wrapper">
        {place === "first" && <span className="podium-crown">👑</span>}
        {safeAvatar ? (
          <Image
            src={safeAvatar}
            alt={entry.displayName}
            width={place === "first" ? 76 : 64}
            height={place === "first" ? 76 : 64}
            className="podium-avatar"
            unoptimized
          />
        ) : (
          <div className="podium-avatar-placeholder">{initials}</div>
        )}
      </div>

      <div className="podium-name" title={entry.displayName}>
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

      <div className="podium-minutes">{formatFocusTime(entry.totalMinutes)}</div>
      <div className="podium-sessions">{entry.pomodoroCount} sesi 🍅</div>

      <div
        className="podium-tier-pill"
        style={{
          background: tier.bg,
          color: tier.color,
          border: `1px solid color-mix(in srgb, ${tier.color} 30%, transparent)`,
        }}
        title={`Liga: ${tier.label}`}
      >
        <span>{tier.badge}</span>
        <span>{tier.label}</span>
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

  // Estimate total focus seconds from completed pomodoros
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
    <div className="leaderboard-container">
      {/* Header Banner */}
      <div className="leaderboard-header">
        <div className="leaderboard-badge">
          <span>🏆</span>
          <span>KOMUNITAS BIARFOKUS</span>
        </div>
        <h1 className="leaderboard-title">Papan Peringkat Fokus</h1>
        <p className="leaderboard-subtitle">
          Bersaing dalam hening, buktikan lewat konsistensi. Lihat siapa pejuang fokus yang paling berdedikasi!
        </p>
      </div>

      {/* Period Tabs */}
      <div className="leaderboard-tabs" role="tablist" aria-label="Periode Leaderboard">
        {LEADERBOARD_PERIODS.map((p) => {
          const isActive = period === p.id;
          return (
            <button
              key={p.id}
              role="tab"
              aria-selected={isActive}
              className={`leaderboard-tab-btn ${isActive ? "active" : ""}`}
              onClick={() => setPeriod(p.id)}
            >
              <span>{p.icon}</span>
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Period Description & Refresh */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 8px",
          marginTop: "-10px",
          color: "var(--muted)",
          fontSize: "0.82rem",
        }}
      >
        <span>
          <strong>{activePeriodInfo.label}:</strong> {activePeriodInfo.description}
        </span>
        <button
          onClick={() => void refresh()}
          disabled={loading}
          style={{
            background: "none",
            border: "none",
            color: "var(--muted)",
            fontSize: "0.8rem",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontWeight: 600,
          }}
          title="Perbarui data peringkat"
        >
          <span>↻</span>
          <span>{loading ? "Memuat..." : "Segarkan"}</span>
        </button>
      </div>

      {/* Loading Indicator */}
      {loading && entries.length === 0 ? (
        <div className="leaderboard-loading">
          <div className="leaderboard-spinner" />
          <span>Memuat data peringkat fokus...</span>
        </div>
      ) : (
        <>
          {/* Top 3 Podium (Always displayed when entries exist) */}
          {entries.length > 0 && (
            <div className="leaderboard-podium">
              <PodiumItem entry={podium.second} place="second" />
              <PodiumItem entry={podium.first} place="first" />
              <PodiumItem entry={podium.third} place="third" />
            </div>
          )}

          {/* Ranked List for Rank 4+ */}
          {otherEntries.length > 0 ? (
            <div className="leaderboard-list">
              <div className="leaderboard-list-header">
                <div style={{ display: "flex", gap: "24px" }}>
                  <span style={{ width: "28px", textAlign: "center" }}>Rank</span>
                  <span>Pejuang Fokus</span>
                </div>
                <span>Waktu Fokus</span>
              </div>

              {otherEntries.map((item) => {
                const safeAvatar = getSafeAvatarUrl(item.avatarUrl);
                const initials = getInitials(item.displayName);
                const tier = getTierDetails(item.tier);

                return (
                  <div
                    key={item.userId}
                    className={`leaderboard-row ${item.isCurrentUser ? "is-current-user" : ""}`}
                  >
                    <div className="leaderboard-row-left">
                      <span className="leaderboard-rank-num">#{item.rank}</span>

                      {safeAvatar ? (
                        <Image
                          src={safeAvatar}
                          alt={item.displayName}
                          width={40}
                          height={40}
                          className="leaderboard-user-avatar"
                          unoptimized
                        />
                      ) : (
                        <div className="leaderboard-user-avatar-placeholder">
                          {initials}
                        </div>
                      )}

                      <div className="leaderboard-user-info">
                        <div className="leaderboard-user-name-line">
                          <span className="leaderboard-user-name">
                            {item.displayName}
                          </span>
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

                        <div className="leaderboard-user-meta">
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              color: tier.color,
                            }}
                          >
                            {tier.badge} {tier.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="leaderboard-row-right">
                      <span className="leaderboard-row-time">
                        {formatFocusTime(item.totalMinutes)}
                      </span>
                      <span className="leaderboard-row-poms">
                        {item.pomodoroCount} sesi 🍅
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : entries.length === 0 ? (
            <div className="leaderboard-empty">
              <div className="leaderboard-empty-icon">🌱</div>
              <h3>Belum Ada Sesi untuk Periode Ini</h3>
              <p>Jadilah yang pertama mencatatkan rekor fokus dengan menyalakan Pomodoro!</p>
              <Link
                href="/"
                style={{
                  display: "inline-block",
                  marginTop: "14px",
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
          ) : null}
        </>
      )}

      {/* Gamification Info Card */}
      <div
        style={{
          background: "var(--paper)",
          borderRadius: "20px",
          padding: "18px 20px",
          border: "1px solid color-mix(in srgb, var(--ink) 8%, transparent)",
          fontSize: "0.85rem",
          color: "var(--muted)",
          lineHeight: 1.6,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: 700,
            color: "var(--ink)",
            marginBottom: "6px",
          }}
        >
          <span>💡</span>
          <span>Sistem Penghitungan &amp; Fair Play</span>
        </div>
        <p style={{ margin: 0 }}>
          Peringkat dihitung secara otomatis berdasarkan akumulasi waktu sesi Pomodoro yang selesai tuntas (minimal 1 menit). 
          Semua sesi tersinkronisasi aman ke database Supabase. Privasi akun terjaga; hanya nama tampilan dan avatar yang diperlihatkan kepada komunitas.
        </p>
      </div>

      {/* Sticky Bottom Rank Bar */}
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
