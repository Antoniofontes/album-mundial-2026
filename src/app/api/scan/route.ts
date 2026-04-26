import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import {
  stickersForContext,
  describeContext,
  type ScanContext,
  type Sticker,
} from "@/lib/album";
import type { AlbumPage } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const maxDuration = 60;

// Claude permite hasta 5MB en base64. Apuntamos a ~3.5MB con margen de seguridad.
const TARGET_BASE64_BYTES = 3.5 * 1024 * 1024;
const MAX_SIDE_PX = 1568;

type ScanRequestBody = {
  scanId: string;
  storagePath: string;
  context?: ScanContext;
};

type SupportedMedia = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

export async function POST(req: Request) {
  const reqId = Math.random().toString(36).slice(2, 8);
  const log = (...args: unknown[]) => console.log(`[scan ${reqId}]`, ...args);
  const errLog = (...args: unknown[]) =>
    console.error(`[scan ${reqId}]`, ...args);

  try {
    const body = (await req.json()) as ScanRequestBody;
    const { scanId, storagePath } = body;
    const context: ScanContext = body.context ?? { kind: "auto" };

    log("start", { scanId, storagePath, context });

    if (!process.env.ANTHROPIC_API_KEY) {
      errLog("missing ANTHROPIC_API_KEY");
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY no configurada", reqId },
        { status: 500 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      errLog("no auth");
      return NextResponse.json({ error: "no auth", reqId }, { status: 401 });
    }
    log("user", user.id);

    // 1) Imagen del usuario (descarga + compresión para Claude)
    const userImage = await downloadAndCompress(
      supabase,
      "album-scans",
      storagePath,
      log,
    );
    if (!userImage.ok) {
      errLog("user image download error", userImage.error);
      return NextResponse.json(
        {
          error: "No pude leer la imagen del storage: " + userImage.error,
          reqId,
        },
        { status: 500 },
      );
    }
    log("user image", {
      original_kb: userImage.originalKb,
      compressed_kb: userImage.compressedKb,
      compressed_mediaType: userImage.mediaType,
      compressed_quality: userImage.quality,
      compressed_resized_to: userImage.resizedTo,
    });

    // 2) Imagen de referencia (álbum vacío) si existe para este contexto
    let reference: { b64: string; mediaType: SupportedMedia } | null = null;
    let resolvedCustomNumbers: number[] | null = null;
    let resolvedCustomLabel: string | null = null;
    if (context.kind !== "auto") {
      let refRow: AlbumPage | undefined;
      if (context.kind === "custom") {
        if (context.customId) {
          const { data: refRows } = await supabase
            .from("album_pages")
            .select("*")
            .eq("id", context.customId)
            .limit(1)
            .returns<AlbumPage[]>();
          refRow = refRows?.[0];
          if (refRow) {
            resolvedCustomNumbers = refRow.sticker_numbers;
            resolvedCustomLabel = refRow.custom_label;
          }
        }
      } else {
        let refQuery = supabase
          .from("album_pages")
          .select("*")
          .eq("kind", context.kind);
        if (context.kind === "team" && context.teamCode) {
          refQuery = refQuery.eq("team_code", context.teamCode);
          if (context.teamSheet) {
            refQuery = refQuery.eq("team_sheet", context.teamSheet);
          }
        }
        const { data: refRows } = await refQuery
          .limit(1)
          .returns<AlbumPage[]>();
        refRow = refRows?.[0];
      }

      if (refRow) {
        const refImg = await downloadAndCompress(
          supabase,
          "album-pages",
          refRow.storage_path,
          log,
        );
        if (refImg.ok) {
          reference = { b64: refImg.b64, mediaType: refImg.mediaType };
          log("using reference page", {
            id: refRow.id,
            original_kb: refImg.originalKb,
            compressed_kb: refImg.compressedKb,
            kind: refRow.kind,
          });
        } else {
          log("reference download failed", refImg.error);
        }
      } else {
        log("no reference page configured for this context");
      }
    }

    // Lista cerrada de figuritas válidas para esa página
    const enrichedCtx: ScanContext =
      context.kind === "custom" && resolvedCustomNumbers
        ? {
            ...context,
            customNumbers: resolvedCustomNumbers,
            customLabel:
              context.customLabel ?? resolvedCustomLabel ?? undefined,
          }
        : context;
    const candidates = stickersForContext(enrichedCtx);
    const validNumbers = candidates.map((s) => s.number);
    log("context candidates", {
      desc: describeContext(enrichedCtx),
      count: validNumbers.length,
      hasReference: !!reference,
    });

    const { systemPrompt, userPrompt } = buildPrompt(
      enrichedCtx,
      candidates,
      !!reference,
    );

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const model = "claude-sonnet-4-5";
    log("calling Anthropic", { model });

    const messageContent: Anthropic.Messages.ContentBlockParam[] = [];
    if (reference) {
      messageContent.push({
        type: "text",
        text: "IMAGEN 1 (referencia: álbum vacío para esta página):",
      });
      messageContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: reference.mediaType,
          data: reference.b64,
        },
      });
      messageContent.push({
        type: "text",
        text: "IMAGEN 2 (foto del usuario, álbum real):",
      });
      messageContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: userImage.mediaType,
          data: userImage.b64,
        },
      });
    } else {
      messageContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: userImage.mediaType,
          data: userImage.b64,
        },
      });
    }
    messageContent.push({ type: "text", text: userPrompt });

    const startedAt = Date.now();
    const msg = await client.messages.create({
      model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: messageContent }],
    });
    const durationMs = Date.now() - startedAt;

    const text = msg.content
      .filter((c) => c.type === "text")
      .map((c) => (c as { type: "text"; text: string }).text)
      .join("");

    log("anthropic done", {
      durationMs,
      input_tokens: msg.usage?.input_tokens,
      output_tokens: msg.usage?.output_tokens,
      stop_reason: msg.stop_reason,
      raw_chars: text.length,
    });
    log("anthropic raw text:\n" + text);

    let detected = parseDetected(text);
    const beforeFilter = detected.length;

    if (context.kind !== "auto" && validNumbers.length > 0) {
      const valid = new Set(validNumbers);
      detected = detected.filter((n) => valid.has(n));
    }

    log("parsed", {
      total_in_raw: beforeFilter,
      after_context_filter: detected.length,
      detected,
    });

    await supabase
      .from("scans")
      .update({
        detected_numbers: detected,
        status: "done",
      })
      .eq("id", scanId);

    return NextResponse.json({
      reqId,
      detected,
      context: enrichedCtx,
      contextDescription: describeContext(enrichedCtx),
      candidatesCount: validNumbers.length,
      usedReference: !!reference,
      raw: text,
      durationMs,
      usage: msg.usage,
      model,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "scan failed";
    const stack = e instanceof Error ? e.stack : undefined;
    errLog("CRASH", message, stack);
    return NextResponse.json({ error: message, reqId }, { status: 500 });
  }
}

