"use client";

import { useRef, useState } from "react";
import { useOutsideClick } from "@/lib/hooks/use-dismiss";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAppContext } from "@/app/providers/app-provider";

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
  onLogout?: () => void;
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
  onLogout,
}: NotesTopbarProps) {
  const { isPro } = useAppContext();
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useOutsideClick(profileMenuRef, () => setProfileMenuOpen(false));

  return (
    <header className="notes-workspace-topbar">
      {/* Left controls: Hamburger button and Module Title */}
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
        <span className="notes-topbar-title">Catatan</span>
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
          {searchOpen && (
            <button
              type="button"
              className="cal-topbar-search-close-mobile"
              onClick={() => {
                setSearchOpen(false);
                onSearchChange("");
              }}
              aria-label="Tutup pencarian"
              title="Tutup pencarian"
            >
              ✕
            </button>
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
            className="cal-topbar-icon-btn modern-shortcut-btn"
            onClick={onOpenSettings}
            aria-label="Pengaturan"
            title="Pengaturan"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        )}

        {/* Profile Avatar & Dropdown */}
        <div className="cal-topbar-profile-wrap" ref={profileMenuRef}>
          {userName ? (
            <div className="cal-topbar-profile-btn-row">
              {isPro && (
                <span className="topbar-pro-pill" title="Akun BiarFokus Pro Aktif">
                  PRO ⭐
                </span>
              )}
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
                {isPro && <span className="profile-pro-dot" title="Pro Aktif" />}
              </button>
            </div>
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
