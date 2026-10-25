"use client";

import { Suspense, useEffect } from "react";
import { useAppContext } from "@/app/providers/app-provider";
import { HabitsWorkspaceView } from "@/app/components/habits/habits-workspace-view";

function KebiasaanContent() {
  const { user, authLoading, setLoginOpen } = useAppContext();

  // Prompt login immediately if unauthenticated
  useEffect(() => {
    if (!authLoading && !user) {
      setLoginOpen(true);
    }
  }, [authLoading, user, setLoginOpen]);

  return (
    <main className="inner-page habits-page-page">
      <HabitsWorkspaceView userId={user?.id ?? null} />
    </main>
  );
}

export default function KebiasaanPage() {
  return (
    <Suspense fallback={<div className="inner-page" style={{ minHeight: "80vh" }} />}>
      <KebiasaanContent />
    </Suspense>
  );
}
