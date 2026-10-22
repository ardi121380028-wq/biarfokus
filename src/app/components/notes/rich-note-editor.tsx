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
  placeholder = "Tulis catatan fokus kamu di sini... (Heading, Bullet, dan ⊞ Grid langsung terlihat)",
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
    if (!editorRef.current) return;
    editorRef.current.focus();
    try {
      const ok = document.execCommand("formatBlock", false, `h${level}`);
      if (!ok) {
        document.execCommand("formatBlock", false, `<h${level}>`);
      }
    } catch {
      document.execCommand("formatBlock", false, `<h${level}>`);
    }
    handleInput();
    setShowHeadingMenu(false);
  }

  function handleParagraph() {
    if (!editorRef.current) return;
    editorRef.current.focus();
    try {
      const ok = document.execCommand("formatBlock", false, "p");
      if (!ok) {
        document.execCommand("formatBlock", false, "<p>");
      }
    } catch {
      document.execCommand("formatBlock", false, "<p>");
    }
    handleInput();
    setShowHeadingMenu(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === " ") {
      const selection = window.getSelection();
      if (!selection || !selection.isCollapsed || !selection.anchorNode) return;

      const node = selection.anchorNode;
      const text = node.textContent || "";
      const offset = selection.anchorOffset;
      const textBeforeCaret = text.slice(0, offset);

      // 1. Dash or asterisk bullet list: typing "-" or "*" then Space
      if (
        textBeforeCaret === "-" ||
        textBeforeCaret === "*" ||
        textBeforeCaret.endsWith("\n-") ||
        textBeforeCaret.endsWith("\n*")
      ) {
        e.preventDefault();
        try {
          const range = document.createRange();
          range.setStart(node, offset - 1);
          range.setEnd(node, offset);
          selection.removeAllRanges();
          selection.addRange(range);
        } catch {}
        document.execCommand("delete", false);
        document.execCommand("insertUnorderedList", false);
        handleInput();
        return;
      }

      // 2. Numbered list: typing "1." then Space
      if (textBeforeCaret === "1." || textBeforeCaret.endsWith("\n1.")) {
        e.preventDefault();
        try {
          const range = document.createRange();
          range.setStart(node, offset - 2);
          range.setEnd(node, offset);
          selection.removeAllRanges();
          selection.addRange(range);
        } catch {}
        document.execCommand("delete", false);
        document.execCommand("insertOrderedList", false);
        handleInput();
        return;
      }

      // 3. Headings: "#", "##", "###", "####", "#####" then Space
      const headingMatch = textBeforeCaret.match(/(^|\n)(#{1,5})$/);
      if (headingMatch) {
        e.preventDefault();
        const hashes = headingMatch[2];
        const level = hashes.length as 1 | 2 | 3 | 4 | 5;
        try {
          const range = document.createRange();
          range.setStart(node, offset - level);
          range.setEnd(node, offset);
          selection.removeAllRanges();
          selection.addRange(range);
        } catch {}
        document.execCommand("delete", false);
        try {
          const ok = document.execCommand("formatBlock", false, `h${level}`);
          if (!ok) document.execCommand("formatBlock", false, `<h${level}>`);
        } catch {
          document.execCommand("formatBlock", false, `<h${level}>`);
        }
        handleInput();
        return;
      }
    }
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
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setShowHeadingMenu(!showHeadingMenu)}
              title="Pilih Heading (H1 - H5)"
              aria-label="Pilih Heading"
            >
              <span>H▾</span>
            </button>

            {showHeadingMenu && (
              <div className="note-toolbar-dropdown-menu">
                <button
                  type="button"
                  className="note-dropdown-item"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleHeading(1)}
                >
                  <span className="heading-preview h1-preview">H1</span>
                  <span>Heading 1 (Utama)</span>
                </button>
                <button
                  type="button"
                  className="note-dropdown-item"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleHeading(2)}
                >
                  <span className="heading-preview h2-preview">H2</span>
                  <span>Heading 2 (Sub-bab)</span>
                </button>
                <button
                  type="button"
                  className="note-dropdown-item"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleHeading(3)}
                >
                  <span className="heading-preview h3-preview">H3</span>
                  <span>Heading 3</span>
                </button>
                <button
                  type="button"
                  className="note-dropdown-item"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleHeading(4)}
                >
                  <span className="heading-preview h4-preview">H4</span>
                  <span>Heading 4</span>
                </button>
                <button
                  type="button"
                  className="note-dropdown-item"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleHeading(5)}
                >
                  <span className="heading-preview h5-preview">H5</span>
                  <span>Heading 5</span>
                </button>
                <button
                  type="button"
                  className="note-dropdown-item"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleParagraph}
                >
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
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCmd("insertUnorderedList")}
            title="Bullet List (Daftar Poin)"
            aria-label="Bullet List"
          >
            • List
          </button>

          <button
            type="button"
            className="note-toolbar-btn"
            onMouseDown={(e) => e.preventDefault()}
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
            onMouseDown={(e) => e.preventDefault()}
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
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCmd("bold")}
            title="Tebal (Bold)"
            aria-label="Tebal"
          >
            <b>B</b>
          </button>

          <button
            type="button"
            className="note-toolbar-btn italic-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCmd("italic")}
            title="Miring (Italic)"
            aria-label="Miring"
          >
            <i>I</i>
          </button>
        </div>

        {/* PDF Export Button */}
        {showPdfButton && onDownloadPdf && (
          <div className="note-toolbar-actions">
            <button
              type="button"
              className="note-toolbar-btn pdf-btn"
              onMouseDown={(e) => e.preventDefault()}
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
        onKeyDown={handleKeyDown}
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