async function downloadAndCompress(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bucket: string,
  path: string,
  log: (...args: unknown[]) => void,
): Promise<
  | {
      ok: true;
      b64: string;
      mediaType: SupportedMedia;
      originalKb: number;
      compressedKb: number;
      quality: number;
      resizedTo: { width: number; height: number };
    }
  | { ok: false; error: string }
> {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error || !data) {
    return { ok: false, error: error?.message ?? "no data" };
  }
  const original = Buffer.from(await data.arrayBuffer());
  const originalKb = Math.round(original.length / 1024);

  try {
    let pipeline = sharp(original, { failOn: "none" }).rotate(); // honra EXIF
    const meta = await pipeline.metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    const maxSide = Math.max(w, h);
    let targetSide = MAX_SIDE_PX;

    let quality = 85;
    let out: Buffer | null = null;
    let lastWH = { width: w, height: h };

    // Bajamos quality y, si todavía no alcanza, bajamos también la resolución.
    for (let attempt = 0; attempt < 8; attempt++) {
      let p = sharp(original, { failOn: "none" }).rotate();
      if (maxSide > targetSide) {
        p = p.resize({
          width: targetSide,
          height: targetSide,
          fit: "inside",
        });
      }
      const buf = await p.jpeg({ quality, mozjpeg: true }).toBuffer();
      const finalMeta = await sharp(buf).metadata();
      lastWH = { width: finalMeta.width ?? 0, height: finalMeta.height ?? 0 };
      const base64Bytes = Math.ceil((buf.length * 4) / 3);
      log("compress attempt", {
        attempt,
        targetSide,
        quality,
        out_kb: Math.round(buf.length / 1024),
        base64_kb: Math.round(base64Bytes / 1024),
      });
      if (base64Bytes <= TARGET_BASE64_BYTES) {
        out = buf;
        break;
      }
      if (quality > 55) {
        quality -= 10;
      } else if (targetSide > 768) {
        targetSide = Math.round(targetSide * 0.8);
        quality = 80;
      } else {
        out = buf; // último recurso
        break;
      }
    }

    if (!out) {
      return { ok: false, error: "no pude comprimir la imagen lo suficiente" };
    }

    return {
      ok: true,
      b64: out.toString("base64"),
      mediaType: "image/jpeg",
      originalKb,
      compressedKb: Math.round(out.length / 1024),
      quality,
      resizedTo: lastWH,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "compress failed";
    return { ok: false, error: `compress: ${msg}` };
  }
}

