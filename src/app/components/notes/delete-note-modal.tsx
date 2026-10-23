"use client";

import { useEscapeKey } from "@/lib/hooks/use-dismiss";

type DeleteNoteModalProps = {
  isOpen: boolean;
  title?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteNoteModal({
  isOpen,
  title,
  onConfirm,
  onCancel,
}: DeleteNoteModalProps) {
  useEscapeKey(() => {
    if (isOpen) onCancel();
  });

  if (!isOpen) return null;

  return (
    <div
      className="note-delete-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-note-title"
      onClick={(e) => {
        e.stopPropagation();
        onCancel();
      }}
    >
      <div
        className="note-delete-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="note-delete-icon-circle" aria-hidden="true">
          🗑️
        </div>
        <h3 id="delete-note-title" className="note-delete-modal-title">
          Hapus Catatan?
        </h3>
        <p className="note-delete-modal-desc">
          Catatan {title ? <strong>&ldquo;{title}&rdquo;</strong> : "ini"} akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="note-delete-modal-actions">
          <button
            type="button"
            className="note-delete-cancel-btn"
            onClick={onCancel}
          >
            Batal
          </button>
          <button
            type="button"
            className="note-delete-confirm-btn"
            onClick={onConfirm}
          >
            Hapus Catatan
          </button>
        </div>
      </div>
    </div>
  );
}
