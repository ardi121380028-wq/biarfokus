"use client";

import { Suspense } from "react";
import { LeaderboardView } from "@/app/components/leaderboard/leaderboard-view";

export default function PeringkatPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "80vh", display: "grid", placeItems: "center" }}>
          <div className="leaderboard-loading">
            <div className="leaderboard-spinner" />
            <span>Memuat papan peringkat...</span>
          </div>
        </div>
      }
    >
      <LeaderboardView />
    </Suspense>
  );
}