function buildPrompt(
  ctx: ScanContext,
  candidates: Sticker[],
  hasReference: boolean,
): { systemPrompt: string; userPrompt: string } {
  if (ctx.kind === "auto" || candidates.length === 0) {
    return {
      systemPrompt: `Sos un sistema OCR experto en álbumes Panini "FIFA World Cup 2026" (980 figuritas).
Devolvés SOLO un JSON: { "detected": [<numero>, ...], "notes": "..." }.
Reglas estrictas:
- "detected" lista los números de las figuritas PEGADAS (visibles encima del slot del álbum).
- Ignorá las casillas vacías (silueta o número del slot sin pegatina).
- Los números están entre 1 y 980.
- Cada figurita tiene su número impreso. Usalo si es legible.
- No inventes. Si dudás de un número, omitilo.
- Sin texto antes o después del JSON, sin markdown.`,
      userPrompt:
        "Detectá las figuritas pegadas en esta página del álbum. Devolvé SOLO el JSON.",
    };
  }

  const desc = describeContext(ctx);
  const numbers = candidates.map((s) => s.number);
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  const list = candidates
    .map((s) => `  ${s.number}: ${s.name}${s.role ? ` (${s.role})` : ""}`)
    .join("\n");

  if (hasReference) {
    const systemPrompt = `Sos un OCR experto en álbumes Panini "FIFA World Cup 2026" trabajando en MODO COMPARACIÓN.

Te paso DOS imágenes:
- IMAGEN 1: la página del álbum VACÍA (referencia). Te muestra exactamente cómo se ve la página sin ninguna figurita pegada.
- IMAGEN 2: la página del álbum del USUARIO. Acá puede haber figuritas pegadas encima de algunos slots.

Tu tarea: comparar IMAGEN 2 contra IMAGEN 1 y decirme qué slots tienen sticker pegado en la 2 pero están vacíos en la 1.

CONTEXTO DE LA PÁGINA: ${desc}
Rango de números válidos: ${min} a ${max}.
LISTA EXACTA DE FIGURITAS POSIBLES:
${list}

REGLAS:
1. Devolvés SOLO un objeto JSON: { "detected": [<numero>, ...], "notes": "..." }.
2. "detected" = números de la lista de arriba que están PEGADOS en IMAGEN 2 y no en IMAGEN 1.
3. NO incluyas slots que se ven igual en ambas imágenes (esos están vacíos).
4. Si dudás, omití el número.
5. Sin texto antes/después del JSON.`;

    const userPrompt = `Compará las dos imágenes y devolveme qué figuritas están pegadas en la del usuario (IMAGEN 2) usando la vacía (IMAGEN 1) como referencia.
Esta página es: ${desc}.
Devolvé SOLO el JSON.`;

    return { systemPrompt, userPrompt };
  }

  const systemPrompt = `Sos un OCR experto en álbumes Panini "FIFA World Cup 2026".

CONTEXTO DE LA FOTO:
${desc}
Números válidos para esta página: del ${min} al ${max} (lista completa abajo).

LISTA EXACTA DE FIGURITAS POSIBLES:
${list}

REGLAS:
1. Devolvés SOLO un JSON: { "detected": [<numero>, ...], "notes": "..." }.
2. "detected" lista UNICAMENTE números de la lista de arriba.
3. Una figurita está "pegada" cuando hay una pegatina visible que tapa el slot. NO si solo se ve la silueta y número impresos por el álbum.
4. Cuando dudes, omití el número.
5. NO incluyas números fuera del rango ${min}-${max}.
6. Sin texto antes/después del JSON.`;

  const userPrompt = `Esta foto corresponde a: ${desc}.
Devolveme qué figuritas están pegadas. Devolvé SOLO el JSON.`;

  return { systemPrompt, userPrompt };
}

function parseDetected(text: string): number[] {
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed?.detected)) return cleanNumbers(parsed.detected);
  } catch {}

  const match = text.match(/\{[\s\S]*"detected"[\s\S]*\}/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed?.detected)) return cleanNumbers(parsed.detected);
    } catch {}
  }

  const nums = Array.from(text.matchAll(/\b(\d{1,3})\b/g))
    .map((m) => Number(m[1]))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= 980);
  return cleanNumbers(nums);
}

function cleanNumbers(arr: unknown[]): number[] {
  const out = new Set<number>();
  for (const v of arr) {
    const n = Number(v);
    if (Number.isFinite(n) && n >= 1 && n <= 980) out.add(Math.floor(n));
  }
  return Array.from(out).sort((a, b) => a - b);
}
