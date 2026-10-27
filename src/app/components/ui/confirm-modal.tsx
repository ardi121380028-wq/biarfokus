"use client";

import { useEffect, useRef } from "react";
import { useEscapeKey, useOutsideClick } from "@/lib/hooks/use-dismiss";

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemName?: string;
  itemSubtext?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info" | "success";
  hideCancel?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  itemName,
  itemSubtext,
  confirmLabel = "Ya, Lanjutkan",
  cancelLabel = "Batal",
  variant = "danger",
  hideCancel = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    if (onCancel) {
      onCancel();
    } else {
      onConfirm();
    }
  };

  useOutsideClick(modalRef, handleClose, isOpen);
  useEscapeKey(handleClose, isOpen);

  // Keyboard shortcut: Enter confirms
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter") {
        e.preventDefault();
        onConfirm();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onConfirm]);

  if (!isOpen) return null;

  const icon =
    variant === "danger"
      ? "🗑️"
      : variant === "warning"
      ? "⚠️"
      : variant === "success"
      ? "🎉"
      : "ℹ️";

  return (
    <div
      className="universal-confirm-backdrop"
      role="dialog"
      aria-modal="true"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div ref={modalRef} className={`universal-confirm-dialog ${variant}`}>
        {/* Glowing Icon Badge */}
        <div className={`universal-confirm-icon-wrap ${variant}`}>
          <span className="universal-confirm-icon">{icon}</span>
        </div>

        {/* Text Content */}
        <div className="universal-confirm-content">
          <h3 className="universal-confirm-title">{title}</h3>
          <p className="universal-confirm-message">{message}</p>

          {itemName && (
            <div className="universal-confirm-item-preview">
              <span className="confirm-preview-icon">📌</span>
              <div className="confirm-preview-text">
                <strong className="confirm-preview-name">{itemName}</strong>
                {itemSubtext && <span className="confirm-preview-sub">{itemSubtext}</span>}
              </div>
            </div>
          )}

          {variant === "danger" && (
            <div className="universal-confirm-warning-note">
              <span className="confirm-note-icon">⚡</span>
              <span>Tindakan ini permanen dan tidak dapat dibatalkan.</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="universal-confirm-actions">
          {!hideCancel && (
            <button
              type="button"
              className="universal-confirm-btn cancel"
              onClick={handleClose}
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            className={`universal-confirm-btn confirm ${variant} ${hideCancel ? "full-width" : ""}`}
            onClick={onConfirm}
            autoFocus
          >
            <span>{variant === "danger" ? "🗑️" : variant === "success" ? "✓" : "OK"}</span>
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
