import type { ChecklistItem } from "@/types/domain";

export type MarkdownFormattingType =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "bullet"
  | "number"
  | "bold"
  | "italic"
  | "grid"
  | "todo";

/**
 * Escapes raw HTML to prevent XSS during markdown parsing.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Inserts markdown formatting at the current selection or line in a text string.
 */
export function insertMarkdownFormatting(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  type: MarkdownFormattingType
): { newText: string; newStart: number; newEnd: number } {
  const selectedText = text.substring(selectionStart, selectionEnd);
  const before = text.substring(0, selectionStart);
  const after = text.substring(selectionEnd);

  // Helper: check if we are at start of line or need a newline
  const needsNewlineBefore = before.length > 0 && !before.endsWith("\n");
  const prefixNewline = needsNewlineBefore ? "\n" : "";

  switch (type) {
    case "h1": {
      const heading = `# ${selectedText || "Judul Utama"}`;
      const newText = before + prefixNewline + heading + (after.startsWith("\n") ? "" : "\n") + after;
      const start = before.length + prefixNewline.length + 2;
      return { newText, newStart: start, newEnd: start + (selectedText ? selectedText.length : "Judul Utama".length) };
    }
    case "h2": {
      const heading = `## ${selectedText || "Sub Judul (H2)"}`;
      const newText = before + prefixNewline + heading + (after.startsWith("\n") ? "" : "\n") + after;
      const start = before.length + prefixNewline.length + 3;
      return { newText, newStart: start, newEnd: start + (selectedText ? selectedText.length : "Sub Judul (H2)".length) };
    }
    case "h3": {
      const heading = `### ${selectedText || "Heading 3"}`;
      const newText = before + prefixNewline + heading + (after.startsWith("\n") ? "" : "\n") + after;
      const start = before.length + prefixNewline.length + 4;
      return { newText, newStart: start, newEnd: start + (selectedText ? selectedText.length : "Heading 3".length) };
    }
    case "h4": {
      const heading = `#### ${selectedText || "Heading 4"}`;
      const newText = before + prefixNewline + heading + (after.startsWith("\n") ? "" : "\n") + after;
      const start = before.length + prefixNewline.length + 5;
      return { newText, newStart: start, newEnd: start + (selectedText ? selectedText.length : "Heading 4".length) };
    }
    case "h5": {
      const heading = `##### ${selectedText || "Heading 5"}`;
      const newText = before + prefixNewline + heading + (after.startsWith("\n") ? "" : "\n") + after;
      const start = before.length + prefixNewline.length + 6;
      return { newText, newStart: start, newEnd: start + (selectedText ? selectedText.length : "Heading 5".length) };
    }
    case "bullet": {
      if (selectedText.includes("\n")) {
        const lines = selectedText.split("\n");
        const bulleted = lines.map((l) => (l.trim().startsWith("• ") ? l : `• ${l}`)).join("\n");
        const newText = before + bulleted + after;
        return { newText, newStart: selectionStart, newEnd: selectionStart + bulleted.length };
      }
      const item = `• ${selectedText || "Item daftar"}`;
      const newText = before + prefixNewline + item + (after.startsWith("\n") ? "" : "\n") + after;
      const start = before.length + prefixNewline.length + 2;
      return { newText, newStart: start, newEnd: start + (selectedText ? selectedText.length : "Item daftar".length) };
    }
    case "number": {
      if (selectedText.includes("\n")) {
        const lines = selectedText.split("\n");
        const numbered = lines.map((l, i) => `${i + 1}. ${l.replace(/^\d+\.\s*/, "")}`).join("\n");
        const newText = before + numbered + after;
        return { newText, newStart: selectionStart, newEnd: selectionStart + numbered.length };
      }
      const item = `1. ${selectedText || "Langkah pertama"}`;
      const newText = before + prefixNewline + item + (after.startsWith("\n") ? "" : "\n") + after;
      const start = before.length + prefixNewline.length + 3;
      return { newText, newStart: start, newEnd: start + (selectedText ? selectedText.length : "Langkah pertama".length) };
    }
    case "bold": {
      const content = selectedText || "teks tebal";
      const insertion = `**${content}**`;
      const newText = before + insertion + after;
      return {
        newText,
        newStart: selectionStart + 2,
        newEnd: selectionStart + 2 + content.length,
      };
    }
    case "italic": {
      const content = selectedText || "teks miring";
      const insertion = `*${content}*`;
      const newText = before + insertion + after;
      return {
        newText,
        newStart: selectionStart + 1,
        newEnd: selectionStart + 1 + content.length,
      };
    }
    case "todo": {
      const item = `- [ ] ${selectedText || "Tugas baru"}`;
      const newText = before + prefixNewline + item + (after.startsWith("\n") ? "" : "\n") + after;
      const start = before.length + prefixNewline.length + 6;
      return { newText, newStart: start, newEnd: start + (selectedText ? selectedText.length : "Tugas baru".length) };
    }
    case "grid": {
      const gridTemplate = [
        "| Kolom 1 | Kolom 2 | Kolom 3 |",
        "| --- | --- | --- |",
        "| Data A | Data B | Data C |",
        "| Data D | Data E | Data F |",
      ].join("\n");
      const newText = before + prefixNewline + gridTemplate + (after.startsWith("\n") ? "" : "\n") + after;
      const start = before.length + prefixNewline.length;
      return { newText, newStart: start, newEnd: start + gridTemplate.length };
    }
  }
}

