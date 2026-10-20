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

  return (
    <main
      className={
        isWorkspaceView
          ? dark
            ? "app dark kanban-workspace-mode"
            : "app kanban-workspace-mode"
          : dark
            ? "app dark"
            : "app"
      }
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
            <span className="brand-mark" aria-hidden="true" />
            <span>biarfokus</span>
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
              className="icon-button"
              onClick={() => setDark(!dark)}
              aria-label="Ganti tema"
            >
              {dark ? "☀" : "☾"}
            </button>
            <button
              className="icon-button shortcut-button"
              onClick={() => setShortcutsOpen(true)}
              aria-label="Keyboard shortcuts"
            >
              ?
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
        <footer className="footer">
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
