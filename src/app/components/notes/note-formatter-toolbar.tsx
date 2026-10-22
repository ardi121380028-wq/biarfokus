"use client";

import { useState, useRef } from "react";
import type { MarkdownFormattingType } from "@/features/notes/note-format";
import { useEscapeKey, useOutsideClick } from "@/lib/hooks/use-dismiss";

type NoteFormatterToolbarProps = {
  onFormat: (type: MarkdownFormattingType) => void;
  isPreview: boolean;
  onTogglePreview: () => void;
  onDownloadPdf?: () => void;
  showPdfButton?: boolean;
};

export function NoteFormatterToolbar({
  onFormat,
  isPreview,
  onTogglePreview,
  onDownloadPdf,
  showPdfButton = false,
}: NoteFormatterToolbarProps) {
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const headingMenuRef = useRef<HTMLDivElement>(null);

  useOutsideClick(headingMenuRef, () => setShowHeadingMenu(false), showHeadingMenu);
  useEscapeKey(() => setShowHeadingMenu(false), showHeadingMenu);

  return (
    <div className="note-toolbar-container" role="toolbar" aria-label="Toolbar Format Catatan">
      <div className="note-toolbar-group">
        {/* Headings Selector */}
        <div className="note-toolbar-dropdown-wrap" ref={headingMenuRef}>
          <button
            type="button"
            className="note-toolbar-btn dropdown-trigger"
            onClick={() => setShowHeadingMenu(!showHeadingMenu)}
            title="Pilih Heading (H1 - H5)"
            aria-label="Pilih Heading"
            disabled={isPreview}
          >
            <span>H▾</span>
          </button>

          {showHeadingMenu && (
            <div className="note-toolbar-dropdown-menu">
              <button
                type="button"
                className="note-dropdown-item"
                onClick={() => {
                  onFormat("h1");
                  setShowHeadingMenu(false);
                }}
              >
                <span className="heading-preview h1-preview">H1</span>
                <span>Heading 1 (Utama)</span>
              </button>
              <button
                type="button"
                className="note-dropdown-item"
                onClick={() => {
                  onFormat("h2");
                  setShowHeadingMenu(false);
                }}
              >
                <span className="heading-preview h2-preview">H2</span>
                <span>Heading 2 (Sub-bab)</span>
              </button>
              <button
                type="button"
                className="note-dropdown-item"
                onClick={() => {
                  onFormat("h3");
                  setShowHeadingMenu(false);
                }}
              >
                <span className="heading-preview h3-preview">H3</span>
                <span>Heading 3</span>
              </button>
              <button
                type="button"
                className="note-dropdown-item"
                onClick={() => {
                  onFormat("h4");
                  setShowHeadingMenu(false);
                }}
              >
                <span className="heading-preview h4-preview">H4</span>
                <span>Heading 4</span>
              </button>
              <button
                type="button"
                className="note-dropdown-item"
                onClick={() => {
                  onFormat("h5");
                  setShowHeadingMenu(false);
                }}
              >
                <span className="heading-preview h5-preview">H5</span>
                <span>Heading 5 (Kecil)</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Lists */}
        <button
          type="button"
          className="note-toolbar-btn"
          onClick={() => onFormat("bullet")}
          title="Bullet List (Daftar Poin)"
          aria-label="Bullet List"
          disabled={isPreview}
        >
          • List
        </button>

        <button
          type="button"
          className="note-toolbar-btn"
          onClick={() => onFormat("number")}
          title="Numbered List (Daftar Angka)"
          aria-label="Numbered List"
          disabled={isPreview}
        >
          1. List
        </button>

        {/* Table / Grid */}
        <button
          type="button"
          className="note-toolbar-btn grid-btn"
          onClick={() => onFormat("grid")}
          title="Sisipkan Grid / Tabel"
          aria-label="Sisipkan Grid atau Tabel"
          disabled={isPreview}
        >
          ⊞ Grid
        </button>

        {/* Basic formatting */}
        <button
          type="button"
          className="note-toolbar-btn bold-btn"
          onClick={() => onFormat("bold")}
          title="Tebal (Bold)"
          aria-label="Tebal"
          disabled={isPreview}
        >
          <b>B</b>
        </button>

        <button
          type="button"
          className="note-toolbar-btn italic-btn"
          onClick={() => onFormat("italic")}
          title="Miring (Italic)"
          aria-label="Miring"
          disabled={isPreview}
        >
          <i>I</i>
        </button>

        <button
          type="button"
          className="note-toolbar-btn"
          onClick={() => onFormat("todo")}
          title="Checklist Tugas"
          aria-label="Checklist Tugas"
          disabled={isPreview}
        >
          ☑ Todo
        </button>
      </div>

      <div className="note-toolbar-actions">
        {/* Toggle Live Preview */}
        <button
          type="button"
          className={`note-toolbar-btn preview-toggle ${isPreview ? "active" : ""}`}
          onClick={onTogglePreview}
          title={isPreview ? "Kembali ke mode edit" : "Lihat tampilan pratinjau"}
        >
          {isPreview ? "✏️ Edit" : "👁️ Pratinjau"}
        </button>

        {/* Export / Download PDF */}
        {showPdfButton && onDownloadPdf && (
          <button
            type="button"
            className="note-toolbar-btn pdf-btn"
            onClick={onDownloadPdf}
            title="Unduh catatan sebagai PDF"
            aria-label="Unduh Catatan PDF"
          >
            📥 PDF
          </button>
        )}
      </div>
    </div>
  );
}