/**
 * Parses markdown into clean HTML with support for:
 * - Headings H1 to H5
 * - Bullet lists (•, -, *)
 * - Numbered lists (1., 2.)
 * - Markdown tables / grids (| ... |)
 * - Checkboxes (- [ ], - [x])
 * - Bold (**), Italic (*), Code (`...`)
 */
export function parseMarkdownToHtml(markdown: string): string {
  if (!markdown || !markdown.trim()) return "";

  const lines = markdown.split("\n");
  const result: string[] = [];

  let inUl = false;
  let inOl = false;
  let inTable = false;
  let tableHeaderParsed = false;

  function closeLists() {
    if (inUl) {
      result.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      result.push("</ol>");
      inOl = false;
    }
  }

  function closeTable() {
    if (inTable) {
      result.push("</tbody></table></div>");
      inTable = false;
      tableHeaderParsed = false;
    }
  }

  function formatInline(text: string): string {
    let s = escapeHtml(text);
    // Bold
    s = s.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // Italic
    s = s.replace(/\*(.*?)\*/g, "<em>$1</em>");
    // Code
    s = s.replace(/`([^`]+)`/g, "<code class=\"note-code-inline\">$1</code>");
    return s;
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Empty line: close any open blocks
    if (!trimmed) {
      closeLists();
      closeTable();
      result.push("<div class=\"note-empty-gap\"></div>");
      continue;
    }

    // Table Row: starts and ends or contains '|'
    if (trimmed.startsWith("|") && trimmed.includes("|", 1)) {
      closeLists();
      const cells = trimmed
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());

      // Check if it's separator row: | --- | --- |
      const isSeparator = cells.every((c) => /^:?-+:?$/.test(c));

      if (isSeparator) {
        // Just mark header as ready
        continue;
      }

      if (!inTable) {
        // Start table with the header row
        inTable = true;
        tableHeaderParsed = true;
        result.push("<div class=\"note-table-wrapper\"><table class=\"note-rendered-table\"><thead><tr>");
        cells.forEach((c) => {
          result.push(`<th>${formatInline(c)}</th>`);
        });
        result.push("</tr></thead><tbody>");
      } else {
        // Body row
        result.push("<tr>");
        cells.forEach((c) => {
          result.push(`<td>${formatInline(c)}</td>`);
        });
        result.push("</tr>");
      }
      continue;
    } else {
      closeTable();
    }

    // Checkboxes in text: - [ ] or - [x]
    const todoMatch = trimmed.match(/^-\s*\[([ xX])\]\s*(.*)$/);
    if (todoMatch) {
      closeLists();
      const isDone = todoMatch[1].toLowerCase() === "x";
      const taskText = formatInline(todoMatch[2]);
      result.push(
        `<div class="note-rendered-todo ${isDone ? "is-done" : ""}"><span class="note-todo-checkbox">${isDone ? "☑" : "☐"}</span><span class="note-todo-text">${taskText}</span></div>`
      );
      continue;
    }

    // Bullet lists: starts with • or - or *
    const bulletMatch = trimmed.match(/^(?:•|-|\*)\s+(.*)$/);
    if (bulletMatch) {
      if (inOl) {
        result.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        result.push("<ul class=\"note-rendered-ul\">");
        inUl = true;
      }
      result.push(`<li><span class="note-bullet-dot">•</span><span class="note-bullet-text">${formatInline(bulletMatch[1])}</span></li>`);
      continue;
    }

    // Numbered lists: starts with 1. 2. etc
    const numberMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numberMatch) {
      if (inUl) {
        result.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        result.push("<ol class=\"note-rendered-ol\">");
        inOl = true;
      }
      result.push(`<li><span class="note-ol-num">${numberMatch[1]}.</span><span class="note-ol-text">${formatInline(numberMatch[2])}</span></li>`);
      continue;
    }

    // If we were in a list and this line is not a list item, close the list
    closeLists();

    // Headings H1 to H5
    const h5Match = trimmed.match(/^#####\s+(.*)$/);
    if (h5Match) {
      result.push(`<h5 class="note-rendered-h5">${formatInline(h5Match[1])}</h5>`);
      continue;
    }
    const h4Match = trimmed.match(/^####\s+(.*)$/);
    if (h4Match) {
      result.push(`<h4 class="note-rendered-h4">${formatInline(h4Match[1])}</h4>`);
      continue;
    }
    const h3Match = trimmed.match(/^###\s+(.*)$/);
    if (h3Match) {
      result.push(`<h3 class="note-rendered-h3">${formatInline(h3Match[1])}</h3>`);
      continue;
    }
    const h2Match = trimmed.match(/^##\s+(.*)$/);
    if (h2Match) {
      result.push(`<h2 class="note-rendered-h2">${formatInline(h2Match[1])}</h2>`);
      continue;
    }
    const h1Match = trimmed.match(/^#\s+(.*)$/);
    if (h1Match) {
      result.push(`<h1 class="note-rendered-h1">${formatInline(h1Match[1])}</h1>`);
      continue;
    }

    // Default: paragraph
    result.push(`<p class="note-rendered-p">${formatInline(trimmed)}</p>`);
  }

  closeLists();
  closeTable();

  return result.join("\n");
}

/**
 * Builds printable standalone HTML document for PDF generation.
 */
export function buildNotePrintableHtml(note: {
  title?: string;
  type: "checklist" | "text";
  content?: string;
  items?: ChecklistItem[];
  labels?: string[];
  updatedAt?: string;
  color?: string;
}): string {
  const noteTitle = note.title ? escapeHtml(note.title) : "Catatan Tanpa Judul";
  const dateStr = note.updatedAt || new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const labelsHtml = (note.labels || [])
    .map((lbl) => `<span class="pdf-tag">🏷️ ${escapeHtml(lbl)}</span>`)
    .join(" ");

  let bodyContent = "";
  if (note.type === "checklist") {
    const items = note.items || [];
    bodyContent = `
      <div class="pdf-checklist">
        ${items
          .map(
            (item) => `
          <div class="pdf-checklist-item ${item.done ? "is-done" : ""}">
            <span class="pdf-check-box">${item.done ? "☑" : "☐"}</span>
            <span class="pdf-check-text">${escapeHtml(item.text)}</span>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  } else {
    bodyContent = parseMarkdownToHtml(note.content || "");
  }

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>${noteTitle} - BiarFokus</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      line-height: 1.6;
      font-size: 13.5px;
    }
    .pdf-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px 24px;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
    }
    .pdf-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .pdf-brand {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .pdf-brand-title {
      font-family: Georgia, serif;
      font-size: 22px;
      font-weight: bold;
      color: #0f172a;
      letter-spacing: -0.3px;
    }
    .pdf-meta {
      font-size: 11px;
      color: #64748b;
      text-align: right;
    }
    .pdf-title {
      font-family: Georgia, serif;
      font-size: 26px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 10px;
      letter-spacing: -0.4px;
    }
    .pdf-labels-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 20px;
    }
    .pdf-tag {
      font-size: 11px;
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
      padding: 2px 8px;
      border-radius: 9999px;
      font-weight: 600;
    }
    .pdf-body {
      color: #1e293b;
      margin-top: 14px;
    }
    /* Markdown Styles in PDF */
    .note-rendered-h1 { font-size: 20px; font-weight: 800; margin: 18px 0 8px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    .note-rendered-h2 { font-size: 17px; font-weight: 700; margin: 16px 0 6px; color: #1e293b; }
    .note-rendered-h3 { font-size: 15px; font-weight: 700; margin: 14px 0 6px; color: #334155; }
    .note-rendered-h4 { font-size: 13.5px; font-weight: 700; margin: 12px 0 4px; color: #475569; }
    .note-rendered-h5 { font-size: 12.5px; font-weight: 700; margin: 10px 0 4px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .note-rendered-p { margin: 0 0 10px; }
    .note-rendered-ul, .note-rendered-ol { margin: 8px 0 12px; padding: 0 0 0 4px; list-style: none; }
    .note-rendered-ul li, .note-rendered-ol li { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; }
    .note-bullet-dot { color: #0284c7; font-size: 14px; font-weight: bold; flex-shrink: 0; }
    .note-ol-num { color: #0284c7; font-weight: 700; font-size: 12px; min-width: 18px; flex-shrink: 0; }
    .note-table-wrapper { width: 100%; overflow-x: auto; margin: 14px 0; }
    .note-rendered-table { width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12px; }
    .note-rendered-table th { background: #f8fafc; color: #0f172a; font-weight: 700; padding: 8px 12px; border: 1px solid #cbd5e1; text-align: left; }
    .note-rendered-table td { padding: 8px 12px; border: 1px solid #e2e8f0; }
    .note-rendered-table tr:nth-child(even) td { background: #f8fafc; }
    .note-code-inline { background: #f1f5f9; padding: 2px 5px; border-radius: 4px; font-family: monospace; font-size: 12px; color: #0284c7; }
    .note-rendered-todo { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .note-rendered-todo.is-done { opacity: 0.6; text-decoration: line-through; }
    .pdf-checklist-item { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; padding: 4px 0; border-bottom: 1px dashed #f1f5f9; }
    .pdf-checklist-item.is-done .pdf-check-text { text-decoration: line-through; opacity: 0.6; }
    .pdf-check-box { font-size: 16px; color: #0284c7; font-weight: bold; }
    .pdf-footer {
      margin-top: 32px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 10.5px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="pdf-container">
    <div class="pdf-header">
      <div class="pdf-brand">
        <span class="pdf-brand-title">biarfokus</span>
      </div>
      <div class="pdf-meta">
        <div>BiarFokus Productivity Workspace</div>
        <div>${dateStr}</div>
      </div>
    </div>

    <h1 class="pdf-title">${noteTitle}</h1>
    ${labelsHtml ? `<div class="pdf-labels-row">${labelsHtml}</div>` : ""}

    <div class="pdf-body">
      ${bodyContent}
    </div>

    <div class="pdf-footer">
      <span>Dibuat dengan BiarFokus (biarfokus.id)</span>
      <span>Halaman 1</span>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Triggers native browser print/save-to-PDF via a clean iframe.
 */
export function exportNoteToPdf(note: {
  title?: string;
  type: "checklist" | "text";
  content?: string;
  items?: ChecklistItem[];
  labels?: string[];
  updatedAt?: string;
  color?: string;
}): void {
  if (typeof window === "undefined") return;

  const html = buildNotePrintableHtml(note);
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  // Wait for resources to settle then trigger print
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.warn("Print dialog error:", e);
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }
  }, 250);
}
