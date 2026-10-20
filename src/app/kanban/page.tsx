"use client";

import { Suspense, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/app/providers/app-provider";
import { KanbanView } from "@/app/components/kanban/kanban-view";

function KanbanContent() {
  const router = useRouter();
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
          router.push("/kalender");
          break;
        case "kanban":
          router.push("/kanban");
          break;
        case "stats":
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
    [router],
  );

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
