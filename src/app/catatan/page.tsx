"use client";

import { Suspense, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/app/providers/app-provider";
import { NotesWorkspaceView } from "@/app/components/notes/notes-workspace-view";

function CatatanContent() {
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
