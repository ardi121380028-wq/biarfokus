"use client";

import { useState, type FormEvent } from "react";

export type Task = {
  id: string;
  title: string;
  done: boolean;
  pomodoros: number;
};

type TaskManagementProps = {
  tasks: Task[];
  onAdd: (title: string) => Promise<void>;
  onToggle: (task: Task) => Promise<void>;
  onDelete: (task: Task) => Promise<void>;
  onViewProductivity: () => void;
};

export function TaskManagement({
  tasks,
  onAdd,
  onToggle,
  onDelete,
  onViewProductivity,
}: TaskManagementProps) {
  const [newTask, setNewTask] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const completedTasks = tasks.filter((task) => task.done).length;

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTask.trim();
    if (!title || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      await onAdd(title);
      setNewTask("");
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
    if (!window.confirm(`Hapus task "${task.title}"?`)) return;

    setActiveTaskId(task.id);
    setError(null);
    try {
      await onDelete(task);
    } catch (operationError) {
      setError(operationError instanceof Error ? operationError.message : "Task gagal dihapus.");
    } finally {
      setActiveTaskId(null);
    }
  }

  return (
    <section className="task-card card">
      <div className="section-heading">
        <div><p className="eyebrow">Fokus hari ini</p><h1>Task Management</h1></div>
        <span className="progress-count">{completedTasks}/{tasks.length}</span>
      </div>
      <form className="task-form" onSubmit={(event) => void handleAdd(event)}>
        <input
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
        {tasks.length === 0 && <p className="task-empty">Belum ada task. Tambahkan fokus pertamamu.</p>}
        {tasks.map((task) => (
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
      </div>
      <button className="view-all" onClick={onViewProductivity}>Lihat produktivitas →</button>
    </section>
  );
}
