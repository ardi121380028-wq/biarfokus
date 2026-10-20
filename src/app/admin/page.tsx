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
    <Suspense fallback={<div className="inner-page" style={{ minHeight: "80vh" }} />}>
      <AdminContent />
    </Suspense>
  );
}
