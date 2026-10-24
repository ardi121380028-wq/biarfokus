"use client";

import { Suspense, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/app/providers/app-provider";
import { NotesWorkspaceView } from "@/app/components/notes/notes-workspace-view";

function CatatanContent() {
  const router = useRouter();
  const {
    user,
    authLoading,
    userName,
    userAvatar,
    userRole,
    dark,
    setDark,
    setShowSettings,
    setAccountOpen,
    setLoginOpen,
  } = useAppContext();

  // Prompt login immediately if user is not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      setLoginOpen(true);
    }
  }, [authLoading, user, setLoginOpen]);

  const handleNavigate = useCallback(
    (view: "timer" | "notes" | "calendar" | "kanban" | "stats" | "pricing" | "admin") => {
      switch (view) {
        case "timer":
          router.push("/");
          break;
        case "notes":
          router.push("/catatan");
          break;
        case "calendar":
          if (!user) {
            setLoginOpen(true);
            return;
          }
          router.push("/kalender");
          break;
        case "kanban":
          router.push("/kanban");
          break;
        case "stats":
          if (!user) {
            setLoginOpen(true);
            return;
          }
          router.push("/statistik");
          break;
        case "pricing":
          router.push("/upgrade");
          break;
        case "admin":
          router.push("/admin");
          break;
        default:
          router.push("/");
      }
    },
    [router, user, setLoginOpen],
  );

  // Auth gate for guests
  if (!authLoading && !user) {
    return (
      <div className="auth-gate-container">
        <div className="auth-gate-card">
          <div className="auth-gate-icon">📝</div>
          <h2>Masuk untuk Mengakses Catatan &amp; Todo</h2>
          <p>
            Fitur Catatan Cepat Keep dan checklist to-do tersimpan aman di cloud dan terhubung dengan akun BiarFokus kamu.
          </p>
          <div className="auth-gate-actions">
            <button
              type="button"
              className="auth-gate-primary-btn"
              onClick={() => setLoginOpen(true)}
            >
              🔐 Masuk / Buat Akun Sekarang
            </button>
            <button
              type="button"
              className="auth-gate-secondary-btn"
              onClick={() => router.push("/")}
            >
              ← Kembali ke Timer Fokus
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <NotesWorkspaceView
      userId={user?.id ?? null}
      user={user}
      userName={userName}
      userAvatar={userAvatar}
      userRole={userRole}
      dark={dark}
      onToggleDark={() => setDark((d) => !d)}
      onOpenSettings={() => setShowSettings(true)}
      onOpenProfile={() => setAccountOpen(true)}
      onOpenStats={() => router.push("/statistik")}
      onNavigate={handleNavigate}
      onRequireLogin={() => setLoginOpen(true)}
    />
  );
}

export default function CatatanPage() {
  return (
    <Suspense fallback={<div className="keep-page-view" style={{ minHeight: "80vh" }} />}>
      <CatatanContent />
    </Suspense>
  );
}
