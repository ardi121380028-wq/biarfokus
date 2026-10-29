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
  mergeCloudNotes,
  mergeLabels,
  normalizeLabel,
  parseStoredLabels,
  parseStoredNotes,
  removeLabelFromNotes,
  setChecklistItemStatus,
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
          updateNotes((current) => mergeCloudNotes(cloudNotes, current));
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
            const finalized = finalizeDraft(draft);
            updatedNote = {
              ...n,
              ...finalized,
              archived: finalized.archived ?? n.archived,
              updatedAt: formatUpdatedAt(new Date()),
            };
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
      if (typeof window !== "undefined" && updatedNote) {
        const noteWithItems = updatedNote as KeepNote;
        if (Array.isArray(noteWithItems.items)) {
          for (const item of noteWithItems.items) {
            window.dispatchEvent(
              new CustomEvent("biarfokus:note-item-toggled", {
                detail: { noteId: id, itemId: item.id, done: item.done, source: "notes" },
              }),
            );
          }
        }
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
            const nextPinned = !n.pinned;
            updatedNote = {
              ...n,
              pinned: nextPinned,
              archived: nextPinned ? false : n.archived,
            };
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

  const toggleArchive = useCallback(
    (id: string) => {
      let updatedNote: KeepNote | null = null;
      updateNotes((current) => {
        const next = current.map((n) =>
          n.id === id
            ? { ...n, archived: !n.archived, pinned: false, updatedAt: formatUpdatedAt(new Date()) }
            : n,
        );
        updatedNote = next.find((n) => n.id === id) || null;
        return next;
      });
      if (userId && updatedNote) {
        try {
          upsertCloudNote(getSupabaseBrowserClient(), userId, updatedNote).catch((err) =>
            console.warn("Failed to sync archive to cloud:", err),
          );
        } catch {}
      }
    },
    [userId, updateNotes],
  );

  const toggleItem = useCallback(
    (noteId: string, itemId: string) => {
      let updatedNote: KeepNote | null = null;
      let newDoneStatus: boolean | undefined;
      updateNotes((current) => {
        const next = toggleChecklistItem(current, noteId, itemId);
        updatedNote = next.find((n) => n.id === noteId) || null;
        newDoneStatus = updatedNote?.items?.find((i) => i.id === itemId)?.done;
        return next;
      });
      if (userId && updatedNote) {
        try {
          upsertCloudNote(getSupabaseBrowserClient(), userId, updatedNote).catch((err) =>
            console.warn("Failed to sync checklist toggle to cloud:", err),
          );
        } catch {}
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("biarfokus:note-item-toggled", {
            detail: { noteId, itemId, done: newDoneStatus, source: "notes" },
          }),
        );
      }
    },
    [userId, updateNotes],
  );

  const setItemDone = useCallback(
    (noteId: string, itemId: string, done: boolean) => {
      let updatedNote: KeepNote | null = null;
      updateNotes((current) => {
        const next = setChecklistItemStatus(current, noteId, itemId, done);
        updatedNote = next.find((n) => n.id === noteId) || null;
        return next;
      });
      if (userId && updatedNote) {
        try {
          upsertCloudNote(getSupabaseBrowserClient(), userId, updatedNote).catch((err) =>
            console.warn("Failed to sync checklist status to cloud:", err),
          );
        } catch {}
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("biarfokus:note-item-toggled", {
            detail: { noteId, itemId, done, source: "eat-your-frog" },
          }),
        );
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

  return {
    notes,
    labels,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    toggleArchive,
    toggleItem,
    setItemDone,
    createLabel,
    deleteLabel,
  };
}

export type KeepNotesApi = ReturnType<typeof useKeepNotes>;
