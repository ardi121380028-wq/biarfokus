"use client";

import { Suspense, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppContext } from "@/app/providers/app-provider";
import { KanbanView } from "@/app/components/kanban/kanban-view";

function KanbanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    user,
    userName,
    userAvatar,
    userRole,
    dark,
    setDark,
    setShowSettings,
    setAccountOpen,
    setLoginOpen,
    addTask,
    setInfoOpen,
  } = useAppContext();

  const hasInvite = Boolean(
    searchParams?.get("invite") ||
    searchParams?.get("kanbanInvite")
  );

  // Guard: unauthenticated guest accessing via menu/direct URL must log in
  useEffect(() => {
    if (!user && !hasInvite) {
      setLoginOpen(true);
      router.replace("/");
    }
  }, [user, hasInvite, router, setLoginOpen]);

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
          if (!user) {
            setLoginOpen(true);
            return;
          }
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

  if (!user && !hasInvite) {
    return (
      <div className="kanban-workspace-frame" style={{ minHeight: "80vh", display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center", padding: "24px" }}>
          <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "12px" }}>
            Silakan masuk untuk mengakses Papan Kanban kamu...
          </p>
        </div>
      </div>
    );
  }

  return (
    <KanbanView
      userId={user?.id ?? null}
      user={user}
      userName={userName}
      userAvatar={userAvatar}
      userRole={userRole}
      dark={dark}
      onToggleDark={() => setDark((d) => !d)}
      onOpenSettings={() => setShowSettings(true)}
      onOpenProfile={() => setAccountOpen(true)}
      onNavigate={handleNavigate}
      onSendToFrog={(cardTitle) => {
        void addTask(cardTitle);
        setInfoOpen(`Kartu "${cardTitle}" berhasil dijadikan target Eat Your Frog!`);
      }}
      onRequireLogin={() => setLoginOpen(true)}
    />
  );
}

export default function KanbanPage() {
  return (
    <Suspense fallback={<div className="kanban-workspace-frame" style={{ minHeight: "80vh" }} />}>
      <KanbanContent />
    </Suspense>
  );
}
