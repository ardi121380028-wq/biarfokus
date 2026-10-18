"use client";

import { useId, useMemo, useRef, useState } from "react";
import { findLabel, MAX_LABEL_LENGTH, normalizeLabel } from "@/features/notes/notes-service";
import { useEscapeKey, useOutsideClick } from "@/lib/hooks/use-dismiss";
import styles from "./notes.module.css";

type LabelSelectProps = {
  /** Labels currently applied to the note. */
  value: string[];
  /** All labels the user owns. */
  options: string[];
  onChange: (next: string[]) => void;
  /** Creates a label in the catalogue, returns canonical name (or null if invalid). */
  onCreateLabel: (name: string) => string | null;
};

/**
 * Google Keep style label picker:
 * - pick one or more existing labels (checkbox list, searchable)
 * - or type a new name and create it in one click / Enter
 */
export function LabelSelect({ value, options, onChange, onCreateLabel }: LabelSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const close = () => {
    setOpen(false);
    setQuery("");
  };
  useOutsideClick(rootRef, close, open);
  useEscapeKey(close, open);

  const normalizedQuery = normalizeLabel(query);
  const filtered = useMemo(() => {
    const q = normalizedQuery.toLowerCase();
    return q ? options.filter((l) => l.toLowerCase().includes(q)) : options;
  }, [options, normalizedQuery]);
  const exactMatch = normalizedQuery ? findLabel(options, normalizedQuery) : undefined;
  const canCreate = Boolean(normalizedQuery) && !exactMatch;

  const isSelected = (label: string) => value.some((l) => l.toLowerCase() === label.toLowerCase());

  const toggle = (label: string) => {
    onChange(isSelected(label) ? value.filter((l) => l.toLowerCase() !== label.toLowerCase()) : [...value, label]);
  };

  const create = () => {
    const created = onCreateLabel(normalizedQuery);
    if (created && !isSelected(created)) onChange([...value, created]);
    setQuery("");
  };

  return (
    <div className={styles.labelSelect} ref={rootRef}>
      <div className={styles.labelChipsRow}>
        {value.map((label) => (
          <span key={label} className={styles.labelChip}>
            {label}
            <button type="button" onClick={() => toggle(label)} aria-label={`Hapus label ${label}`}>
              ✕
            </button>
          </span>
        ))}
        <button
          type="button"
          className={styles.labelTrigger}
          onClick={() => (open ? close() : setOpen(true))}
          aria-expanded={open}
          aria-controls={listId}
        >
          🏷️ {value.length ? "Ubah label" : "Pilih label"}
        </button>
      </div>

      {open && (
        <div className={styles.labelPopover} role="dialog" aria-label="Pilih atau buat label">
          <p className={styles.labelPopoverTitle}>Beri label catatan</p>
          <input
            autoFocus
            className={styles.labelSearch}
            placeholder="Cari atau ketik label baru..."
            value={query}
            maxLength={MAX_LABEL_LENGTH}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              if (exactMatch) toggle(exactMatch);
              else if (canCreate) create();
            }}
          />

          <ul id={listId} className={styles.labelOptions}>
            {filtered.map((label) => (
              <li key={label}>
                <label className={styles.labelOption}>
                  <input type="checkbox" checked={isSelected(label)} onChange={() => toggle(label)} />
                  <span>{label}</span>
                </label>
              </li>
            ))}
            {filtered.length === 0 && !canCreate && <li className={styles.labelEmpty}>Belum ada label.</li>}
          </ul>

          {canCreate && (
            <button type="button" className={styles.labelCreate} onClick={create}>
              ＋ Buat label &ldquo;{normalizedQuery}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
