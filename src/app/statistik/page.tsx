"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/app/providers/app-provider";
import { StatsView } from "@/app/components/stats-view";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function StatsContent() {
  const router = useRouter();
  const { user, completedTasks } = useAppContext();

  return (
    <StatsView
      key={user?.id ?? "guest"}
      supabase={getSupabaseBrowserClient()}
      userId={user?.id ?? null}
      completedTasks={completedTasks}
      onGoTimer={() => router.push("/")}
    />
  );
}

export default function StatistikPage() {
  return (
    <Suspense fallback={<div className="inner-page" style={{ minHeight: "80vh" }} />}>
      <StatsContent />
    </Suspense>
  );
}
