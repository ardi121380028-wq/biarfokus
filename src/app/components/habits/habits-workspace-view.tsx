"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/app/providers/app-provider";
import { useHabits } from "@/features/habits/use-habits";
import { HabitsSidebar, type HabitViewMode } from "./habits-sidebar";
import { HabitsTopbar } from "./habits-topbar";
import { HabitsChecklistView } from "./habits-checklist-view";
import { HabitsMatrixView } from "./habits-matrix-view";
import { HabitsHeatmapView } from "./habits-heatmap-view";
import { HabitModal } from "./habit-modal";
import type { Habit } from "@/features/habits/habit-types";

interface HabitsWorkspaceViewProps {
  userId?: string | null;
}

export function HabitsWorkspaceView({ userId }: HabitsWorkspaceViewProps) {
  const router = useRouter();
  const {
    user,
    userName,
    userAvatar,
    dark,
    setDark,
    setShowSettings,
    setAccountOpen,
    setLoginOpen,
  } = useAppContext();

  const {
    habits,
    filteredHabits,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    stats,
    heatmap,
    toggleCheckin,
    addHabit,
    updateHabit,
    deleteHabit,
  } = useHabits(userId);

  // View Mode: matrix (default weekly view), checklist, heatmap
  const [activeView, setActiveView] = useState<HabitViewMode>("matrix");

  // Sidebar collapsed state (persisted)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("biarfokus.habits.sidebar_collapsed");
        if (stored !== null) return stored === "true";
        return window.innerWidth < 1024;
      } catch {}
    }
    return false;
  });

  function toggleSidebar() {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("biarfokus.habits.sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  }

  // Navigation handler to standard BiarFokus modules
  const handleNavigate = (view: "timer" | "notes" | "calendar" | "kanban" | "habits" | "stats" | "pricing" | "admin") => {
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
  };

  // Modal create/edit state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const handleOpenAdd = () => {
    setEditingHabit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setModalOpen(true);
  };

  const handleSaveModal = (
    data: Omit<Habit, "id" | "completedDates" | "streakCurrent" | "streakBest" | "createdAt">
  ) => {
    if (editingHabit) {
      updateHabit(editingHabit.id, data);
    } else {
      addHabit(data);
    }
  };

  return (
    <div className="kanban-workspace-frame habits-workspace-frame">
      {/* Workspace Sidebar */}
      <HabitsSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        habits={habits}
        activeFilter={filter}
        onSelectFilter={setFilter}
        activeView={activeView}
        onSelectView={setActiveView}
        onOpenCreateModal={handleOpenAdd}
        onNavigate={handleNavigate}
      />

      {/* Mobile Backdrop for Expanded Sidebar */}
      {!sidebarCollapsed && (
        <div
          className="kanban-sidebar-mobile-backdrop"
          onClick={toggleSidebar}
          aria-label="Tutup menu navigasi"
        />
      )}

      {/* Main Workspace Layout */}
      <div className="notes-workspace-main habits-workspace-main">
        {/* Workspace Topbar */}
        <HabitsTopbar
          onToggleSidebar={toggleSidebar}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeView={activeView}
          onSelectView={setActiveView}
          activeFilter={filter}
          onOpenCreateModal={handleOpenAdd}
          dark={dark}
          onToggleDark={() => setDark((d) => !d)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenProfile={() => setAccountOpen(true)}
          onOpenStats={() => router.push("/statistik")}
          userName={userName}
          userAvatar={userAvatar}
          onRequireLogin={() => setLoginOpen(true)}
          onNavigate={handleNavigate}
        />

        {/* Content View Switcher */}
        <main className="habits-workspace-content-scroll" aria-label="Konten Pelacak Kebiasaan">
          <div className="habits-workspace-content-inner">
            {activeView === "checklist" && (
              <HabitsChecklistView
                habits={filteredHabits}
                onToggleCheckin={toggleCheckin}
                onEdit={handleOpenEdit}
                onDelete={deleteHabit}
                onOpenCreateModal={handleOpenAdd}
                activeFilter={filter}
              />
            )}

            {activeView === "matrix" && (
              <HabitsMatrixView
                habits={filteredHabits}
                onToggleCheckin={toggleCheckin}
                onEdit={handleOpenEdit}
                onDelete={deleteHabit}
                onOpenCreateModal={handleOpenAdd}
              />
            )}

            {activeView === "heatmap" && (
              <HabitsHeatmapView
                stats={stats}
                heatmap={heatmap}
                habits={habits}
                userName={userName || user?.email?.split("@")[0] || "Pengguna BiarFokus"}
                onToggleCheckin={toggleCheckin}
                onEdit={handleOpenEdit}
                onDelete={deleteHabit}
                onOpenCreateModal={handleOpenAdd}
              />
            )}
          </div>
        </main>
      </div>



      {/* Wide 2-Column Habit Creation / Edit Modal */}
      {modalOpen && (
        <HabitModal
          initialHabit={editingHabit}
          onSave={handleSaveModal}
          onClose={() => {
            setModalOpen(false);
            setEditingHabit(null);
          }}
        />
      )}
    </div>
  );
}
