import type { SupabaseClient } from "@supabase/supabase-js";

export function normalizeDisplayName(value: string) {
  const name = value.trim();
  if (name.length < 1 || name.length > 80) {
    throw new Error("Nama harus berisi 1 sampai 80 karakter.");
  }
  return name;
}

/** Returns the avatar URL only when it is a well-formed https URL; otherwise null (callers show initials). */
export function getSafeAvatarUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
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
