"use client";

import { useRef, useState, type FormEvent } from "react";
import type { Task } from "@/types/domain";

type TaskManagementProps = {
  tasks: Task[];
  onAdd: (title: string) => Promise<void>;
  onToggle: (task: Task) => Promise<void>;
  onDelete: (task: Task) => Promise<void>;
  onDeleteCompleted: () => Promise<void>;
  onDeleteAll: () => Promise<void>;
};

export function TaskManagement({
  tasks,
  onAdd,
  onToggle,
  onDelete,
  onDeleteCompleted,
  onDeleteAll,
}: TaskManagementProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [newTask, setNewTask] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<"task" | "completed" | "all" | null>(null);
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
        <div><p className="eyebrow">Fokus hari ini</p><h1>Task Management</h1></div>
        <div className="task-heading-actions">
          <span className="progress-count">{completedTasks}/{tasks.length}</span>
          <div className="task-menu">
            <button type="button" className="task-menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label="Aksi task" aria-expanded={menuOpen}>⋯</button>
            {menuOpen && <div className="task-menu-popover" role="menu">
              <button type="button" onClick={() => requestBulkDelete("completed")} disabled={!completedTasks}>Hapus yang selesai</button>
              <button type="button" onClick={() => requestBulkDelete("all")} disabled={!tasks.length}>Hapus semua task</button>
            </div>}
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
      </form>
      {error && <p className="task-error" role="alert">{error}</p>}
      <div className="task-list">
        {activeTasks.length === 0 && !archivedTasks.length && <p className="task-empty">Belum ada task. Tambahkan fokus pertamamu.</p>}
        {activeTasks.map((task) => (
          <div className={task.done ? "task done" : "task"} key={task.id}>
            <label className="task-check">
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => void handleToggle(task)}
                disabled={activeTaskId !== null}
              />
              <span className="checkmark" />
              <span className="task-title">{task.title}</span>
            </label>
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
        ))}
        {archivedTasks.length > 0 && <div className={archiveOpen ? "task-archive expanded" : "task-archive"}>
          <button type="button" className="archive-toggle" onClick={() => setArchiveOpen((open) => !open)} aria-expanded={archiveOpen}>
            <span>Archive ({archivedTasks.length})</span><span>{archiveOpen ? "⌃" : "⌄"}</span>
          </button>
          {archiveOpen && <div className="archive-list">{archivedTasks.map((task) => (
            <div className="task done" key={task.id}>
              <label className="task-check">
                <input type="checkbox" checked={task.done} onChange={() => void handleToggle(task)} disabled={activeTaskId !== null} />
                <span className="checkmark" />
                <span className="task-title">{task.title}</span>
              </label>
              <span className="task-pomos">🍅 {task.pomodoros}</span>
              <button type="button" className="task-delete" onClick={() => void handleDelete(task)} disabled={activeTaskId !== null} aria-label={`Hapus task ${task.title}`} title="Hapus task">×</button>
            </div>
          ))}</div>}
        </div>}
      </div>
      {confirmation && <div className="task-confirm-backdrop" role="presentation" onClick={() => { if (!submitting) { setConfirmation(null); setActiveTaskId(null); } }}>
        <section className="task-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="task-confirm-title" onClick={(event) => event.stopPropagation()}>
          <h2 id="task-confirm-title">{confirmation === "all" ? "Hapus semua task?" : confirmation === "completed" ? "Hapus task selesai?" : "Hapus task?"}</h2>
          <p>{confirmation === "all" ? "Semua task akan dihapus permanen." : confirmation === "completed" ? "Semua task di archive akan dihapus permanen." : `Task "${taskToDelete?.title ?? ""}" akan dihapus permanen.`}</p>
          <div className="task-confirm-actions">
            <button type="button" className="secondary-button" onClick={() => { setConfirmation(null); setActiveTaskId(null); }} disabled={submitting}>Batal</button>
            <button type="button" className="danger-button" onClick={() => void confirmDelete()} disabled={submitting}>{submitting ? "Menghapus..." : "Hapus"}</button>
          </div>
        </section>
      </div>}
    </section>
  );
}
