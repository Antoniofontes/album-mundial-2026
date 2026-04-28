import { ALBUM } from "@/lib/album";

/**
 * Figuritas donde vos tenés más de una copia y a la otra persona le falta (count === 0).
 */
export function spareDupesTheyNeed(
  myCollection: Record<string, number>,
  theirMissing: Set<string>,
): string[] {
  const out: string[] = [];
  for (const s of ALBUM) {
    const code = s.code;
    if ((myCollection[code] ?? 0) > 1 && theirMissing.has(code)) out.push(code);
  }
  return out;
}

/**
 * Amigo sin cuenta: repetidas tuyas entre las que no marcaste como “él tiene”.
 * (Si no marcó que las tiene, puede que le falten — sirve como guía para ofrecer.)
 */
export function spareDupesBeyondMarkedOwned(
  myCollection: Record<string, number>,
  friendMarkedHas: Set<string>,
): string[] {
  const out: string[] = [];
  for (const s of ALBUM) {
    const code = s.code;
    if ((myCollection[code] ?? 0) > 1 && !friendMarkedHas.has(code)) out.push(code);
  }
  return out;
}

/** Parsea texto libre (comas, espacios, saltos) y devuelve códigos válidos del álbum en orden de aparición en el álbum. */
export function parseStickerCodesInput(raw: string): string[] {
  const parts = raw.split(/[\s,;\n\r]+/).map((s) => s.trim()).filter(Boolean);
  const wanted = new Set(parts);
  return ALBUM.filter((s) => wanted.has(s.code)).map((s) => s.code);
}

export function messageSpareDupes(
  codes: string[],
  recipientLabel: string,
): string {
  const head = codes.length === 1 ? "esta repetida" : "estas repetidas";
  return [
    `Hola${recipientLabel ? ` (${recipientLabel})` : ""}! Te puedo dar ${head}:`,
    "",
    codes.join(", "),
    "",
    `— ${codes.length} figurita${codes.length === 1 ? "" : "s"} —`,
    "",
    "Álbum Mundial 2026",
  ].join("\n");
}
