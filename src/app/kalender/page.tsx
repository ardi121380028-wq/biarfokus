"use client";

import { Suspense, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/app/providers/app-provider";
import { CalendarView } from "@/app/components/calendar-view";

function KalenderContent() {
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
    (view: "timer" | "notes" | "calendar" | "kanban" | "habits" | "stats" | "pricing" | "admin") => {
      switch (view) {
        case "timer":
          router.push("/");
          break;
        case "notes":
          if (!user) {
            setLoginOpen(true);
            return;
          }
          router.push("/catatan");
          break;
        case "calendar":
          router.push("/kalender");
          break;
        case "kanban":
          router.push("/kanban");
          break;
        case "habits":
          if (!user) {
            setLoginOpen(true);
            return;
          }
          router.push("/kebiasaan");
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
          <div className="auth-gate-icon">📅</div>
          <h2>Masuk untuk Mengakses Time-Blocking Kalender</h2>
          <p>
            Fitur penjadwalan blok waktu dan sinkronisasi sesi fokus terhubung dengan akun BiarFokus kamu.
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
    <CalendarView
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
      onNavigateToNotes={() => {
        if (!user) {
          setLoginOpen(true);
          return;
        }
        router.push("/catatan");
      }}
      onRequireLogin={() => setLoginOpen(true)}
    />
  );
}

export default function KalenderPage() {
  return (
    <Suspense fallback={<div className="calendar-view-container" style={{ minHeight: "80vh" }} />}>
      <KalenderContent />
    </Suspense>
  );
}
