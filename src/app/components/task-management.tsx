"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import type { KeepNote, Task } from "@/types/domain";
import type { LinkedNoteMeta } from "@/features/tasks/task-service";
import { useOutsideClick } from "@/lib/hooks/use-dismiss";
import { NoteTaskPickerModal } from "./notes/note-task-picker-modal";
import { QuickTimeblockModal } from "./calendar/quick-timeblock-modal";
import { useAppContext } from "@/app/providers/app-provider";

type TaskManagementProps = {
  tasks: Task[];
  focusedTaskId: string | null;
  onSelectTask: (taskId: string | null) => void;
  onReorderTasks?: (sourceIndex: number, destinationIndex: number) => void;
  onAdd: (title: string, linkedMeta?: LinkedNoteMeta) => Promise<void>;
  onToggle: (task: Task) => Promise<void>;
  onDelete: (task: Task) => Promise<void>;
  onDeleteCompleted: () => Promise<void>;
  onDeleteAll: () => Promise<void>;
  notes?: KeepNote[];
  onOpenNotes?: () => void;
};

export function TaskManagement({
  tasks,
  focusedTaskId,
  onSelectTask,
  onReorderTasks,
  onAdd,
  onToggle,
  onDelete,
  onDeleteCompleted,
  onDeleteAll,
  notes,
  onOpenNotes,
}: TaskManagementProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [newTask, setNewTask] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const taskMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(taskMenuRef, () => setMenuOpen(false), menuOpen);
  const { user } = useAppContext();
  const [notePickerOpen, setNotePickerOpen] = useState(false);
  const [timeblockTarget, setTimeblockTarget] = useState<{ task: Task; isFrog: boolean } | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<"task" | "completed" | "all" | null>(null);
  const [mounted, setMounted] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragOverPos, setDragOverPos] = useState<"above" | "below" | null>(null);
  const touchStartRef = useRef<{ y: number; index: number } | null>(null);

  function handleDragStart(e: React.DragEvent<HTMLDivElement>, index: number) {
    if (submitting || activeTaskId) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>, index: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) {
      setDragOverIndex(null);
      setDragOverPos(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const pos = e.clientY < midY ? "above" : "below";
    setDragOverIndex(index);
    setDragOverPos(pos);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverIndex(null);
      setDragOverPos(null);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>, index: number) {
    e.preventDefault();
    if (draggedIndex === null || !onReorderTasks) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      setDragOverPos(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const isAbove = e.clientY < midY;
    let targetIndex = index;
    if (draggedIndex < index && isAbove) {
      targetIndex = index - 1;
    } else if (draggedIndex > index && !isAbove) {
      targetIndex = index + 1;
    }
    if (targetIndex !== draggedIndex) {
      onReorderTasks(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDragOverPos(null);
  }

  function handleDragEnd() {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDragOverPos(null);
  }

  function handleTouchStart(e: React.TouchEvent, index: number) {
    if (submitting || activeTaskId) return;
    const touch = e.touches[0];
    touchStartRef.current = { y: touch.clientY, index };
    setDraggedIndex(index);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const rowBelow = elemBelow?.closest("[data-task-index]") as HTMLElement | null;
    if (rowBelow) {
      const idx = Number(rowBelow.getAttribute("data-task-index"));
      if (!Number.isNaN(idx) && idx !== dragOverIndex) {
        setDragOverIndex(idx);
      }
    }
  }

  function handleTouchEnd() {
    if (touchStartRef.current && dragOverIndex !== null && onReorderTasks) {
      if (touchStartRef.current.index !== dragOverIndex) {
        onReorderTasks(touchStartRef.current.index, dragOverIndex);
      }
    }
    touchStartRef.current = null;
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDragOverPos(null);
  }

  useEffect(() => {
    setMounted(true);
  }, []);
  const completedTasks = tasks.filter((task) => task.done).length;
  const activeTasks = tasks.filter((task) => !task.done);
  const archivedTasks = tasks.filter((task) => task.done);
  const taskToDelete = confirmation === "task" ? tasks.find((task) => task.id === activeTaskId) : null;

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTask.trim();
    if (!title || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      await onAdd(title);
      setNewTask("");
      requestAnimationFrame(() => inputRef.current?.focus());
    } catch (operationError) {
      setError(operationError instanceof Error ? operationError.message : "Task gagal disimpan.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(task: Task) {
    if (submitting || activeTaskId) return;
    setActiveTaskId(task.id);
    setError(null);
    try {
      await onToggle(task);
    } catch (operationError) {
      setError(operationError instanceof Error ? operationError.message : "Task gagal diperbarui.");
    } finally {
      setActiveTaskId(null);
    }
  }

  async function handleDelete(task: Task) {
    if (submitting || activeTaskId) return;
    setActiveTaskId(task.id);
    setConfirmation("task");
  }

  async function confirmDelete() {
    if (!confirmation || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      if (confirmation === "task" && taskToDelete) await onDelete(taskToDelete);
      if (confirmation === "completed") await onDeleteCompleted();
      if (confirmation === "all") await onDeleteAll();
      setConfirmation(null);
      setActiveTaskId(null);
      setMenuOpen(false);
    } catch (operationError) {
      setError(operationError instanceof Error ? operationError.message : "Task gagal dihapus.");
    } finally {
      setSubmitting(false);
      setActiveTaskId(null);
    }
  }

  function requestBulkDelete(type: "completed" | "all") {
    if (submitting || !tasks.length || (type === "completed" && !completedTasks)) return;
    setMenuOpen(false);
    setConfirmation(type);
  }

  return (
    <section className="task-card card">
      <div className="section-heading">
        <div><p className="eyebrow">Fokus hari ini</p><h1>Eat Your Frog</h1></div>
        <div className="task-heading-actions">
          <span className="progress-count">{completedTasks}/{tasks.length}</span>
          <div className="task-menu" ref={taskMenuRef}>
            <button
              type="button"
              className="task-menu-button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Aksi task"
              aria-expanded={menuOpen}
              title="Menu Tindakan Task"
            >
              ⋯
            </button>
            {menuOpen && (
              <div className="task-menu-popover" role="menu">
                <button
                  type="button"
                  onClick={() => requestBulkDelete("completed")}
                  disabled={!completedTasks}
                >
                  <span>🧹</span>
                  <span>Hapus yang selesai ({completedTasks})</span>
                </button>
                <button
                  type="button"
                  onClick={() => requestBulkDelete("all")}
                  disabled={!tasks.length}
                >
                  <span>🗑️</span>
                  <span>Hapus semua task ({tasks.length})</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <form className="task-form" onSubmit={(event) => void handleAdd(event)}>
        <input
          ref={inputRef}
          value={newTask}
          onChange={(event) => setNewTask(event.target.value)}
          placeholder="Tambahkan tugas baru..."
          aria-label="Tugas baru"
          maxLength={200}
          disabled={submitting}
        />
        <button type="submit" disabled={submitting || !newTask.trim()}>
          {submitting ? "..." : "Tambah"}
        </button>
        <button
          type="button"
          className="task-import-notes-btn"
          onClick={() => setNotePickerOpen(true)}
          title="Ambil tugas dari Catatan"
          aria-label="Ambil tugas dari Catatan"
        >
          📝 Catatan
        </button>
      </form>
      {error && <p className="task-error" role="alert">{error}</p>}
      {feedbackMessage && (
        <div
          className="task-success-toast"
          role="status"
          style={{
            padding: "8px 14px",
            background: "color-mix(in srgb, #10b981 12%, var(--paper))",
            border: "1px solid color-mix(in srgb, #10b981 30%, transparent)",
            color: "#059669",
            borderRadius: "10px",
            fontSize: "12px",
            fontWeight: 700,
            marginBottom: "10px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>✓</span>
          <span>{feedbackMessage}</span>
        </div>
      )}
      <div className="task-list">
        {activeTasks.length === 0 && !archivedTasks.length && <p className="task-empty">Belum ada task. Tambahkan fokus pertamamu.</p>}
        {activeTasks.map((task, index) => {
          const isFocused = task.id === focusedTaskId;
          return (
            <div
              className={`task ${isFocused ? "focused" : ""} ${draggedIndex === index ? "is-dragging" : ""} ${dragOverIndex === index ? (dragOverPos === "above" ? "drag-over-above" : "drag-over-below") : ""}`}
              key={task.id}
              data-task-index={index}
              draggable={!submitting && activeTaskId === null}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              <span
                className="task-drag-handle"
                style={{ touchAction: "none" }}
                title="Tahan dan geser untuk ubah urutan prioritas"
                aria-label="Geser urutan prioritas"
                onTouchStart={(e) => handleTouchStart(e, index)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
              >
                ⠿
              </span>
              <label className="task-check">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => void handleToggle(task)}
                  disabled={activeTaskId !== null}
                />
                <span className="checkmark" />
                <div className="task-title-group">
                  <span className="task-title">{task.title}</span>
                  {task.linkedNoteTitle && (
                    <span
                      className="task-linked-badge"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onOpenNotes?.();
                      }}
                      title={`Terhubung dengan Catatan "${task.linkedNoteTitle}". Klik untuk membuka Catatan.`}
                    >
                      📝 {task.linkedNoteTitle}
                      {task.linkedItemText && task.linkedItemText !== task.title ? ` · ${task.linkedItemText}` : ""}
                    </span>
                  )}
                </div>
              </label>
              <button
                type="button"
                className={isFocused ? "task-focus-btn active" : "task-focus-btn"}
                onClick={() => onSelectTask(isFocused ? null : task.id)}
                aria-pressed={isFocused}
                title={isFocused ? "Klik untuk membatalkan fokus aktif" : "Jadikan fokus aktif"}
              >
                {isFocused ? "🎯 Fokus" : "Pilih"}
              </button>
              <button
                type="button"
                className="task-timeblock-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setTimeblockTarget({ task, isFrog: index === 0 });
                }}
                title={index === 0 ? "Timeblock target Eat Your Frog di Kalender" : "Timeblock tugas ini di Kalender"}
                aria-label={`Timeblock ${task.title} di Kalender`}
              >
                <span>📅</span>
              </button>
              <span className="task-pomos">🍅 {task.pomodoros}</span>
              <button
                type="button"
                className="task-delete"
                onClick={() => void handleDelete(task)}
                disabled={activeTaskId !== null}
                aria-label={`Hapus task ${task.title}`}
                title="Hapus task"
              >
                ×
              </button>
            </div>
          );
        })}
        {archivedTasks.length > 0 && <div className={archiveOpen ? "task-archive expanded" : "task-archive"}>
          <button type="button" className="archive-toggle" onClick={() => setArchiveOpen((open) => !open)} aria-expanded={archiveOpen}>
            <span>Archive ({archivedTasks.length})</span><span>{archiveOpen ? "⌃" : "⌄"}</span>
          </button>
          {archiveOpen && <div className="archive-list">{archivedTasks.map((task) => (
            <div className="task done" key={task.id}>
              <label className="task-check">
                <input type="checkbox" checked={task.done} onChange={() => void handleToggle(task)} disabled={activeTaskId !== null} />
                <span className="checkmark" />
                <div className="task-title-group">
                  <span className="task-title">{task.title}</span>
                  {task.linkedNoteTitle && (
                    <span
                      className="task-linked-badge"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onOpenNotes?.();
                      }}
                      title={`Terhubung dengan Catatan "${task.linkedNoteTitle}". Klik untuk membuka Catatan.`}
                    >
                      📝 {task.linkedNoteTitle}
                    </span>
                  )}
                </div>
              </label>
              <span className="task-pomos">🍅 {task.pomodoros}</span>
              <button type="button" className="task-delete" onClick={() => void handleDelete(task)} disabled={activeTaskId !== null} aria-label={`Hapus task ${task.title}`} title="Hapus task">×</button>
            </div>
          ))}</div>}
        </div>}
      </div>
      {confirmation && mounted && createPortal(
        <div className="task-confirm-backdrop" role="presentation" onClick={() => { if (!submitting) { setConfirmation(null); setActiveTaskId(null); } }}>
          <section className="task-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="task-confirm-title" onClick={(event) => event.stopPropagation()}>
            <h2 id="task-confirm-title">{confirmation === "all" ? "Hapus semua task?" : confirmation === "completed" ? "Hapus task selesai?" : "Hapus task?"}</h2>
            <p>{confirmation === "all" ? "Semua task akan dihapus permanen." : confirmation === "completed" ? "Semua task di archive akan dihapus permanen." : `Task "${taskToDelete?.title ?? ""}" akan dihapus permanen.`}</p>
            <div className="task-confirm-actions">
              <button type="button" className="secondary-button" onClick={() => { setConfirmation(null); setActiveTaskId(null); }} disabled={submitting}>Batal</button>
              <button type="button" className="danger-button" onClick={() => void confirmDelete()} disabled={submitting}>{submitting ? "Menghapus..." : "Hapus"}</button>
            </div>
          </section>
        </div>,
        document.body
      )}
      {notePickerOpen && mounted && createPortal(
        <NoteTaskPickerModal
          notes={notes ?? []}
          tasks={tasks}
          onSelect={(item) => {
            void onAdd(item.title, {
              linkedNoteId: item.linkedNoteId,
              linkedNoteTitle: item.linkedNoteTitle,
              linkedItemId: item.linkedItemId,
              linkedItemText: item.linkedItemText,
            });
          }}
          onClose={() => setNotePickerOpen(false)}
          onOpenNotes={onOpenNotes}
        />,
        document.body
      )}
      {timeblockTarget && mounted && createPortal(
        <QuickTimeblockModal
          isOpen={true}
          onClose={() => setTimeblockTarget(null)}
          initialTitle={timeblockTarget.task.title}
          sourceNoteId={timeblockTarget.task.linkedNoteId}
          sourceNoteTitle={timeblockTarget.task.linkedNoteTitle}
          sourceItemId={timeblockTarget.task.linkedItemId}
          sourceItemText={timeblockTarget.task.linkedItemText}
          isFrog={timeblockTarget.isFrog}
          userId={user?.id}
          onSuccess={(ev) => {
            const msg = `Tugas "${ev.title}" berhasil dijadwalkan di Kalender!`;
            setFeedbackMessage(msg);
            setTimeout(() => setFeedbackMessage(null), 3500);
          }}
        />,
        document.body
      )}
    </section>
  );
}
