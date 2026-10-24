"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAppContext } from "@/app/providers/app-provider";
import { ProfileMenu } from "@/app/components/profile-menu";
import { AuthModal as AuthModalComponent } from "@/app/components/auth-modal";
import { SettingsModal as SettingsModalComponent } from "@/app/components/settings-modal";
import { ShortcutsModal as ShortcutsModalComponent } from "@/app/components/shortcuts-modal";
import { AccountModal } from "@/app/components/account-modal";
import { AboutModal } from "@/app/components/about-modal";
import { PomodoroModal } from "@/app/components/pomodoro-modal";
import { TermsModal } from "@/app/components/terms-modal";
import { FaqModal } from "@/app/components/faq-modal";
import { NotesModal } from "@/app/components/notes-modal";
import { isAdminRole } from "@/features/admin/admin-service";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { trackSiteVisit } from "@/features/analytics/visitor-tracker";
import { ProBadge } from "@/app/components/ui/pro-badge";

const NAV_LINKS = [
  { href: "/", label: "Timer" },
  { href: "/catatan", label: "Catatan" },
  { href: "/kalender", label: "Kalender" },
  { href: "/kanban", label: "Project Kanban" },
  { href: "/upgrade", label: "Price" },
] as const;

function isDarkPageBg(color: string, isDarkTheme: boolean): boolean {
  if (isDarkTheme) return true;
  if (!color) return false;
  const clean = color.trim().toLowerCase();
  // Abu-abu / default neutral gray (#e8e8e8) pakai teks gelap, selain itu (pink, hijau, biru, oranye, kuning) pakai teks putih
  if (clean === "#e8e8e8" || clean === "#ffffff" || clean === "#f5f5f5" || clean === "#eeeeee") {
    return false;
  }
  return true;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const [splashStep, setSplashStep] = useState(0);

  // 3-Second branded startup splash on desktop and mobile PWA
  useEffect(() => {
    const s1 = setTimeout(() => setSplashStep(1), 850);
    const s2 = setTimeout(() => setSplashStep(2), 1700);
    const fadeTimer = setTimeout(() => {
      setSplashFading(true);
    }, 2500);

    const doneTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2950);

    return () => {
      clearTimeout(s1);
      clearTimeout(s2);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  const {
    user,
    userRole,
    isPro,
    userName,
    userAvatar,
    loginOpen,
    setLoginOpen,
    authMode,
    setAuthMode,
    accountOpen,
    setAccountOpen,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    deletingAccount,
    handleDeleteAccount,
    handleLogout,
    authError,
    setAuthError,
    appError,
    setAppError,
    infoOpen,
    setInfoOpen,
    dark,
    setDark,
    selectedColor,
    setSelectedColor,
    showSettings,
    setShowSettings,
    soundEnabled,
    setSoundEnabled,
    autoStart,
    setAutoStart,
    notificationsEnabled,
    setNotificationsEnabled,
    timerDurations,
    setTimerDurations,
    repeatAlarm,
    setRepeatAlarm,
    alarmSound,
    setAlarmSound,
    longBreakInterval,
    setLongBreakInterval,
    dailyGoalPomodoros,
    setDailyGoalPomodoros,
    tickingSoundEnabled,
    setTickingSoundEnabled,
    setSeconds,
    setRunning,
    mode,
    shortcutsOpen,
    setShortcutsOpen,
    aboutModalOpen,
    setAboutModalOpen,
    pomodoroModalOpen,
    setPomodoroModalOpen,
    termsModalOpen,
    setTermsModalOpen,
    faqModalOpen,
    setFaqModalOpen,
    notesOpen,
    setNotesOpen,
    menuOpen,
    setMenuOpen,
    setProfileDisplayName,
  } = useAppContext();

  // Track page visit on route changes
  useEffect(() => {
    void trackSiteVisit(pathname || "/");
  }, [pathname]);

  // Check if current view is a full workspace mode (Kanban, Kalender, Catatan)
  const isWorkspaceView =
    pathname.startsWith("/kanban") ||
    pathname.startsWith("/kalender") ||
    pathname.startsWith("/catatan");

  function isNavActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const isDarkBg = isDarkPageBg(selectedColor, dark);

  return (
    <main
      className={[
        "app",
        dark ? "dark" : "",
        isWorkspaceView ? "kanban-workspace-mode" : "",
        isDarkBg ? "has-dark-page-bg" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        {
          "--accent": selectedColor,
          "--page": dark ? "#111111" : selectedColor,
          "--ink": dark ? "#f5f5f5" : "#111111",
          "--muted": dark ? "#a9a9a9" : "#777777",
          "--paper": dark ? "#1d1d1d" : "#ffffff",
        } as CSSProperties
      }
    >
      {/* Topbar for standard views */}
      {!isWorkspaceView && (
        <header className="topbar">
          <Link href="/" className="brand" aria-label="Kembali ke timer">
            <img
              src="/biarfokus-logo-light.png"
              alt="biarfokus"
              className="brand-logo-img light-only"
            />
            <img
              src="/biarfokus-logo-dark.png"
              alt="biarfokus"
              className="brand-logo-img dark-only"
            />
          </Link>
          <nav className="desktop-nav" aria-label="Navigasi utama">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={isNavActive(href) ? "nav-link active" : "nav-link"}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="top-actions">
            <button
              className="icon-button modern-theme-btn topbar-desktop-only"
              onClick={() => setDark(!dark)}
              aria-label="Ganti tema"
              title={dark ? "Mode Terang" : "Mode Gelap"}
            >
              {dark ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
            <button
              className="icon-button shortcut-button modern-shortcut-btn topbar-desktop-only"
              onClick={() => setShortcutsOpen(true)}
              aria-label="Keyboard shortcuts"
              title="Pintasan Keyboard (?)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="3" />
                <line x1="6" y1="8" x2="6.01" y2="8" strokeWidth="2.5" />
                <line x1="10" y1="8" x2="10.01" y2="8" strokeWidth="2.5" />
                <line x1="14" y1="8" x2="14.01" y2="8" strokeWidth="2.5" />
                <line x1="18" y1="8" x2="18.01" y2="8" strokeWidth="2.5" />
                <line x1="6" y1="12" x2="6.01" y2="12" strokeWidth="2.5" />
                <line x1="18" y1="12" x2="18.01" y2="12" strokeWidth="2.5" />
                <line x1="9" y1="16" x2="15" y2="16" />
              </svg>
            </button>
            <button
              className="settings-button"
              onClick={() => setShowSettings(true)}
            >
              ⚙ <span>Settings</span>
            </button>
            {user ? (
              <div className="profile-area">
                <button
                  type="button"
                  className="profile-button-wrap"
                  onClick={() => setProfileMenuOpen((open) => !open)}
                  aria-label="Buka menu akun"
                  aria-expanded={profileMenuOpen}
                >
                  <div className="profile-button">
                    {userAvatar ? (
                      <Image src={userAvatar} alt="" width={42} height={42} unoptimized />
                    ) : (
                      <span>{userName.charAt(0).toUpperCase()}</span>
                    )}
                    {isPro && <span className="profile-pro-dot" title="Pro Aktif" />}
                  </div>
                  <div className="profile-user-col">
                    <span className="profile-user-name" title={userName || "Pengguna"}>
                      {userName || "Pengguna"}
                    </span>
                    {isPro ? (
                      <ProBadge size="sm" />
                    ) : (
                      <span className="profile-free-pill">Free</span>
                    )}
                  </div>
                </button>
                {profileMenuOpen && (
                  <ProfileMenu
                    userName={userName}
                    isAdmin={isAdminRole(userRole)}
                    onAccount={() => {
                      setAccountOpen(true);
                      setProfileMenuOpen(false);
                    }}
                    onStats={() => {
                      router.push("/statistik");
                      setProfileMenuOpen(false);
                    }}
                    onPremium={() => {
                      router.push("/upgrade");
                      setProfileMenuOpen(false);
                    }}
                    onAdmin={() => {
                      router.push("/admin");
                      setProfileMenuOpen(false);
                    }}
                    onShortcuts={() => {
                      setShortcutsOpen(true);
                      setProfileMenuOpen(false);
                    }}
                    onSignOut={() => {
                      setProfileMenuOpen(false);
                      void getSupabaseBrowserClient()
                        .auth.signOut()
                        .then((result: { error: { message: string } | null }) => {
                          if (result.error) setAppError(result.error.message);
                        });
                    }}
                    onDelete={() => {
                      setProfileMenuOpen(false);
                      setDeleteConfirmOpen(true);
                    }}
                  />
                )}
              </div>
            ) : (
              <button className="login-button" onClick={() => setLoginOpen(true)}>
                🔐 Sign In
              </button>
            )}
          </div>
        </header>
      )}

      {/* Page Content */}
      {children}

      {/* Footer for standard views */}
      {!isWorkspaceView && (
        <footer className={`footer ${isDarkBg ? "footer-contrast-light" : ""}`}>
          <div className="footer-left">
            <div className="footer-brand">
              <strong>BiarFokus</strong>
              <span>Bantu kamu fokus selesain setiap pekerjaan.</span>
            </div>
            <small className="footer-copyright">
              &copy; 2026 BiarFokus &bull; All rights reserved.
            </small>
          </div>
          <div className="footer-right">
            <div className="footer-social-icons" aria-label="Media Sosial BiarFokus">
              <a
                href="https://www.instagram.com/biarfokus.id/"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-icon-btn"
                title="Instagram @biarfokus.id"
                aria-label="Instagram BiarFokus"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@biarfokus.id"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-icon-btn"
                title="TikTok @biarfokus.id"
                aria-label="TikTok BiarFokus"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298 0 .59.043.87.126V9.41a6.33 6.33 0 0 0-.87-.06A6.33 6.33 0 0 0 3.12 15.7 6.34 6.34 0 0 0 9.47 22a6.34 6.34 0 0 0 6.34-6.33V9.17a8.16 8.16 0 0 0 4.78 1.52v-3.4a4.85 4.85 0 0 1-1-.6z"/>
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/company/biarfokus"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-icon-btn"
                title="LinkedIn BiarFokus"
                aria-label="LinkedIn BiarFokus"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </div>
            <div className="footer-links">
              <button type="button" onClick={() => setPomodoroModalOpen(true)}>
                Apa itu Pomodoro?
              </button>
              <button type="button" onClick={() => setAboutModalOpen(true)}>
                Tentang Kami
              </button>
              <button type="button" onClick={() => setTermsModalOpen(true)}>
                Ketentuan Layanan
              </button>
              <button type="button" onClick={() => setFaqModalOpen(true)}>
                FAQ
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* Premium Startup Branded Loading Splash for Desktop & PWA Mobile */}
      {showSplash && (
        <div
          className={`app-startup-splash ${splashFading ? "is-fading" : ""}`}
          aria-label="Memuat aplikasi BiarFokus..."
        >
          {/* Subtle Ambient Radial Aurora Background */}
          <div className="app-splash-aurora" aria-hidden="true" />

          <div className="app-startup-splash-content">
            {/* Elevated Frosted Glass Card */}
            <div className="app-splash-card">
              <div className="app-startup-logo-wrap">
                <img
                  src={dark ? "/biarfokus-logo-dark.png" : "/biarfokus-logo-light.png"}
                  alt="BiarFokus"
                  className="app-startup-logo-img"
                />
              </div>

              {/* Dynamic Loading Progress Bar */}
              <div className="app-splash-progress-track">
                <div className="app-splash-progress-bar" />
              </div>

              {/* Dynamic Step Text */}
              <div className="app-splash-step-text">
                <span className="app-splash-pulse-dot" />
                <span>
                  {splashStep === 0 && "Memuat workspace produktivitas..."}
                  {splashStep === 1 && "Sinkronisasi catatan & jadwal..."}
                  {splashStep === 2 && "Menyiapkan ruang fokus kamu..."}
                </span>
              </div>
            </div>

            {/* Subtle Minimalist Tagline */}
            <p className="app-splash-quote">
              &ldquo;Fokus pada satu hal sampai selesai.&rdquo;
            </p>
          </div>
        </div>
      )}

      {/* Mobile Sticky Footer Bottom Navigation Bar - Universal across ALL pages */}
      <nav className="mobile-bottom-nav" aria-label="Navigasi Bawah Mobile">
        <Link
          href="/"
          className={`mobile-bottom-nav-item ${pathname === "/" ? "active" : ""}`}
        >
          <span className="nav-icon">⏱️</span>
          <span>Timer</span>
        </Link>
        <Link
          href="/catatan"
          className={`mobile-bottom-nav-item ${pathname.startsWith("/catatan") ? "active" : ""}`}
        >
          <span className="nav-icon">📝</span>
          <span>Catatan</span>
        </Link>
        <Link
          href="/kalender"
          className={`mobile-bottom-nav-item ${pathname.startsWith("/kalender") ? "active" : ""}`}
        >
          <span className="nav-icon">📅</span>
          <span>Kalender</span>
        </Link>
        <Link
          href="/kanban"
          className={`mobile-bottom-nav-item ${pathname.startsWith("/kanban") ? "active" : ""}`}
        >
          <span className="nav-icon">📊</span>
          <span>Kanban</span>
        </Link>
        <button
          type="button"
          className="mobile-bottom-nav-item"
          onClick={() => setShowSettings(true)}
          aria-label="Pengaturan"
        >
          <span className="nav-icon">⚙️</span>
          <span>Setting</span>
        </button>
      </nav>

      {/* Desktop Interactive Floating Bottom Dock */}
      <nav className="desktop-floating-dock" aria-label="Navigasi Cepat Desktop">
        <Link
          href="/"
          className={`desktop-dock-item ${pathname === "/" ? "active" : ""}`}
          title="Timer Fokus (Pomodoro)"
        >
          <span className="dock-icon">⏱️</span>
          <span className="dock-label">Timer</span>
        </Link>
        <Link
          href="/catatan"
          className={`desktop-dock-item ${pathname.startsWith("/catatan") ? "active" : ""}`}
          title="Catatan & Todo (Keep)"
        >
          <span className="dock-icon">📝</span>
          <span className="dock-label">Catatan</span>
        </Link>
        <Link
          href="/kalender"
          className={`desktop-dock-item ${pathname.startsWith("/kalender") ? "active" : ""}`}
          title="Kalender & Time-blocking"
        >
          <span className="dock-icon">📅</span>
          <span className="dock-label">Kalender</span>
        </Link>
        <Link
          href="/kanban"
          className={`desktop-dock-item ${pathname.startsWith("/kanban") ? "active" : ""}`}
          title="Project Kanban Board"
        >
          <span className="dock-icon">📊</span>
          <span className="dock-label">Kanban</span>
        </Link>
        <div className="desktop-dock-divider" />
        <button
          type="button"
          className="desktop-dock-item"
          onClick={() => setShowSettings(true)}
          title="Pengaturan Aplikasi"
        >
          <span className="dock-icon">⚙️</span>
          <span className="dock-label">Setting</span>
        </button>
      </nav>

      {/* Quick Notes Floating Action Button (Bottom-Right, 3D Glowing Orb) */}
      {!isWorkspaceView && (
        <button
          type="button"
          className="notes-fab"
          onClick={() => setNotesOpen(true)}
          aria-label="Catatan Fokus Cepat"
          title="Buka Catatan Fokus Cepat (Keep)"
        >
          <span className="notes-fab-gloss" aria-hidden="true" />
          <svg
            className="notes-fab-icon"
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          <span className="notes-fab-sparkle" aria-hidden="true">✦</span>
        </button>
      )}

      {/* Quick Notes Modal */}
      {notesOpen && (
        <NotesModal
          userId={user?.id ?? null}
          onClose={() => setNotesOpen(false)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModalComponent
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          autoStart={autoStart}
          setAutoStart={setAutoStart}
          dark={dark}
          setDark={setDark}
          notificationsEnabled={notificationsEnabled}
          setNotificationsEnabled={setNotificationsEnabled}
          repeatAlarm={repeatAlarm}
          setRepeatAlarm={setRepeatAlarm}
          alarmSound={alarmSound}
          setAlarmSound={setAlarmSound}
          longBreakInterval={longBreakInterval}
          setLongBreakInterval={setLongBreakInterval}
          dailyGoalPomodoros={dailyGoalPomodoros}
          setDailyGoalPomodoros={setDailyGoalPomodoros}
          tickingSoundEnabled={tickingSoundEnabled}
          setTickingSoundEnabled={setTickingSoundEnabled}
          timerDurations={timerDurations}
          setTimerDurations={(nextDurations) => {
            setTimerDurations(nextDurations);
            setSeconds(nextDurations[mode]);
            setRunning(false);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Auth Modal */}
      {loginOpen && (
        <AuthModalComponent
          mode={authMode}
          setMode={setAuthMode}
          onClose={() => setLoginOpen(false)}
        />
      )}

      {/* Account Modal */}
      {accountOpen && (
        <AccountModal
          user={user}
          userName={userName}
          isPro={isPro}
          supabase={getSupabaseBrowserClient()}
          onSaved={setProfileDisplayName}
          onLogout={handleLogout}
          onClose={() => setAccountOpen(false)}
        />
      )}

      {/* Shortcuts Modal */}
      {shortcutsOpen && (
        <ShortcutsModalComponent onClose={() => setShortcutsOpen(false)} />
      )}

      {/* Delete Account Confirmation */}
      {deleteConfirmOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => {
            if (!deletingAccount) setDeleteConfirmOpen(false);
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setDeleteConfirmOpen(false)}
              aria-label="Tutup konfirmasi"
              disabled={deletingAccount}
            >
              ×
            </button>
            <h2>Hapus Akun Permanen?</h2>
            <p className="modal-copy">
              Semua task, riwayat sesi fokus, dan pengaturan akun kamu akan dihapus secara
              permanen dan tidak dapat dipulihkan kembali.
            </p>
            <div className="task-confirm-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={deletingAccount}
              >
                Batal
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={() => void handleDeleteAccount()}
                disabled={deletingAccount}
              >
                {deletingAccount ? "Menghapus..." : "Ya, Hapus Akun"}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Global Error & Info Modals */}
      {authError && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setAuthError(null)}
        >
          <section
            className="modal"
            role="alertdialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setAuthError(null)}
              aria-label="Tutup error"
            >
              ×
            </button>
            <h2>Login gagal</h2>
            <p className="modal-copy">{authError}</p>
            <button className="secondary-button" onClick={() => setAuthError(null)}>
              Tutup
            </button>
          </section>
        </div>
      )}

      {appError && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setAppError(null)}
        >
          <section
            className="modal"
            role="alertdialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setAppError(null)}
              aria-label="Tutup error"
            >
              ×
            </button>
            <h2>Terjadi kesalahan</h2>
            <p className="modal-copy">{appError}</p>
            <button className="secondary-button" onClick={() => setAppError(null)}>
              Tutup
            </button>
          </section>
        </div>
      )}

      {infoOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setInfoOpen(null)}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setInfoOpen(null)}
              aria-label="Tutup"
            >
              ×
            </button>
            <h2>Informasi</h2>
            <p className="modal-copy">{infoOpen}</p>
            <button className="secondary-button" onClick={() => setInfoOpen(null)}>
              Mengerti
            </button>
          </section>
        </div>
      )}

      {aboutModalOpen && <AboutModal onClose={() => setAboutModalOpen(false)} />}
      {pomodoroModalOpen && <PomodoroModal onClose={() => setPomodoroModalOpen(false)} />}
      {termsModalOpen && <TermsModal onClose={() => setTermsModalOpen(false)} />}
      {faqModalOpen && <FaqModal onClose={() => setFaqModalOpen(false)} />}
    </main>
  );
}
