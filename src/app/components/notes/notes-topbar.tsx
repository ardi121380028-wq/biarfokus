"use client";

import { useRef, useState } from "react";
import { useOutsideClick } from "@/lib/hooks/use-dismiss";

type NotesTopbarProps = {
  onToggleSidebar: () => void;
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

export function NotesTopbar({
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
}: NotesTopbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useOutsideClick(profileMenuRef, () => setProfileMenuOpen(false));

  return (
    <header className="notes-workspace-topbar">
      {/* Left controls: Hamburger button only */}
      <div className="cal-topbar-left">
        <button
          type="button"
          className="cal-topbar-hamburger-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar catatan"
          title="Buka / Tutup sidebar"
        >
          ☰
        </button>
      </div>

      {/* Right controls: Search, Theme, Settings, Profile */}
      <div className="cal-topbar-right">
        {/* Search input / toggle */}
        <div className={`cal-topbar-search-box ${searchOpen || searchQuery ? "is-open" : ""}`}>
          <button
            type="button"
            className="cal-topbar-search-toggle"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Cari catatan"
            title="Cari catatan"
          >
            🔍
          </button>
          <input
            type="text"
            placeholder="Cari catatan, checklist..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="cal-topbar-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="cal-topbar-search-clear"
              onClick={() => onSearchChange("")}
              aria-label="Hapus pencarian"
            >
              ✕
            </button>
          )}
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
                👤 Profil Akun
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
                  ⚙️ Pengaturan
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
