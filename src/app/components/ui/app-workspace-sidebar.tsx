"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/app/providers/app-provider";

type AppWorkspaceSidebarProps = {
  badge: string;
  activeModule?: "timer" | "notes" | "calendar" | "kanban" | "habits" | "settings" | "admin";
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  children?: ReactNode;
};

export function AppWorkspaceSidebar({
  badge,
  activeModule,
  isCollapsed,
  onToggleCollapse,
  children,
}: AppWorkspaceSidebarProps) {
  const router = useRouter();
  const { user, userRole, setLoginOpen } = useAppContext();

  function handleNavigate(path: string, requiresAuth = false) {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      if (!isCollapsed) onToggleCollapse();
    }
    if (requiresAuth && !user) {
      setLoginOpen(true);
      return;
    }
    router.push(path);
  }

  return (
    <aside
      className={`kanban-workspace-sidebar ${isCollapsed ? "is-collapsed" : ""}`}
      aria-label={`Sidebar ${badge}`}
    >
      {/* Sidebar Top / Brand */}
      <div className="kanban-sidebar-top">
        {!isCollapsed ? (
          <div className="kanban-sidebar-brand-row">
            <button
              type="button"
              className="kanban-sidebar-brand-btn"
              onClick={() => handleNavigate("/")}
              title="Kembali ke Timer Fokus"
            >
              <img
                src="/biarfokus-logo-light.png"
                alt="biarfokus"
                className="sidebar-brand-logo-img light-only"
              />
              <img
                src="/biarfokus-logo-dark.png"
                alt="biarfokus"
                className="sidebar-brand-logo-img dark-only"
              />
              <span className="kanban-sidebar-badge">{badge}</span>
            </button>
            <button
              type="button"
              className="kanban-sidebar-toggle-btn"
              onClick={onToggleCollapse}
              aria-label="Tutup sidebar"
              title="Tutup sidebar"
            >
              ‹
            </button>
          </div>
        ) : (
          <div className="kanban-sidebar-collapsed-header">
            <button
              type="button"
              className="kanban-sidebar-toggle-btn collapsed"
              onClick={onToggleCollapse}
              aria-label="Buka sidebar"
              title="Buka sidebar"
            >
              ›
            </button>
            <span className="brand-mark small" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Main Navigation to other BiarFokus modules */}
      <div className="kanban-sidebar-section">
        {!isCollapsed && <span className="kanban-sidebar-section-title">Aplikasi</span>}
        <nav className="kanban-sidebar-nav">
          <button
            type="button"
            className={`kanban-sidebar-nav-item ${activeModule === "timer" ? "active" : ""}`}
            onClick={() => handleNavigate("/")}
            title="Timer Pomodoro"
          >
            <span className="nav-icon">⏱️</span>
            {!isCollapsed && <span className="nav-label">Timer Fokus</span>}
          </button>
          <button
            type="button"
            className={`kanban-sidebar-nav-item ${activeModule === "notes" ? "active" : ""}`}
            onClick={() => handleNavigate("/catatan")}
            title="Catatan & Todo"
          >
            <span className="nav-icon">📝</span>
            {!isCollapsed && <span className="nav-label">Catatan &amp; Todo</span>}
          </button>
          <button
            type="button"
            className={`kanban-sidebar-nav-item ${activeModule === "calendar" ? "active" : ""}`}
            onClick={() => handleNavigate("/kalender", true)}
            title="Kalender Jadwal"
          >
            <span className="nav-icon">📅</span>
            {!isCollapsed && <span className="nav-label">Kalender</span>}
          </button>
          <button
            type="button"
            className={`kanban-sidebar-nav-item ${activeModule === "kanban" ? "active" : ""}`}
            onClick={() => handleNavigate("/kanban", true)}
            title="Project Kanban"
          >
            <span className="nav-icon">📋</span>
            {!isCollapsed && <span className="nav-label">Project Kanban</span>}
          </button>
          <button
            type="button"
            className={`kanban-sidebar-nav-item ${activeModule === "habits" ? "active" : ""}`}
            onClick={() => handleNavigate("/kebiasaan", true)}
            title="Pelacak Kebiasaan"
          >
            <span className="nav-icon">⚡</span>
            {!isCollapsed && <span className="nav-label">Kebiasaan</span>}
          </button>
        </nav>
      </div>

      {/* Custom Section (e.g. tabs for settings or admin) */}
      {children}

      {/* Sidebar Footer Controls */}
      <div className="kanban-sidebar-footer">
        {userRole === "admin" && (
          <Link
            href="/admin"
            className={`kanban-sidebar-footer-btn ${activeModule === "admin" ? "active" : ""}`}
            title="Admin Dashboard"
          >
            <span className="footer-icon-wrap" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            {!isCollapsed && <span>Admin Dashboard</span>}
          </Link>
        )}
        <Link
          href="/fitur"
          className="kanban-sidebar-footer-btn"
          title="Fitur & Panduan"
        >
          <span className="footer-icon-wrap" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
          {!isCollapsed && <span>Fitur &amp; Panduan</span>}
        </Link>
        <Link
          href="/pengaturan"
          className={`kanban-sidebar-footer-btn ${activeModule === "settings" ? "active" : ""}`}
          title="Pengaturan"
        >
          <span className="footer-icon-wrap" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </span>
          {!isCollapsed && <span>Pengaturan</span>}
        </Link>
      </div>
    </aside>
  );
}

