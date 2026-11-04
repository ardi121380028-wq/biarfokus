"use client";

import { Suspense } from "react";
import { useAppContext } from "@/app/providers/app-provider";
import { AdminView } from "@/app/components/admin-view";
import { isAdminRole } from "@/features/admin/admin-service";

function AdminContent() {
  const { user, userRole } = useAppContext();

  return <AdminView userId={user?.id ?? null} isAdmin={isAdminRole(userRole)} />;
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="notes-app-workspace admin-workspace-layout">
          <div
            className="notes-workspace-main admin-workspace-main"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100dvh" }}
          >
            <p className="admin-note" style={{ color: "var(--muted)" }}>
              Memuat...
            </p>
          </div>
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
