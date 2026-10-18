"use client";

import { useEffect, useState } from "react";

type FocusScratchpadProps = {
  userId?: string | null;
};

const STORAGE_PREFIX = "biarfokus.scratchpad.";

export function FocusScratchpad({ userId }: FocusScratchpadProps) {
  const storageKey = `${STORAGE_PREFIX}${userId || "guest"}`;
  const [note, setNote] = useState("");
  const [expanded, setExpanded] = useState(true);
  const [savedTime, setSavedTime] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored !== null) {
        setNote(stored);
      }
    } catch {
      // LocalStorage access may fail in private mode
    }
  }, [storageKey]);

  function handleChange(value: string) {
    setNote(value);
    try {
      window.localStorage.setItem(storageKey, value);
      const now = new Date();
      setSavedTime(now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
    } catch {
      // Ignore storage errors
    }
  }

  function handleClear() {
    if (!note.trim()) return;
    const confirmClear = window.confirm("Hapus semua catatan di scratchpad ini?");
    if (confirmClear) {
      setNote("");
      try {
        window.localStorage.removeItem(storageKey);
        setSavedTime(null);
      } catch {
        // Ignore
      }
    }
  }

  return (
    <section className="card scratchpad-card" aria-label="Catatan cepat fokus">
      <div className="scratchpad-header">
        <button
          type="button"
          className="scratchpad-toggle"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-controls="scratchpad-content"
        >
          <span className="scratchpad-title-group">
            <span className="scratchpad-emoji" aria-hidden="true">📝</span>
            <span className="scratchpad-title">Catatan Fokus</span>
            <span className="scratchpad-badge">Anti-distraksi</span>
          </span>
          <span className="scratchpad-chevron" aria-hidden="true">{expanded ? "▲" : "▼"}</span>
        </button>
        {expanded && note.trim().length > 0 && (
          <button
            type="button"
            className="scratchpad-clear-btn"
            onClick={handleClear}
            title="Bersihkan isi catatan"
          >
            Bersihkan
          </button>
        )}
      </div>

      {expanded && (
        <div id="scratchpad-content" className="scratchpad-body">
          <textarea
            className="scratchpad-textarea"
            placeholder="Ada ide spontan atau hal yang bikin gak fokus? Tulis di sini agar tidak memecah konsentrasi sesi belajarmu..."
            value={note}
            onChange={(e) => handleChange(e.target.value)}
            rows={4}
            aria-label="Tulis catatan distraksi atau ide spontan"
          />
          <div className="scratchpad-footer">
            <span className="scratchpad-status">
              {savedTime ? `✓ Tersimpan pukul ${savedTime}` : "✓ Tersimpan otomatis di perangkat"}
            </span>
            <span className="scratchpad-chars">
              {note.length} karakter
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
