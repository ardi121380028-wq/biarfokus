"use client";

import { useEffect, useRef, useState } from "react";
import { parseMarkdownToHtml } from "@/features/notes/note-format";
import { useEscapeKey, useOutsideClick } from "@/lib/hooks/use-dismiss";

type RichNoteEditorProps = {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  onDownloadPdf?: () => void;
  showPdfButton?: boolean;
  minHeight?: number;
};

export function RichNoteEditor({
  content,
  onChange,
  placeholder = "Tulis catatan fokus kamu di sini... (Heading, • Bullet, dan ⊞ Grid langsung terlihat)",
  onDownloadPdf,
  showPdfButton = false,
  minHeight = 220,
}: RichNoteEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const headingMenuRef = useRef<HTMLDivElement>(null);
  const lastHtmlRef = useRef<string>("");

  useOutsideClick(headingMenuRef, () => setShowHeadingMenu(false), showHeadingMenu);
  useEscapeKey(() => setShowHeadingMenu(false), showHeadingMenu);

  // Initialize and sync content
  useEffect(() => {
    if (!editorRef.current) return;
    const currentEditorHtml = editorRef.current.innerHTML;

    // Only update innerHTML if external content differs significantly from current editor
    if (content !== lastHtmlRef.current && content !== currentEditorHtml) {
      const rendered = parseMarkdownToHtml(content || "");
      editorRef.current.innerHTML = rendered || "";
      lastHtmlRef.current = content;
    }
  }, [content]);

  function handleInput() {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    lastHtmlRef.current = html;
    onChange(html);
  }

  function executeCmd(cmd: string, value: string = "") {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(cmd, false, value);
    handleInput();
  }

  function handleHeading(level: 1 | 2 | 3 | 4 | 5) {
    executeCmd("formatBlock", `<h${level}>`);
    setShowHeadingMenu(false);
  }

  function handleParagraph() {
    executeCmd("formatBlock", "<p>");
    setShowHeadingMenu(false);
  }

  function handleInsertGrid() {
    const tableHtml = `
      <div class="note-table-wrapper" contenteditable="true">
        <table class="note-rendered-table">
          <thead>
            <tr>
              <th>Kolom 1</th>
              <th>Kolom 2</th>
              <th>Kolom 3</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Data A</td>
              <td>Data B</td>
              <td>Data C</td>
            </tr>
            <tr>
              <td>Data D</td>
              <td>Data E</td>
              <td>Data F</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p><br></p>
    `;
    executeCmd("insertHTML", tableHtml);
  }

  function handleInsertTodo() {
    const todoHtml = `
      <div class="note-rendered-todo" contenteditable="true">
        <span class="note-todo-checkbox">☐</span>&nbsp;<span>Tugas baru</span>
      </div>
      <p><br></p>
    `;
    executeCmd("insertHTML", todoHtml);
  }

  return (
    <div className="rich-editor-wrapper rich-note-editor-container">
      {/* Editor Formatting Toolbar */}
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
            >
              <span>H▾</span>
            </button>

            {showHeadingMenu && (
              <div className="note-toolbar-dropdown-menu">
                <button type="button" className="note-dropdown-item" onClick={() => handleHeading(1)}>
                  <span className="heading-preview h1-preview">H1</span>
                  <span>Heading 1 (Utama)</span>
                </button>
                <button type="button" className="note-dropdown-item" onClick={() => handleHeading(2)}>
                  <span className="heading-preview h2-preview">H2</span>
                  <span>Heading 2 (Sub-bab)</span>
                </button>
                <button type="button" className="note-dropdown-item" onClick={() => handleHeading(3)}>
                  <span className="heading-preview h3-preview">H3</span>
                  <span>Heading 3</span>
                </button>
                <button type="button" className="note-dropdown-item" onClick={() => handleHeading(4)}>
                  <span className="heading-preview h4-preview">H4</span>
                  <span>Heading 4</span>
                </button>
                <button type="button" className="note-dropdown-item" onClick={() => handleHeading(5)}>
                  <span className="heading-preview h5-preview">H5</span>
                  <span>Heading 5</span>
                </button>
                <button type="button" className="note-dropdown-item" onClick={handleParagraph}>
                  <span className="heading-preview" style={{ fontSize: 11 }}>P</span>
                  <span>Teks Normal</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Lists */}
          <button
            type="button"
            className="note-toolbar-btn"
            onClick={() => executeCmd("insertUnorderedList")}
            title="Bullet List (Daftar Poin)"
            aria-label="Bullet List"
          >
            • List
          </button>

          <button
            type="button"
            className="note-toolbar-btn"
            onClick={() => executeCmd("insertOrderedList")}
            title="Numbered List (Daftar Angka)"
            aria-label="Numbered List"
          >
            1. List
          </button>

          {/* Table / Grid */}
          <button
            type="button"
            className="note-toolbar-btn grid-btn"
            onClick={handleInsertGrid}
            title="Sisipkan Grid / Tabel Langsung"
            aria-label="Sisipkan Grid atau Tabel"
          >
            ⊞ Grid
          </button>

          {/* Basic formatting */}
          <button
            type="button"
            className="note-toolbar-btn bold-btn"
            onClick={() => executeCmd("bold")}
            title="Tebal (Bold)"
            aria-label="Tebal"
          >
            <b>B</b>
          </button>

          <button
            type="button"
            className="note-toolbar-btn italic-btn"
            onClick={() => executeCmd("italic")}
            title="Miring (Italic)"
            aria-label="Miring"
          >
            <i>I</i>
          </button>

          <button
            type="button"
            className="note-toolbar-btn"
            onClick={handleInsertTodo}
            title="Checklist Tugas"
            aria-label="Checklist Tugas"
          >
            ☑ Todo
          </button>
        </div>

        {/* PDF Export Button */}
        {showPdfButton && onDownloadPdf && (
          <div className="note-toolbar-actions">
            <button
              type="button"
              className="note-toolbar-btn pdf-btn"
              onClick={onDownloadPdf}
              title="Unduh catatan sebagai PDF"
              aria-label="Unduh Catatan PDF"
            >
              📥 PDF
            </button>
          </div>
        )}
      </div>

      {/* WYSIWYG ContentEditable Area - Instant Live Preview */}
      <div
        ref={editorRef}
        contentEditable={true}
        onInput={handleInput}
        className="rich-note-editor-content note-rendered-content"
        data-placeholder={placeholder}
        style={{ minHeight: `${minHeight}px` }}
        role="textbox"
        aria-multiline="true"
        spellCheck="false"
      />
    </div>
  );
}
