"use client";

import { useRef } from "react";
import { useEscapeKey, useOutsideClick } from "@/lib/hooks/use-dismiss";
import { NotesView } from "./notes/notes-view";

type NotesModalProps = {
  userId?: string | null;
  onClose?: () => void;
  isPageView?: boolean;
};

export function NotesModal({ userId, onClose, isPageView = false }: NotesModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEscapeKey(() => {
    if (onClose) onClose();
  }, !isPageView && Boolean(onClose));

  useOutsideClick(dialogRef, () => {
    if (onClose) onClose();
  }, !isPageView && Boolean(onClose));

  if (isPageView) {
    return (
      <section className="inner-page keep-page-view">
        <NotesView userId={userId} />
      </section>
    );
  }

  return (
    <div className="keep-backdrop" role="presentation">
      <section
        ref={dialogRef}
        className="keep-notes-modal-dialog"
        role="dialog"
        aria-label="Catatan & Todo List"
      >
        <NotesView userId={userId} onClose={onClose} />
      </section>
    </div>
  );
}
