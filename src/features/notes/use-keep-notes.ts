"use client";

import { useCallback, useMemo } from "react";
import type { KeepNote } from "@/types/domain";
import { useLocalStoreValue } from "@/lib/storage/local-store";
import {
  createId,
  DEFAULT_LABELS,
  EMPTY_NOTES,
  findLabel,
  finalizeDraft,
  formatUpdatedAt,
  getLabelsStorageKey,
  getNotesStorageKey,
  mergeLabels,
  normalizeLabel,
  parseStoredLabels,
  parseStoredNotes,
  removeLabelFromNotes,
  toggleChecklistItem,
  type NoteDraft,
} from "@/features/notes/notes-service";

export function useKeepNotes(userId?: string | null) {
  const [notes, updateNotes] = useLocalStoreValue(getNotesStorageKey(userId), parseStoredNotes, EMPTY_NOTES);
  const [storedLabels, updateLabels] = useLocalStoreValue(
    getLabelsStorageKey(userId),
    parseStoredLabels,
    DEFAULT_LABELS,
  );

  const labels = useMemo(() => mergeLabels(storedLabels, notes), [storedLabels, notes]);

  const createNote = useCallback(
    (draft: NoteDraft) => {
      const note: KeepNote = { ...finalizeDraft(draft), id: createId("note"), updatedAt: formatUpdatedAt(new Date()) };
      updateNotes((current) => [note, ...current]);
      return note;
    },
    [updateNotes],
  );

  const updateNote = useCallback(
    (id: string, draft: NoteDraft) =>
      updateNotes((current) =>
        current.map((n) => (n.id === id ? { ...n, ...finalizeDraft(draft), updatedAt: formatUpdatedAt(new Date()) } : n)),
      ),
    [updateNotes],
  );

  const deleteNote = useCallback(
    (id: string) => updateNotes((current) => current.filter((n) => n.id !== id)),
    [updateNotes],
  );

  const togglePin = useCallback(
    (id: string) => updateNotes((current) => current.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n))),
    [updateNotes],
  );

  const toggleItem = useCallback(
    (noteId: string, itemId: string) => updateNotes((current) => toggleChecklistItem(current, noteId, itemId)),
    [updateNotes],
  );

  /** Creates (or reuses, case-insensitively) a label. Returns the canonical name or null if invalid. */
  const createLabel = useCallback(
    (name: string): string | null => {
      const label = normalizeLabel(name);
      if (!label) return null;
      const existing = findLabel(labels, label);
      if (existing) return existing;
      updateLabels((current) => [...current, label]);
      return label;
    },
    [labels, updateLabels],
  );

  const deleteLabel = useCallback(
    (name: string) => {
      const needle = name.toLowerCase();
      updateLabels((current) => current.filter((l) => l.toLowerCase() !== needle));
      updateNotes((current) => removeLabelFromNotes(current, name));
    },
    [updateLabels, updateNotes],
  );

  return { notes, labels, createNote, updateNote, deleteNote, togglePin, toggleItem, createLabel, deleteLabel };
}

export type KeepNotesApi = ReturnType<typeof useKeepNotes>;
