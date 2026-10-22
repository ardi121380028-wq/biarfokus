"use client";

import { useId, useMemo, useRef, useState } from "react";
import { findLabel, MAX_LABEL_LENGTH, normalizeLabel } from "@/features/notes/notes-service";
import { useEscapeKey, useOutsideClick } from "@/lib/hooks/use-dismiss";

type LabelSelectProps = {
  /** Labels currently applied to the note. */
  value: string[];
  /** All labels the user owns. */
  options: string[];
  onChange: (next: string[]) => void;
  /** Creates a label in the catalogue, returns canonical name (or null if invalid). */
  onCreateLabel: (name: string) => string | null;
  /** Popover direction: "up" (recommended inside modal/composer near bottom) or "down" */
  placement?: "up" | "down" | "auto";
};

/**
 * Google Keep style label picker:
 * - pick one or more existing labels (checkbox list, searchable)
 * - or type a new name and create it in one click / Enter
 * - anchored to the trigger button and cleanly positions upward/downward without modal overflow blowout
 */
export function LabelSelect({
  value,
  options,
  onChange,
  onCreateLabel,
  placement = "up",
}: LabelSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const anchorRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  useOutsideClick(anchorRef, close, open);
  useEscapeKey(close, open);

  const normalizedQuery = normalizeLabel(query);
  const filtered = useMemo(() => {
    const q = normalizedQuery.toLowerCase();
    return q ? options.filter((l) => l.toLowerCase().includes(q)) : options;
  }, [options, normalizedQuery]);
  const exactMatch = normalizedQuery ? findLabel(options, normalizedQuery) : undefined;
  const canCreate = Boolean(normalizedQuery) && !exactMatch;

  const isSelected = (label: string) =>
    value.some((l) => l.toLowerCase() === label.toLowerCase());

  const toggle = (label: string) => {
    onChange(
      isSelected(label)
        ? value.filter((l) => l.toLowerCase() !== label.toLowerCase())
        : [...value, label]
    );
  };

  const create = () => {
    const created = onCreateLabel(normalizedQuery);
    if (created && !isSelected(created)) {
      onChange([...value, created]);
    }
    setQuery("");
  };

  return (
    <div className="keep-create-labels-row">
      {/* Existing Applied Label Chips */}
      {value.map((label) => (
        <span key={label} className="keep-label-tag">
          {label}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggle(label);
            }}
            aria-label={`Hapus label ${label}`}
          >
            ✕
          </button>
        </span>
      ))}

      {/* Anchor Container for Button & Popover */}
      <div className="keep-label-anchor" ref={anchorRef}>
        <button
          type="button"
          className="keep-add-label-btn"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
          aria-expanded={open}
          aria-controls={listId}
        >
          🏷️ {value.length ? "Ubah label" : "Pilih label"}
        </button>

        {open && (
          <div
            className={`keep-label-picker-popover popover-${placement}`}
            role="dialog"
            aria-label="Pilih atau buat label"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="popover-header-row">
              <span className="popover-title">Beri label catatan</span>
              <button
                type="button"
                className="popover-close-btn"
                onClick={close}
                aria-label="Tutup pemilih label"
              >
                ✕
              </button>
            </div>

            <div className="popover-new-label-row">
              <input
                autoFocus
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
            </div>

            <ul id={listId} className="keep-label-options-list">
              {filtered.map((label) => (
                <li key={label}>
                  <label className="keep-label-option-row">
                    <input
                      type="checkbox"
                      className="keep-checkbox"
                      checked={isSelected(label)}
                      onChange={() => toggle(label)}
                    />
                    <span className="keep-label-option-name">{label}</span>
                  </label>
                </li>
              ))}
              {filtered.length === 0 && !canCreate && (
                <li style={{ padding: "8px 6px", fontSize: "11px", color: "var(--muted)", textAlign: "center" }}>
                  Belum ada label lain.
                </li>
              )}
            </ul>

            {canCreate && (
              <button
                type="button"
                className="keep-label-create-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  create();
                }}
              >
                ＋ Buat label &ldquo;{normalizedQuery}&rdquo;
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
