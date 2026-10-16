import type { SupabaseClient } from "@supabase/supabase-js";

export function normalizeDisplayName(value: string) {
  const name = value.trim();
  if (name.length < 1 || name.length > 80) {
    throw new Error("Nama harus berisi 1 sampai 80 karakter.");
  }
  return name;
}

export async function updateDisplayName(
  supabase: SupabaseClient,
  userId: string,
  displayName: string,
) {
  const normalizedName = normalizeDisplayName(displayName);
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: normalizedName })
    .eq("id", userId);
  if (error) throw error;
  return normalizedName;
}
