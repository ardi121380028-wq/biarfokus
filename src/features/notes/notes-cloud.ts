import type { SupabaseClient } from "@supabase/supabase-js";
import type { KeepNote } from "@/types/domain";

type DbKeepNote = {
  id: string;
  user_id: string;
  title: string;
  type: string;
  content: string | null;
  items: unknown;
  color: string;
  labels: string[] | null;
  pinned: boolean;
  created_at: string;
  updated_at: string;
};

export function mapDbKeepNote(row: DbKeepNote): KeepNote {
  return {
    id: row.id,
    title: row.title || "",
    type: row.type === "text" ? "text" : "checklist",
    content: row.content || "",
    items: Array.isArray(row.items) ? (row.items as KeepNote["items"]) : [],
    color: row.color || "var(--paper)",
    labels: Array.isArray(row.labels) ? row.labels : [],
    pinned: Boolean(row.pinned),
    updatedAt: new Date(row.updated_at).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

export async function loadCloudNotes(
  supabase: SupabaseClient,
  userId: string,
): Promise<KeepNote[]> {
  const { data, error } = await supabase
    .from("keep_notes")
    .select("*")
    .eq("user_id", userId)
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return ((data as DbKeepNote[]) || []).map(mapDbKeepNote);
}

export async function upsertCloudNote(
  supabase: SupabaseClient,
  userId: string,
  note: KeepNote,
): Promise<void> {
  const payload = {
    id: note.id,
    user_id: userId,
    title: note.title || "",
    type: note.type,
    content: note.content || "",
    items: note.items || [],
    color: note.color,
    labels: note.labels || [],
    pinned: Boolean(note.pinned),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("keep_notes").upsert(payload);
  if (error) throw error;
}

export async function deleteCloudNote(
  supabase: SupabaseClient,
  userId: string,
  noteId: string,
): Promise<void> {
  const { error } = await supabase
    .from("keep_notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function loadCloudLabels(
  supabase: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("keep_labels")
    .select("name")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) throw error;
  return ((data as Array<{ name: string }>) || []).map((row) => row.name);
}

export async function insertCloudLabel(
  supabase: SupabaseClient,
  userId: string,
  label: string,
): Promise<void> {
  const { error } = await supabase
    .from("keep_labels")
    .upsert({ user_id: userId, name: label }, { onConflict: "user_id, name" });

  if (error) throw error;
}

export async function deleteCloudLabel(
  supabase: SupabaseClient,
  userId: string,
  label: string,
): Promise<void> {
  const { error } = await supabase
    .from("keep_labels")
    .delete()
    .eq("user_id", userId)
    .ilike("name", label);

  if (error) throw error;
}
