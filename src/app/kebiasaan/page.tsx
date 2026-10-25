"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/app/providers/app-provider";
import { HabitsWorkspaceView } from "@/app/components/habits/habits-workspace-view";

function KebiasaanContent() {
  const router = useRouter();
  const { user, authLoading, setLoginOpen } = useAppContext();

  // Guard: prompt login if guest attempts to access habit tracker
  useEffect(() => {
    if (!authLoading && !user) {
      setLoginOpen(true);
      router.replace("/");
    }
  }, [authLoading, user, router, setLoginOpen]);

  if (!user) {
    return (
      <div className="kanban-workspace-frame" style={{ minHeight: "80vh", display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center", padding: "24px" }}>
          <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "12px" }}>
            Silakan masuk untuk mengakses Pelacak Kebiasaan kamu...
          </p>
        </div>
      </div>
    );
  }

  return <HabitsWorkspaceView userId={user.id} />;
}

export default function KebiasaanPage() {
  return (
    <Suspense fallback={<div className="kanban-workspace-frame" style={{ minHeight: "80vh" }} />}>
      <KebiasaanContent />
    </Suspense>
  );
}
