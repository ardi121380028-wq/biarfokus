"use client";

import { useMemo } from "react";
import { parseMarkdownToHtml } from "@/features/notes/note-format";

type NoteContentRendererProps = {
  content?: string;
  isCardPreview?: boolean;
  className?: string;
};

export function NoteContentRenderer({
  content = "",
  isCardPreview = false,
  className = "",
}: NoteContentRendererProps) {
  const html = useMemo(() => {
    return parseMarkdownToHtml(content);
  }, [content]);

  if (!content || !content.trim()) {
    return <p className="keep-card-text empty">Catatan kosong...</p>;
  }

  return (
    <div
      className={`note-rendered-content ${isCardPreview ? "is-card-preview" : ""} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
