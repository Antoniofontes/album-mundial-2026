import { createClient } from "@/lib/supabase/client";
import { ALBUM } from "@/lib/album";

/** Códigos que le faltan a otro usuario (colección pública / propia legible por RLS). */
export async function fetchTheirMissingCodes(userId: string): Promise<Set<string>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("collection")
    .select("sticker_code, count")
    .eq("user_id", userId);
  if (error) throw error;
  const map: Record<string, number> = {};
  for (const row of data ?? []) map[row.sticker_code] = row.count;
  return new Set(
    ALBUM.filter((s) => (map[s.code] ?? 0) === 0).map((s) => s.code),
  );
}
