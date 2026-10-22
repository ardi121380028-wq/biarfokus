"use client";

import { useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { KeepNote, UserRole } from "@/types/domain";
import { filterNotes } from "@/features/notes/notes-service";
import { useKeepNotes } from "@/features/notes/use-keep-notes";
import { NotesSidebar } from "./notes-sidebar";
import { NotesTopbar } from "./notes-topbar";
import { NoteComposer } from "./note-composer";
import { NoteCard } from "./note-card";
import { NoteEditDialog } from "./note-edit-dialog";

type NotesWorkspaceViewProps = {
  userId?: string | null;
  user?: User | null;
  userName?: string;
  userAvatar?: string | null;
  userRole?: UserRole;
  dark?: boolean;
  onToggleDark?: () => void;
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
  onOpenStats?: () => void;
  onNavigate?: (view: "timer" | "notes" | "calendar" | "kanban" | "stats" | "pricing" | "admin") => void;
  onRequireLogin?: () => void;
};

export function NotesWorkspaceView({
  userId,
  userName,
  userAvatar,
  dark,
  onToggleDark,
  onOpenSettings,
  onOpenProfile,
  onOpenStats,
  onNavigate,
  onRequireLogin,
}: NotesWorkspaceViewProps) {
  const {
    notes,
    labels,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    toggleArchive,
    toggleItem,
    createLabel,
  } = useKeepNotes(userId);

  // Collapsible Sidebar state (persisted)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("biarfokus.notes.sidebar_collapsed");
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
        localStorage.setItem("biarfokus.notes.sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  }

  const [searchQuery, setSearchQuery] = useState("");
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | "pinned" | "checklist" | "text" | "archive">("all");
  const [editingNote, setEditingNote] = useState<KeepNote | null>(null);

  const isArchiveView = typeFilter === "archive";

  // Filtered notes
  const filteredNotes = useMemo(() => {
    let list = filterNotes(notes, searchQuery, activeLabel, isArchiveView);
    if (typeFilter === "pinned") {
      list = list.filter((n) => n.pinned);
    } else if (typeFilter === "checklist") {
      list = list.filter((n) => n.type === "checklist");
    } else if (typeFilter === "text") {
      list = list.filter((n) => n.type === "text");
    }
    return list;
  }, [notes, searchQuery, activeLabel, typeFilter, isArchiveView]);

  const pinnedNotes = useMemo(
    () => (isArchiveView ? [] : filteredNotes.filter((n) => n.pinned)),
    [filteredNotes, isArchiveView],
  );
  const otherNotes = useMemo(
    () => (isArchiveView ? filteredNotes : filteredNotes.filter((n) => !n.pinned)),
    [filteredNotes, isArchiveView],
  );

  // Counts
  const totalCount = useMemo(() => notes.filter((n) => !n.archived).length, [notes]);
  const pinnedCount = useMemo(() => notes.filter((n) => !n.archived && n.pinned).length, [notes]);
  const checklistCount = useMemo(() => notes.filter((n) => !n.archived && n.type === "checklist").length, [notes]);
  const textCount = useMemo(() => notes.filter((n) => !n.archived && n.type === "text").length, [notes]);
  const archivedCount = useMemo(() => notes.filter((n) => n.archived).length, [notes]);

  function getLabelCount(lbl: string): number {
    return notes.filter((n) =>
      !n.archived && n.labels?.some((l) => l.toLowerCase() === lbl.toLowerCase()),
    ).length;
  }

  return (
    <div className="notes-app-workspace">
      {/* Collapsible Left Sidebar - Identical layout to Kanban & Calendar */}
      <NotesSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        totalCount={totalCount}
        pinnedCount={pinnedCount}
        checklistCount={checklistCount}
        textCount={textCount}
        archivedCount={archivedCount}
        typeFilter={typeFilter}
        onSelectTypeFilter={setTypeFilter}
        labels={labels}
        activeLabel={activeLabel}
        onSelectLabel={setActiveLabel}
        getLabelCount={getLabelCount}
        onCreateLabel={createLabel}
        onNavigate={onNavigate}
        onOpenSettings={onOpenSettings}
        dark={dark}
        onToggleDark={onToggleDark}
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
      <div className="notes-workspace-main">
        <NotesTopbar
          onToggleSidebar={toggleSidebar}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          dark={dark}
          onToggleDark={onToggleDark}
          onOpenSettings={onOpenSettings}
          onOpenProfile={onOpenProfile}
          onOpenStats={onOpenStats}
          userName={userName}
          userAvatar={userAvatar}
          onRequireLogin={onRequireLogin}
          onNavigate={onNavigate}
        />

        {/* Content Canvas */}
        <main className="notes-workspace-content">
          <div className="notes-workspace-inner">
            {/* Note Composer Container (hidden in Archive view so users don't accidentally compose archived notes) */}
            {!isArchiveView && (
              <div className="notes-composer-wrapper">
                <NoteComposer
                  labels={labels}
                  onCreateNote={createNote}
                  onCreateLabel={createLabel}
                />
              </div>
            )}

            {isArchiveView ? (
              <section className="keep-notes-section">
                <span className="keep-section-header">
                  📦 ARSIP CATATAN ({filteredNotes.length})
                </span>
                {filteredNotes.length > 0 ? (
                  <div className="keep-grid">
                    {filteredNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onEdit={setEditingNote}
                        onTogglePin={togglePin}
                        onToggleArchive={toggleArchive}
                        onToggleItem={toggleItem}
                        onDelete={deleteNote}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="keep-empty-placeholder">
                    <span className="empty-icon">📦</span>
                    <h3>Belum ada catatan yang diarsipkan</h3>
                    <p>
                      {searchQuery || activeLabel
                        ? "Tidak ada arsip yang cocok dengan pencarian kamu."
                        : "Kamu bisa mengarsipkan catatan yang sudah selesai agar ruang kerja tetap fokus dan rapi."}
                    </p>
                  </div>
                )}
              </section>
            ) : (
              <>
                {/* Pinned Notes Section */}
                {pinnedNotes.length > 0 && (
                  <section className="keep-notes-section">
                    <span className="keep-section-header">
                      📌 DISEMATKAN ({pinnedNotes.length})
                    </span>
                    <div className="keep-grid">
                      {pinnedNotes.map((note) => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          onEdit={setEditingNote}
                          onTogglePin={togglePin}
                          onToggleArchive={toggleArchive}
                          onToggleItem={toggleItem}
                          onDelete={deleteNote}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Other Notes Section */}
                <section className="keep-notes-section">
                  {pinnedNotes.length > 0 && otherNotes.length > 0 && (
                    <span className="keep-section-header">
                      LAINNYA ({otherNotes.length})
                    </span>
                  )}
                  {otherNotes.length > 0 ? (
                    <div className="keep-grid">
                      {otherNotes.map((note) => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          onEdit={setEditingNote}
                          onTogglePin={togglePin}
                          onToggleArchive={toggleArchive}
                          onToggleItem={toggleItem}
                          onDelete={deleteNote}
                        />
                      ))}
                    </div>
                  ) : (
                    pinnedNotes.length === 0 && (
                      <div className="keep-empty-placeholder">
                        <span className="empty-icon">📝</span>
                        <h3>Belum ada catatan</h3>
                        <p>
                          {searchQuery || activeLabel || typeFilter !== "all"
                            ? "Tidak ada catatan yang cocok dengan filter kamu."
                            : "Mulai buat to-do list, catatan ide, atau frog task di atas."}
                        </p>
                      </div>
                    )
                  )}
                </section>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Note Edit Modal Dialog */}
      {editingNote && (
        <NoteEditDialog
          note={editingNote}
          labels={labels}
          onSave={updateNote}
          onDelete={deleteNote}
          onClose={() => setEditingNote(null)}
          onCreateLabel={createLabel}
          onToggleArchive={toggleArchive}
        />
      )}
    </div>
  );
}
