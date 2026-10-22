"use client";

import { useMemo, useRef, useState } from "react";
import type { CalendarViewMode } from "@/features/calendar/calendar-service";
import { getWeekNumber } from "@/features/calendar/calendar-service";
import { useOutsideClick } from "@/lib/hooks/use-dismiss";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type CalendarTopbarProps = {
  anchorDate: Date;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  dark?: boolean;
  onToggleDark?: () => void;
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
  onOpenStats?: () => void;
  userName?: string;
  userAvatar?: string | null;
  onRequireLogin?: () => void;
  onNavigate?: (view: "timer" | "notes" | "calendar" | "kanban" | "stats" | "pricing" | "admin") => void;
  syncStatus?: "synced" | "saving" | "offline" | "error";
  onForceSync?: () => void;
  onLogout?: () => void;
};

export function CalendarTopbar({
  anchorDate,
  viewMode,
  onViewModeChange,
  onToday,
  onPrev,
  onNext,
  onToggleSidebar,
  searchQuery,
  onSearchChange,
  dark,
  onToggleDark,
  onOpenSettings,
  onOpenProfile,
  onOpenStats,
  userName,
  userAvatar,
  onRequireLogin,
  onNavigate,
  syncStatus,
  onForceSync,
  onLogout,
}: CalendarTopbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(profileMenuRef, () => setProfileMenuOpen(false));

  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const viewMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(viewMenuRef, () => setViewMenuOpen(false), viewMenuOpen);

  const VIEW_OPTIONS: { id: CalendarViewMode; label: string; icon: string }[] = [
    { id: "day", label: "Hari", icon: "📅" },
    { id: "week", label: "Minggu", icon: "📆" },
    { id: "month", label: "Bulan", icon: "🗓️" },
    { id: "year", label: "Tahun", icon: "📊" },
  ];
  const activeViewOption = VIEW_OPTIONS.find((v) => v.id === viewMode) || VIEW_OPTIONS[1];

  const weekNumber = useMemo(() => getWeekNumber(anchorDate, true), [anchorDate]);

  const titleText = useMemo(() => {
    if (viewMode === "year") {
      return String(anchorDate.getFullYear());
    }
    if (viewMode === "month" || viewMode === "week") {
      return anchorDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    }
    // Day view
    return anchorDate.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [anchorDate, viewMode]);

  return (
    <header className="cal-workspace-topbar">
      {/* Left controls: Toggle, Today, Arrows, Heading */}
      <div className="cal-topbar-left">
        <button
          type="button"
          className="cal-topbar-hamburger-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar kalender"
          title="Buka / Tutup sidebar"
        >
          ☰
        </button>

        <button
          type="button"
          className="cal-topbar-today-btn"
          onClick={onToday}
          title="Kembali ke hari ini"
        >
          Hari Ini
        </button>

        <div className="cal-topbar-nav-arrows">
          <button
            type="button"
            className="cal-topbar-arrow-btn"
            onClick={onPrev}
            aria-label="Sebelumnya"
            title="Sebelumnya"
          >
            ‹
          </button>
          <button
            type="button"
            className="cal-topbar-arrow-btn"
            onClick={onNext}
            aria-label="Selanjutnya"
            title="Selanjutnya"
          >
            ›
          </button>
        </div>

        <div className="cal-topbar-heading-wrap">
          <h2 className="cal-topbar-title">{titleText}</h2>
          {viewMode === "week" && (
            <span className="cal-topbar-week-badge" title={`Minggu ke-${weekNumber}`}>
              Minggu {weekNumber}
            </span>
          )}
        </div>
      </div>

      {/* Right controls: Sync Status, Search, View Switcher, Theme, Settings, Profile */}
      <div className="cal-topbar-right">
        {/* Cloud Sync Status Badge */}
        {syncStatus && (
          <button
            type="button"
            className={`cal-sync-status-badge ${syncStatus}`}
            onClick={() => {
              if (syncStatus === "error" || syncStatus === "offline") {
                onForceSync?.();
              }
            }}
            title={
              syncStatus === "synced"
                ? "Kalender tersinkronisasi otomatis dengan cloud & HP"
                : syncStatus === "saving"
                  ? "Menyimpan perubahan ke cloud..."
                  : syncStatus === "offline"
                    ? "Mode offline / tamu"
                    : "Gagal sinkron. Klik untuk mencoba lagi."
            }
          >
            <span className="cal-sync-status-icon">
              {syncStatus === "synced" && "☁️"}
              {syncStatus === "saving" && "⏳"}
              {syncStatus === "offline" && "💻"}
              {syncStatus === "error" && "⚠️"}
            </span>
            <span className="cal-sync-status-text">
              {syncStatus === "synced" && "Tersinkron"}
              {syncStatus === "saving" && "Menyimpan..."}
              {syncStatus === "offline" && "Mode Lokal"}
              {syncStatus === "error" && "Coba Lagi"}
            </span>
          </button>
        )}

        {/* Search input / toggle */}
        <div className={`cal-topbar-search-box ${searchOpen ? "is-open" : ""}`}>
          <button
            type="button"
            className="cal-topbar-search-toggle"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Cari jadwal"
            title="Cari jadwal"
          >
            🔍
          </button>
          <input
            type="text"
            placeholder="Cari jadwal, agenda, catatan..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="cal-topbar-search-input"
          />
          {(searchQuery || searchOpen) && (
            <button
              type="button"
              className="cal-topbar-search-clear"
              onClick={() => {
                onSearchChange("");
                setSearchOpen(false);
              }}
              aria-label="Tutup pencarian"
              title="Tutup pencarian"
            >
              ✕
            </button>
          )}
        </div>

        {/* Modern View Mode Switcher */}
        <div className="cal-topbar-view-switcher" ref={viewMenuRef}>
          <button
            type="button"
            className={`cal-modern-view-btn ${viewMenuOpen ? "active" : ""}`}
            onClick={() => setViewMenuOpen(!viewMenuOpen)}
            aria-label="Pilih tampilan kalender"
            aria-expanded={viewMenuOpen}
          >
            <span className="cal-view-btn-icon">{activeViewOption.icon}</span>
            <span className="cal-view-btn-label">{activeViewOption.label}</span>
            <svg
              className={`cal-view-chevron ${viewMenuOpen ? "open" : ""}`}
              width="12"
              height="12"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {viewMenuOpen && (
            <div className="cal-modern-view-dropdown" role="menu">
              {VIEW_OPTIONS.map((opt) => {
                const isSelected = viewMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={`cal-modern-view-item ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      onViewModeChange(opt.id);
                      setViewMenuOpen(false);
                    }}
                    role="menuitem"
                  >
                    <span className="cal-view-item-icon">{opt.icon}</span>
                    <span className="cal-view-item-label">{opt.label}</span>
                    {isSelected && <span className="cal-view-item-check">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        {onToggleDark && (
          <button
            type="button"
            className="cal-topbar-icon-btn modern-theme-btn"
            onClick={onToggleDark}
            aria-label="Ganti mode gelap/terang"
            title={dark ? "Mode Terang" : "Mode Gelap"}
          >
            {dark ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        )}

        {/* Settings button */}
        {onOpenSettings && (
          <button
            type="button"
            className="cal-topbar-icon-btn"
            onClick={onOpenSettings}
            aria-label="Pengaturan"
            title="Pengaturan"
          >
            ⚙
          </button>
        )}

        {/* Profile Avatar & Dropdown */}
        <div className="cal-topbar-profile-wrap" ref={profileMenuRef}>
          {userName ? (
            <button
              type="button"
              className="cal-topbar-avatar-btn"
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              aria-label="Menu akun"
              title={userName}
            >
              {userAvatar ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={userAvatar} alt={userName} className="cal-topbar-avatar-img" />
              ) : (
                <span className="cal-topbar-avatar-initial">
                  {userName.charAt(0).toUpperCase()}
                </span>
              )}
            </button>
          ) : (
            <button
              type="button"
              className="cal-topbar-login-btn"
              onClick={onRequireLogin || onOpenProfile}
            >
              Masuk
            </button>
          )}

          {profileMenuOpen && (
            <div className="cal-topbar-profile-menu">
              <div className="cal-profile-menu-header">
                <strong>{userName || "Akun Saya"}</strong>
                <span className="cal-profile-menu-sub">BiarFokus Workspace</span>
              </div>
              <button
                type="button"
                className="cal-profile-menu-item"
                onClick={() => {
                  setProfileMenuOpen(false);
                  onOpenProfile?.();
                }}
              >
                👤 Profil & Akun
              </button>
              {onOpenStats && (
                <button
                  type="button"
                  className="cal-profile-menu-item"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    onOpenStats();
                  }}
                >
                  📊 Statistik
                </button>
              )}
              {onOpenSettings && (
                <button
                  type="button"
                  className="cal-profile-menu-item"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    onOpenSettings();
                  }}
                >
                  ⚙ Pengaturan
                </button>
              )}
              {onNavigate && (
                <button
                  type="button"
                  className="cal-profile-menu-item"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    onNavigate("pricing");
                  }}
                >
                  💎 Upgrade Pro
                </button>
              )}
              <button
                type="button"
                className="cal-profile-menu-item cal-profile-logout-item"
                onClick={() => {
                  setProfileMenuOpen(false);
                  if (onLogout) {
                    onLogout();
                  } else {
                    void getSupabaseBrowserClient().auth.signOut().then(() => {
                      window.location.reload();
                    });
                  }
                }}
                style={{ color: "#dc2626", fontWeight: 600, borderTop: "1px solid color-mix(in srgb, var(--ink) 8%, transparent)", marginTop: "4px", paddingTop: "8px" }}
              >
                🚪 Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
