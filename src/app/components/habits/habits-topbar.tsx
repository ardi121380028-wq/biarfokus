"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useOutsideClick } from "@/lib/hooks/use-dismiss";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAppContext } from "@/app/providers/app-provider";
import { ProBadge } from "@/app/components/ui/pro-badge";
import { ProfileMenu } from "@/app/components/profile-menu";
import { isAdminRole } from "@/features/admin/admin-service";
import type { HabitViewMode } from "./habits-sidebar";
import type { HabitFilter } from "@/features/habits/habit-types";

interface HabitsTopbarProps {
  onToggleSidebar: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeView: HabitViewMode;
  onSelectView: (view: HabitViewMode) => void;
  activeFilter: HabitFilter;
  onOpenCreateModal: () => void;
  dark?: boolean;
  onToggleDark?: () => void;
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
  onOpenStats?: () => void;
  userName?: string;
  userAvatar?: string | null;
  onRequireLogin?: () => void;
  onNavigate?: (view: "timer" | "notes" | "calendar" | "kanban" | "habits" | "stats" | "pricing" | "admin") => void;
}

export function HabitsTopbar({
  onToggleSidebar,
  searchQuery,
  onSearchChange,
  activeView,
  onSelectView,
  activeFilter,
  onOpenCreateModal,
  dark,
  onToggleDark,
  onOpenSettings,
  onOpenProfile,
  onOpenStats,
  userName = "Pengguna",
  userAvatar,
  onRequireLogin,
  onNavigate,
}: HabitsTopbarProps) {
  const { isPro, userRole, user, setAppError } = useAppContext();
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useOutsideClick(profileMenuRef, () => setProfileMenuOpen(false));

  const filterLabel = {
    all: "Semua",
    morning: "Pagi",
    afternoon: "Siang",
    evening: "Malam",
    anytime: "Kapan Saja",
  }[activeFilter];

  return (
    <header className="cal-workspace-topbar habits-workspace-topbar">
      {/* Left controls: Toggle button & Module Title */}
      <div className="cal-topbar-left">
        <button
          type="button"
          className="cal-topbar-hamburger-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar kebiasaan"
          title="Buka / Tutup sidebar"
        >
          ☰
        </button>
        <div className="habits-topbar-breadcrumb">
          <span className="habits-topbar-title">Kebiasaan</span>
          <span className="habits-breadcrumb-sep">/</span>
          <span className="habits-breadcrumb-filter">{filterLabel}</span>
        </div>
      </div>

      {/* Center: View Switcher Segmented Pills */}
      <div className="habits-topbar-view-switcher" role="tablist" aria-label="Tampilan Kebiasaan">
        <button
          type="button"
          className={`habits-view-pill ${activeView === "matrix" ? "active" : ""}`}
          onClick={() => onSelectView("matrix")}
          title="Tampilan Matriks Mingguan (Tabel 7 Hari)"
        >
          <span>📅</span>
          <span className="view-pill-text">Matriks Mingguan</span>
        </button>
        <button
          type="button"
          className={`habits-view-pill ${activeView === "checklist" ? "active" : ""}`}
          onClick={() => onSelectView("checklist")}
          title="Tampilan Ceklis Harian"
        >
          <span>✅</span>
          <span className="view-pill-text">Ceklis Hari Ini</span>
        </button>
        <button
          type="button"
          className={`habits-view-pill ${activeView === "heatmap" ? "active" : ""}`}
          onClick={() => onSelectView("heatmap")}
          title="Tampilan Heatmap 90 Hari & Analisis"
        >
          <span>📊</span>
          <span className="view-pill-text">Peta Konsistensi</span>
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
            aria-label="Cari kebiasaan"
            title="Cari kebiasaan"
          >
            🔍
          </button>
          <input
            type="text"
            placeholder="Cari kebiasaan, pemicu..."
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
            >
              ✕
            </button>
          )}
        </div>

        {/* Dark/Light mode toggle (Desktop Only) */}
        {onToggleDark && (
          <button
            type="button"
            className="cal-topbar-icon-btn modern-theme-btn topbar-desktop-only"
            onClick={onToggleDark}
            aria-label={dark ? "Beralih ke mode terang" : "Beralih ke mode gelap"}
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

        {/* Settings button (Desktop Only) */}
        {onOpenSettings && (
          <button
            type="button"
            className="cal-topbar-icon-btn modern-shortcut-btn topbar-desktop-only"
            onClick={onOpenSettings}
            aria-label="Buka pengaturan"
            title="Pengaturan"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        )}

        {/* User profile dropdown */}
        <div className="cal-topbar-profile-wrap" ref={profileMenuRef}>
          {user ? (
            <div className="cal-topbar-profile-btn-row">
              <button
                type="button"
                className="profile-button-wrap"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                aria-label="Menu akun"
                title={userName}
              >
                <div className="cal-topbar-avatar-btn">
                  {userAvatar ? (
                    <Image
                      src={userAvatar}
                      alt={userName}
                      width={30}
                      height={30}
                      className="cal-topbar-avatar-img"
                      unoptimized
                    />
                  ) : (
                    <span className="cal-topbar-avatar-initial">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="profile-user-col">
                  <span className="profile-user-name" title={userName}>
                    {userName}
                  </span>
                  {isPro ? (
                    <ProBadge size="sm" />
                  ) : (
                    <span className="profile-free-pill">Free</span>
                  )}
                </div>
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="cal-topbar-signin-btn"
              onClick={onRequireLogin}
              title="Masuk ke Akun BiarFokus"
            >
              Masuk
            </button>
          )}

          {profileMenuOpen && (
            <ProfileMenu
              userName={userName}
              isPro={isPro}
              isAdmin={isAdminRole(userRole)}
              onClose={() => setProfileMenuOpen(false)}
              onAccount={() => {
                setProfileMenuOpen(false);
                onOpenProfile?.();
              }}
              onStats={() => {
                setProfileMenuOpen(false);
                onOpenStats?.();
              }}
              onSettings={() => {
                setProfileMenuOpen(false);
                onOpenSettings?.();
              }}
              onPremium={() => {
                setProfileMenuOpen(false);
                onNavigate?.("pricing");
              }}
              onAdmin={() => {
                setProfileMenuOpen(false);
                onNavigate?.("admin");
              }}
              onSignOut={() => {
                setProfileMenuOpen(false);
                void getSupabaseBrowserClient()
                  .auth.signOut()
                  .then((result: { error: { message: string } | null }) => {
                    if (result.error) setAppError(result.error.message);
                  });
              }}
            />
          )}
        </div>
      </div>
    </header>
  );
}
