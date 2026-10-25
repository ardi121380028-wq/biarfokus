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
    <header className="notes-workspace-topbar habits-workspace-topbar">
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
          className={`habits-view-pill ${activeView === "checklist" ? "active" : ""}`}
          onClick={() => onSelectView("checklist")}
          title="Tampilan Ceklis Harian"
        >
          <span>✅</span>
          <span className="view-pill-text">Ceklis Hari Ini</span>
        </button>
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
          className={`habits-view-pill ${activeView === "heatmap" ? "active" : ""}`}
          onClick={() => onSelectView("heatmap")}
          title="Tampilan Heatmap 90 Hari & Analisis"
        >
          <span>📊</span>
          <span className="view-pill-text">Peta Konsistensi</span>
        </button>
      </div>

      {/* Right controls: Search, New Habit Button, Theme, Settings, Profile */}
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

        {/* Primary Action Button: + Baru */}
        <button
          type="button"
          className="habits-topbar-add-btn"
          onClick={onOpenCreateModal}
          title="Tambah Kebiasaan Baru"
        >
          <span className="add-btn-plus">+</span>
          <span className="add-btn-label">Baru</span>
        </button>

        {/* Dark/Light mode toggle */}
        {onToggleDark && (
          <button
            type="button"
            className="cal-topbar-icon-btn topbar-desktop-only"
            onClick={onToggleDark}
            aria-label={dark ? "Beralih ke mode terang" : "Beralih ke mode gelap"}
            title={dark ? "Mode Terang" : "Mode Gelap"}
          >
            {dark ? "☀️" : "🌙"}
          </button>
        )}

        {/* Settings button */}
        {onOpenSettings && (
          <button
            type="button"
            className="cal-topbar-icon-btn topbar-desktop-only"
            onClick={onOpenSettings}
            aria-label="Buka pengaturan"
            title="Pengaturan"
          >
            ⚙️
          </button>
        )}

        {/* User profile dropdown */}
        {user ? (
          <div className="cal-topbar-profile-wrap" ref={profileMenuRef}>
            <button
              type="button"
              className="cal-topbar-profile-btn"
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              aria-label="Menu akun"
              aria-expanded={profileMenuOpen}
            >
              <div className="profile-button">
                {userAvatar ? (
                  <Image src={userAvatar} alt="" width={32} height={32} unoptimized />
                ) : (
                  <span>{userName.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </button>

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
      </div>
    </header>
  );
}
