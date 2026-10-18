"use client";

import { useCallback, useEffect, useMemo } from "react";
import type { KeepNote } from "@/types/domain";
import { useLocalStoreValue } from "@/lib/storage/local-store";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  deleteCloudLabel,
  deleteCloudNote,
  insertCloudLabel,
  loadCloudLabels,
  loadCloudNotes,
  upsertCloudNote,
} from "./notes-cloud";
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

  // Cloud sync on mount when authenticated
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    let supabase: ReturnType<typeof getSupabaseBrowserClient>;
    try {
      supabase = getSupabaseBrowserClient();
    } catch {
      return;
    }

    void loadCloudNotes(supabase, userId)
      .then((cloudNotes) => {
        if (cancelled) return;
        if (cloudNotes.length > 0) {
          updateNotes(() => cloudNotes);
        }
      })
      .catch((err) => {
        console.warn("Cloud notes sync unavailable; using local cache.", err);
      });

    void loadCloudLabels(supabase, userId)
      .then((cloudLabels) => {
        if (cancelled) return;
        if (cloudLabels.length > 0) {
          updateLabels((current) => Array.from(new Set([...current, ...cloudLabels])));
        }
      })
      .catch((err) => {
        console.warn("Cloud labels sync unavailable; using local cache.", err);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, updateNotes, updateLabels]);

  const labels = useMemo(() => mergeLabels(storedLabels, notes), [storedLabels, notes]);

  const createNote = useCallback(
    (draft: NoteDraft) => {
      const note: KeepNote = { ...finalizeDraft(draft), id: createId("note"), updatedAt: formatUpdatedAt(new Date()) };
      updateNotes((current) => [note, ...current]);
      if (userId) {
        try {
          upsertCloudNote(getSupabaseBrowserClient(), userId, note).catch((err) =>
            console.warn("Failed to sync created note to cloud:", err),
          );
        } catch {}
      }
      return note;
    },
    [userId, updateNotes],
  );

  const updateNote = useCallback(
    (id: string, draft: NoteDraft) => {
      let updatedNote: KeepNote | null = null;
      updateNotes((current) =>
        current.map((n) => {
          if (n.id === id) {
            updatedNote = { ...n, ...finalizeDraft(draft), updatedAt: formatUpdatedAt(new Date()) };
            return updatedNote;
          }
          return n;
        }),
      );
      if (userId && updatedNote) {
        try {
          upsertCloudNote(getSupabaseBrowserClient(), userId, updatedNote).catch((err) =>
            console.warn("Failed to sync note update to cloud:", err),
          );
        } catch {}
      }
    },
    [userId, updateNotes],
  );

  const deleteNote = useCallback(
    (id: string) => {
      updateNotes((current) => current.filter((n) => n.id !== id));
      if (userId) {
        try {
          deleteCloudNote(getSupabaseBrowserClient(), userId, id).catch((err) =>
            console.warn("Failed to sync note delete to cloud:", err),
          );
        } catch {}
      }
    },
    [userId, updateNotes],
  );

  const togglePin = useCallback(
    (id: string) => {
      let updatedNote: KeepNote | null = null;
      updateNotes((current) =>
        current.map((n) => {
          if (n.id === id) {
            updatedNote = { ...n, pinned: !n.pinned };
            return updatedNote;
          }
          return n;
        }),
      );
      if (userId && updatedNote) {
        try {
          upsertCloudNote(getSupabaseBrowserClient(), userId, updatedNote).catch((err) =>
            console.warn("Failed to sync pin to cloud:", err),
          );
        } catch {}
      }
    },
    [userId, updateNotes],
  );

  const toggleItem = useCallback(
    (noteId: string, itemId: string) => {
      let updatedNote: KeepNote | null = null;
      updateNotes((current) => {
        const next = toggleChecklistItem(current, noteId, itemId);
        updatedNote = next.find((n) => n.id === noteId) || null;
        return next;
      });
      if (userId && updatedNote) {
        try {
          upsertCloudNote(getSupabaseBrowserClient(), userId, updatedNote).catch((err) =>
            console.warn("Failed to sync checklist toggle to cloud:", err),
          );
        } catch {}
      }
    },
    [userId, updateNotes],
  );

  const createLabel = useCallback(
    (name: string): string | null => {
      const label = normalizeLabel(name);
      if (!label) return null;
      const existing = findLabel(labels, label);
      if (existing) return existing;
      updateLabels((current) => [...current, label]);
      if (userId) {
        try {
          insertCloudLabel(getSupabaseBrowserClient(), userId, label).catch((err) =>
            console.warn("Failed to sync label create to cloud:", err),
          );
        } catch {}
      }
      return label;
    },
    [userId, labels, updateLabels],
  );

  const deleteLabel = useCallback(
    (name: string) => {
      const needle = name.toLowerCase();
      updateLabels((current) => current.filter((l) => l.toLowerCase() !== needle));
      updateNotes((current) => removeLabelFromNotes(current, name));
      if (userId) {
        try {
          deleteCloudLabel(getSupabaseBrowserClient(), userId, name).catch((err) =>
            console.warn("Failed to sync label delete to cloud:", err),
          );
        } catch {}
      }
    },
    [userId, updateLabels, updateNotes],
  );

  return { notes, labels, createNote, updateNote, deleteNote, togglePin, toggleItem, createLabel, deleteLabel };
}

export type KeepNotesApi = ReturnType<typeof useKeepNotes>;
