import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  escapeHtml,
  insertMarkdownFormatting,
  parseMarkdownToHtml,
  buildNotePrintableHtml,
} from "./note-format.ts";

describe("note-format", () => {
  it("escapes html characters to prevent XSS", () => {
    assert.equal(escapeHtml("<script>alert('xss')</script>"), "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;");
    assert.equal(escapeHtml('Tom & "Jerry"'), "Tom &amp; &quot;Jerry&quot;");
  });

  it("inserts headings H1 to H5 properly", () => {
    const h1 = insertMarkdownFormatting("Catatan", 0, 7, "h1");
    assert.equal(h1.newText.includes("# Catatan"), true);

    const h2 = insertMarkdownFormatting("Sub", 0, 3, "h2");
    assert.equal(h2.newText.includes("## Sub"), true);

    const h3 = insertMarkdownFormatting("", 0, 0, "h3");
    assert.equal(h3.newText.includes("### Heading 3"), true);

    const h4 = insertMarkdownFormatting("", 0, 0, "h4");
    assert.equal(h4.newText.includes("#### Heading 4"), true);

    const h5 = insertMarkdownFormatting("", 0, 0, "h5");
    assert.equal(h5.newText.includes("##### Heading 5"), true);
  });

  it("inserts bullet and numbered lists", () => {
    const bullet = insertMarkdownFormatting("Poin penting", 0, 12, "bullet");
    assert.equal(bullet.newText.includes("• Poin penting"), true);

    const multilineBullet = insertMarkdownFormatting("Satu\nDua\nTiga", 0, 13, "bullet");
    assert.equal(multilineBullet.newText.includes("• Satu\n• Dua\n• Tiga"), true);

    const number = insertMarkdownFormatting("Pertama", 0, 7, "number");
    assert.equal(number.newText.includes("1. Pertama"), true);
  });

  it("inserts markdown grid/table template", () => {
    const grid = insertMarkdownFormatting("", 0, 0, "grid");
    assert.equal(grid.newText.includes("| Kolom 1 | Kolom 2 | Kolom 3 |"), true);
    assert.equal(grid.newText.includes("| --- | --- | --- |"), true);
  });

  it("parses headings H1 through H5 into HTML", () => {
    const md = "# Judul H1\n## Judul H2\n### Judul H3\n#### Judul H4\n##### Judul H5";
    const html = parseMarkdownToHtml(md);
    assert.equal(html.includes("<h1 class=\"note-rendered-h1\">Judul H1</h1>"), true);
    assert.equal(html.includes("<h2 class=\"note-rendered-h2\">Judul H2</h2>"), true);
    assert.equal(html.includes("<h3 class=\"note-rendered-h3\">Judul H3</h3>"), true);
    assert.equal(html.includes("<h4 class=\"note-rendered-h4\">Judul H4</h4>"), true);
    assert.equal(html.includes("<h5 class=\"note-rendered-h5\">Judul H5</h5>"), true);
  });

  it("parses bullet and numbered lists into structured HTML", () => {
    const md = "• Apel\n• Jeruk\n• Mangga";
    const html = parseMarkdownToHtml(md);
    assert.equal(html.includes("<ul class=\"note-rendered-ul\">"), true);
    assert.equal(html.includes("Apel"), true);
    assert.equal(html.includes("Jeruk"), true);
    assert.equal(html.includes("</ul>"), true);

    const numMd = "1. Buka aplikasi\n2. Tulis catatan";
    const numHtml = parseMarkdownToHtml(numMd);
    assert.equal(numHtml.includes("<ol class=\"note-rendered-ol\">"), true);
    assert.equal(numHtml.includes("Buka aplikasi"), true);
    assert.equal(numHtml.includes("</ol>"), true);
  });

  it("parses markdown grid/table into HTML table", () => {
    const tableMd = [
      "| Fitur | Status |",
      "| --- | --- |",
      "| Auth | Selesai |",
      "| Kanban | Berjalan |",
    ].join("\n");
    const html = parseMarkdownToHtml(tableMd);
    assert.equal(html.includes("<table class=\"note-rendered-table\">"), true);
    assert.equal(html.includes("<th>Fitur</th>"), true);
    assert.equal(html.includes("<th>Status</th>"), true);
    assert.equal(html.includes("<td>Auth</td>"), true);
    assert.equal(html.includes("<td>Selesai</td>"), true);
  });

  it("builds printable PDF HTML document with note metadata", () => {
    const printable = buildNotePrintableHtml({
      title: "Rencana Strategis",
      type: "text",
      content: "# Roadmap 2026\n• Rilis v1\n• Scale user",
      labels: ["Strategi", "Q4"],
      updatedAt: "22 Okt, 14:00",
    });

    assert.equal(printable.includes("Rencana Strategis"), true);
    assert.equal(printable.includes("biarfokus"), true);
    assert.equal(printable.includes("🏷️ Strategi"), true);
    assert.equal(printable.includes("Roadmap 2026"), true);
    assert.equal(printable.includes("Rilis v1"), true);
  });
});
