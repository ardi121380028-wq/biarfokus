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
import { NotesModal } from "@/app/components/notes-modal";
import { isAdminRole } from "@/features/admin/admin-service";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { trackSiteVisit } from "@/features/analytics/visitor-tracker";

const NAV_LINKS = [
  { href: "/", label: "Timer" },
  { href: "/catatan", label: "Catatan" },
  { href: "/kalender", label: "Kalender" },
  { href: "/kanban", label: "Project Kanban" },
  { href: "/upgrade", label: "Pro" },
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

  const {
    user,
    userRole,
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
              className="icon-button modern-theme-btn"
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
              className="icon-button shortcut-button modern-shortcut-btn"
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
                  className="profile-button"
                  onClick={() => setProfileMenuOpen((open) => !open)}
                  aria-label="Buka menu akun"
                  aria-expanded={profileMenuOpen}
                >
                  {userAvatar ? (
                    <Image src={userAvatar} alt="" width={42} height={42} unoptimized />
                  ) : (
                    <span>{userName.charAt(0).toUpperCase()}</span>
                  )}
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
            <button
              className="menu-button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Buka menu"
              aria-expanded={menuOpen}
            >
              ☰
            </button>
          </div>
        </header>
      )}

      {/* Mobile nav for standard views */}
      {!isWorkspaceView && menuOpen && (
        <nav className="mobile-nav" aria-label="Navigasi mobile">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={isNavActive(href) ? "nav-link active" : "nav-link"}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          {!user && (
            <button
              className="mobile-login-button"
              onClick={() => {
                setLoginOpen(true);
                setMenuOpen(false);
              }}
            >
              🔐 Sign In
            </button>
          )}
        </nav>
      )}

      {/* Page Content */}
      {children}

      {/* Footer for standard views */}
      {!isWorkspaceView && (
        <footer className={`footer ${isDarkBg ? "footer-contrast-light" : ""}`}>
          <div>
            <strong>BiarFokus</strong>
            <span>Bantu kamu fokus selesain setiap pekerjaan.</span>
          </div>
          <div className="footer-links">
            <button type="button" onClick={() => setPomodoroModalOpen(true)}>
              Apa itu Pomodoro?
            </button>
            <button type="button" onClick={() => setAboutModalOpen(true)}>
              Tentang Kami
            </button>
            <a
              href="https://www.instagram.com/biarfokus.id/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link"
            >
              📸 Instagram @biarfokus.id
            </a>
          </div>
          <small>© 2025 biarfokus - All rights reserved</small>
        </footer>
      )}

      {/* Mobile Sticky Footer Bottom Navigation Bar */}
      {!isWorkspaceView && (
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
      )}

      {/* Quick Notes Floating Action Button (Bottom-Right) */}
      {!isWorkspaceView && (
        <button
          className="notes-fab"
          onClick={() => setNotesOpen(true)}
          aria-label="Catatan Fokus Cepat"
          title="Buka Catatan Fokus Cepat (Keep)"
        >
          ✏️
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
    </main>
  );
}
