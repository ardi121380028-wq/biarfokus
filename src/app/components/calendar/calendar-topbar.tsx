"use client";

import { useMemo, useRef, useState } from "react";
import type { CalendarViewMode } from "@/features/calendar/calendar-service";
import { getWeekNumber } from "@/features/calendar/calendar-service";
import { useOutsideClick } from "@/lib/hooks/use-dismiss";

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
}: CalendarTopbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useOutsideClick(profileMenuRef, () => setProfileMenuOpen(false));

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

      {/* Right controls: Search, View Switcher, Theme, Settings, Profile */}
      <div className="cal-topbar-right">
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

        {/* View Mode Switcher */}
        <div className="cal-topbar-view-switcher">
          <select
            value={viewMode}
            onChange={(e) => onViewModeChange(e.target.value as CalendarViewMode)}
            className="cal-topbar-view-select"
            aria-label="Pilih tampilan kalender"
          >
            <option value="day">Hari</option>
            <option value="week">Minggu</option>
            <option value="month">Bulan</option>
            <option value="year">Tahun</option>
          </select>
        </div>

        {/* Theme Toggle */}
        {onToggleDark && (
          <button
            type="button"
            className="cal-topbar-icon-btn"
            onClick={onToggleDark}
            aria-label="Ganti mode gelap/terang"
            title={dark ? "Mode Terang" : "Mode Gelap"}
          >
            {dark ? "☀" : "☾"}
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
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
