import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import {
  stickersForContext,
  stickersOfTeam,
  splitTeamSheet,
  describeContext,
  parseStickerCode,
  isValidCode,
  type ScanContext,
  type Sticker,
} from "@/lib/album";
import { TEAMS } from "@/lib/teams";
import type { AlbumPage } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const TARGET_BASE64_BYTES = 3.5 * 1024 * 1024;
const MAX_SIDE_PX = 1280;
const ID_MAX_SIDE_PX = 768;
const DETECTION_MODEL = "claude-sonnet-4-5";
const IDENTIFY_MODEL = "claude-haiku-4-5";
const RETRY_MAX_ATTEMPTS = 4;
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

    const { data: remaining, error: quotaErr } = await supabase.rpc("use_scan");
    log("scan quota", { remaining, quotaErr });
    if (quotaErr) {
      errLog("quota check failed", quotaErr.message);
      return NextResponse.json(
        { error: "quota check failed: " + quotaErr.message, reqId },
        { status: 500 },
      );
    }
    if (remaining === -1) {
      errLog("scan limit reached");
      return NextResponse.json(
        { error: "scan_limit_reached", reqId },
        { status: 402 },
      );
    }

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

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const model = DETECTION_MODEL;

    let workingContext: ScanContext = context;
    let autoIdentified: {
      kind: string;
      teamCode?: string;
      teamSheet?: number;
      raw?: string;
    } | null = null;
    if (context.kind === "auto") {
      log("auto-identify: calling Claude to detect page kind");
      const idStarted = Date.now();
      try {
        const smallUserImage = await downloadAndCompress(
          supabase,
          "album-scans",
          storagePath,
          log,
          ID_MAX_SIDE_PX,
        );
        const idImage = smallUserImage.ok ? smallUserImage : userImage;
        const idMsg = await callWithRetry(
          () =>
            client.messages.create({
          model: IDENTIFY_MODEL,
          max_tokens: 200,
          system: `Identificás qué página del álbum Panini "FIFA World Cup 2026" muestra una foto.

El álbum tiene 994 stickers identificados por CÓDIGO impreso (no por número global):
- 48 selecciones × 20 stickers = 960. Cada sticker tiene código <CODE>1..<CODE>20 donde CODE es el código del país.
  Cada selección ocupa 2 hojas:
   · HOJA 1 = <CODE>1..<CODE>10 → escudo (<CODE>1) + 9 jugadores.
   · HOJA 2 = <CODE>11..<CODE>20 → 9 jugadores + foto grupal (<CODE>13).
- Coca-Cola: códigos CC1..CC14 (14 stickers).
- FIFA World Cup specials: códigos FWC1..FWC19 (19 stickers, mascotas/pelota/copa/sedes/etc.).
- Portada: código "00" (1 sticker).

Códigos de selección: ${TEAMS.map((t) => `${t.code}=${t.name}`).join(", ")}.

Devolvés SOLO un JSON: { "kind": "team"|"coca_cola"|"fwc"|"intro"|"unknown", "teamCode": "<codigo>"|null, "teamSheet": 1|2|null, "reason": "<breve>" }.

Reglas:
- Si ves un escudo grande de selección y jugadores: kind="team", teamSheet=1.
- Si ves una foto grupal del equipo y jugadores sin escudo grande: kind="team", teamSheet=2.
- Si ves logos de Coca-Cola o cromos con marco rojo Coca-Cola: kind="coca_cola".
- Si ves la portada principal del álbum: kind="intro".
- Si ves mascotas, copa/pelota, países sede, campeones, gráficos FIFA: kind="fwc".
- Sin markdown, sin texto fuera del JSON.`,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: idImage.mediaType,
                    data: idImage.b64,
                  },
                },
                {
                  type: "text",
                  text: "¿Qué página es? Devolvé solo el JSON.",
                },
              ],
            },
          ],
            }),
          log,
          "identify",
        );
        const idText = idMsg.content
          .filter((c) => c.type === "text")
          .map((c) => (c as { type: "text"; text: string }).text)
          .join("");
        log("auto-identify done", {
          durationMs: Date.now() - idStarted,
          input_tokens: idMsg.usage?.input_tokens,
          output_tokens: idMsg.usage?.output_tokens,
          raw: idText,
        });
        const parsed = parseIdentify(idText);
        if (parsed) {
          autoIdentified = { ...parsed, raw: idText };
          if (parsed.kind === "team" && parsed.teamCode) {
            const valid = TEAMS.find((t) => t.code === parsed.teamCode);
            if (valid) {
              workingContext = {
                kind: "team",
                teamCode: parsed.teamCode,
                teamSheet: (parsed.teamSheet ?? 1) as 1 | 2,
              };
              log("auto-identify -> team", workingContext);
            }
          } else if (parsed.kind === "coca_cola") {
            workingContext = { kind: "coca_cola" };
          } else if (parsed.kind === "fwc") {
            workingContext = { kind: "fwc" };
          } else if (parsed.kind === "intro") {
            workingContext = { kind: "intro" };
          } else {
            log("auto-identify -> unknown, keeping auto");
          }
        }
      } catch (e) {
        const m = e instanceof Error ? e.message : "auto-identify failed";
        errLog("auto-identify error", m);
      }
    }

    type Ref = {
      b64: string;
      mediaType: SupportedMedia;
      label: string;
      teamSheet?: 1 | 2;
    };
    const references: Ref[] = [];
    let resolvedCustomCodes: string[] | null = null;
    let resolvedCustomLabel: string | null = null;
    if (workingContext.kind === "custom" && workingContext.customId) {
      const { data: refRows } = await supabase
        .from("album_pages")
        .select("*")
        .eq("id", workingContext.customId)
        .limit(1)
        .returns<AlbumPage[]>();
      const refRow = refRows?.[0];
      if (refRow) {
        resolvedCustomCodes = refRow.sticker_codes ?? [];
        resolvedCustomLabel = refRow.custom_label;
        const refImg = await downloadAndCompress(
          supabase,
          "album-pages",
          refRow.storage_path,
          log,
        );
        if (refImg.ok) {
          references.push({
            b64: refImg.b64,
            mediaType: refImg.mediaType,
            label: `Hoja vacía (${refRow.custom_label ?? "custom"})`,
          });
        }
      }
    } else if (workingContext.kind === "team" && workingContext.teamCode) {
      const { data: refRows } = await supabase
        .from("album_pages")
        .select("*")
        .eq("kind", "team")
        .eq("team_code", workingContext.teamCode)
        .returns<AlbumPage[]>();
      const sorted = (refRows ?? []).sort(
        (a, b) => (a.team_sheet ?? 0) - (b.team_sheet ?? 0),
      );
      for (const row of sorted) {
        const sheet =
          row.team_sheet === 1 || row.team_sheet === 2 ? row.team_sheet : null;
        const refImg = await downloadAndCompress(
          supabase,
          "album-pages",
          row.storage_path,
          log,
        );
        if (refImg.ok) {
          references.push({
            b64: refImg.b64,
            mediaType: refImg.mediaType,
            label: sheet
              ? `${workingContext.teamCode} hoja ${sheet} vacía`
              : `${workingContext.teamCode} vacía`,
            teamSheet: sheet ?? undefined,
          });
        }
      }
      log("team refs loaded", {
        count: references.length,
        sheets: references.map((r) => r.teamSheet),
      });
    } else if (
      workingContext.kind === "coca_cola" ||
      workingContext.kind === "fwc" ||
      workingContext.kind === "intro"
    ) {
      const { data: refRows } = await supabase
        .from("album_pages")
        .select("*")
        .eq("kind", workingContext.kind)
        .limit(1)
        .returns<AlbumPage[]>();
      const refRow = refRows?.[0];
      if (refRow) {
        const refImg = await downloadAndCompress(
          supabase,
          "album-pages",
          refRow.storage_path,
          log,
        );
        if (refImg.ok) {
          references.push({
            b64: refImg.b64,
            mediaType: refImg.mediaType,
            label: `${refRow.kind} vacía`,
          });
        }
      }
    }
    if (references.length === 0 && workingContext.kind !== "auto") {
      log("no reference page configured for this context");
    }

    let detectionCtx: ScanContext = workingContext;
    if (
      workingContext.kind === "team" &&
      workingContext.teamCode &&
      references.length >= 1
    ) {
      if (references.length >= 2) {
        detectionCtx = {
          kind: "team",
          teamCode: workingContext.teamCode,
        };
      } else {
        const sh = references[0].teamSheet;
        if (sh)
          detectionCtx = {
            kind: "team",
            teamCode: workingContext.teamCode,
            teamSheet: sh,
          };
      }
    }
    const enrichedCtx: ScanContext =
      detectionCtx.kind === "custom" && resolvedCustomCodes
        ? {
            ...detectionCtx,
            customCodes: resolvedCustomCodes,
            customLabel:
              detectionCtx.customLabel ?? resolvedCustomLabel ?? undefined,
          }
        : detectionCtx;
    const candidates = stickersForContext(enrichedCtx);
    const validCodes = candidates.map((s) => s.code);
    log("context candidates", {
      desc: describeContext(enrichedCtx),
      count: validCodes.length,
      refsCount: references.length,
    });

    const { systemPrompt, userPrompt } = buildPrompt(
      enrichedCtx,
      candidates,
      references,
    );

    log("calling Anthropic for detection", {
      model,
      refs: references.length,
    });

    const messageContent: Anthropic.Messages.ContentBlockParam[] = [];
    references.forEach((ref, i) => {
      messageContent.push({
        type: "text",
        text: `IMAGEN ${i + 1} (${ref.label}):`,
      });
      messageContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: ref.mediaType,
          data: ref.b64,
        },
      });
    });
    messageContent.push({
      type: "text",
      text: `IMAGEN ${references.length + 1} (foto del usuario):`,
    });
    messageContent.push({
      type: "image",
      source: {
        type: "base64",
        media_type: userImage.mediaType,
        data: userImage.b64,
      },
    });
    messageContent.push({ type: "text", text: userPrompt });

    const startedAt = Date.now();
    const msg = await callWithRetry(
      () =>
        client.messages.create({
          model,
          max_tokens: 2048,
          system: systemPrompt,
          messages: [{ role: "user", content: messageContent }],
        }),
      log,
      "detect",
    );
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

    const parsedRes = parseDetected(text);
    let detected = parsedRes.detected;
    const detectedSheet = parsedRes.sheet;
    const beforeFilter = detected.length;

    let finalCtx: ScanContext = enrichedCtx;
    if (
      enrichedCtx.kind === "team" &&
      enrichedCtx.teamCode &&
      !enrichedCtx.teamSheet &&
      (detectedSheet === 1 || detectedSheet === 2)
    ) {
      finalCtx = {
        kind: "team",
        teamCode: enrichedCtx.teamCode,
        teamSheet: detectedSheet,
      };
      const sheetStickers = splitTeamSheet(
        stickersOfTeam(enrichedCtx.teamCode),
        detectedSheet,
      );
      const sheetCodes = new Set(sheetStickers.map((s) => s.code));
      detected = detected.filter((c) => sheetCodes.has(c));
    } else if (enrichedCtx.kind !== "auto" && validCodes.length > 0) {
      const valid = new Set(validCodes);
      detected = detected.filter((c) => valid.has(c));
    } else {
      detected = detected.filter((c) => isValidCode(c));
    }

    log("parsed", {
      total_in_raw: beforeFilter,
      detected_sheet: detectedSheet,
      after_context_filter: detected.length,
      detected,
    });

    await supabase
      .from("scans")
      .update({
        detected_codes: detected,
        status: "done",
      })
      .eq("id", scanId);

    return NextResponse.json({
      reqId,
      detected,
      context: finalCtx,
      contextDescription: describeContext(finalCtx),
      candidatesCount: validCodes.length,
      usedReference: references.length > 0,
      referencesCount: references.length,
      detectedSheet,
      autoIdentified,
      raw: text,
      durationMs,
      usage: msg.usage,
      model,
      scansRemaining: remaining - 1,
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
  customMaxSide?: number,
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
    const meta = await sharp(original, { failOn: "none" }).rotate().metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    const maxSide = Math.max(w, h);
    let targetSide = customMaxSide ?? MAX_SIDE_PX;

    let quality = 85;
    let out: Buffer | null = null;
    let lastWH = { width: w, height: h };

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
        out = buf;
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
  references: { label: string; teamSheet?: 1 | 2 }[],
): { systemPrompt: string; userPrompt: string } {
  if (ctx.kind === "auto" || candidates.length === 0) {
    return {
      systemPrompt: `Sos un sistema OCR experto en álbumes Panini "FIFA World Cup 2026" (994 stickers identificados por CÓDIGO).
Devolvés SOLO un JSON: { "detected": ["<codigo>", ...], "notes": "..." }.

Códigos posibles:
- Selecciones: <CODE>1 a <CODE>20 (ej: ARG1, BRA13, COL7). Códigos válidos de selección: ${TEAMS.map(
        (t) => t.code,
      ).join(", ")}.
- Coca-Cola: CC1..CC14.
- FIFA World Cup specials: FWC1..FWC19.
- Portada: "00".

Reglas:
- "detected" lista los CÓDIGOS de las figuritas PEGADAS (visibles encima del slot del álbum).
- Ignorá las casillas vacías (silueta o slot sin pegatina).
- Cada figurita tiene su código impreso pequeño (ej "ARG3", "FWC7", "CC2"). Usalo si es legible.
- No inventes. Si dudás, omitilo.
- Sin texto antes o después del JSON.`,
      userPrompt:
        "Detectá las figuritas pegadas en esta página del álbum. Devolvé SOLO el JSON con CÓDIGOS.",
    };
  }

  const desc = describeContext(ctx);
  const codes = candidates.map((s) => s.code);
  const minCode = codes[0];
  const maxCode = codes[codes.length - 1];
  const list = candidates
    .map((s) => `  ${s.code}: ${s.name}${s.role ? ` (${s.role})` : ""}`)
    .join("\n");

  const hasDualSheets =
    ctx.kind === "team" &&
    references.length >= 2 &&
    references.some((r) => r.teamSheet === 1) &&
    references.some((r) => r.teamSheet === 2);

  if (hasDualSheets) {
    const sheet1 = candidates.filter(
      (s) => s.teamNumber && s.teamNumber >= 1 && s.teamNumber <= 10,
    );
    const sheet2 = candidates.filter(
      (s) => s.teamNumber && s.teamNumber >= 11 && s.teamNumber <= 20,
    );
    const list1 = sheet1
      .map((s) => `  ${s.code}: ${s.name}${s.role ? ` (${s.role})` : ""}`)
      .join("\n");
    const list2 = sheet2
      .map((s) => `  ${s.code}: ${s.name}${s.role ? ` (${s.role})` : ""}`)
      .join("\n");

    const systemPrompt = `Sos un OCR experto en álbumes Panini "FIFA World Cup 2026" trabajando en MODO COMPARACIÓN MÚLTIPLE.

Te paso TRES imágenes:
- IMAGEN 1: HOJA 1 vacía del equipo (${desc.split("·")[0].trim()}). Esta hoja contiene el escudo (<CODE>1) y 9 jugadores (<CODE>2..10).
- IMAGEN 2: HOJA 2 vacía del mismo equipo. Esta hoja contiene 9 jugadores y la foto grupal (<CODE>13).
- IMAGEN 3: la foto del usuario (su álbum real).

Tu tarea es DOBLE:
1) Decidir si la IMAGEN 3 corresponde a la HOJA 1 o la HOJA 2 (la que más se parezca en estructura a esa hoja vacía).
2) Detectar qué stickers están pegados en la IMAGEN 3 y devolver sus CÓDIGOS.

CÓDIGOS DE LA HOJA 1:
${list1}

CÓDIGOS DE LA HOJA 2:
${list2}

REGLAS:
1. Devolvés SOLO un objeto JSON:
   { "sheet": 1|2, "detected": ["<codigo>", ...], "notes": "..." }
2. "sheet" es la hoja que coincide visualmente con la IMAGEN 3.
3. "detected" = códigos UNICAMENTE de la hoja elegida que están PEGADOS en la IMAGEN 3 y no en la hoja vacía correspondiente.
4. Si dudás, omití el código.
5. Sin markdown ni texto fuera del JSON.`;

    const userPrompt = `Compará la IMAGEN 3 (foto del usuario) contra IMAGEN 1 (hoja 1 vacía) e IMAGEN 2 (hoja 2 vacía).
Decime qué hoja es y qué figuritas están pegadas (con sus códigos). Devolvé SOLO el JSON.`;

    return { systemPrompt, userPrompt };
  }

  if (references.length >= 1) {
    const systemPrompt = `Sos un OCR experto en álbumes Panini "FIFA World Cup 2026" trabajando en MODO COMPARACIÓN.

Te paso DOS imágenes:
- IMAGEN 1: la página del álbum VACÍA (referencia).
- IMAGEN 2: la página del álbum del USUARIO (puede tener figuritas pegadas).

Tu tarea: comparar IMAGEN 2 contra IMAGEN 1 y decirme qué slots tienen sticker pegado en la 2 pero están vacíos en la 1.

CONTEXTO DE LA PÁGINA: ${desc}
Rango de códigos válidos: ${minCode} a ${maxCode}.
LISTA EXACTA DE CÓDIGOS POSIBLES:
${list}

REGLAS:
1. Devolvés SOLO un objeto JSON: { "detected": ["<codigo>", ...], "notes": "..." }.
2. "detected" = códigos de la lista de arriba que están PEGADOS en IMAGEN 2 y no en IMAGEN 1.
3. NO incluyas slots que se ven igual en ambas imágenes.
4. Si dudás, omití el código.
5. Sin texto antes/después del JSON.`;

    const userPrompt = `Compará las dos imágenes y devolveme qué figuritas (códigos) están pegadas en la del usuario.
Esta página es: ${desc}.
Devolvé SOLO el JSON.`;

    return { systemPrompt, userPrompt };
  }

  const systemPrompt = `Sos un OCR experto en álbumes Panini "FIFA World Cup 2026".

CONTEXTO DE LA FOTO:
${desc}
Códigos válidos para esta página: ${minCode} a ${maxCode}.

LISTA EXACTA DE CÓDIGOS POSIBLES:
${list}

REGLAS:
1. Devolvés SOLO un JSON: { "detected": ["<codigo>", ...], "notes": "..." }.
2. "detected" lista UNICAMENTE códigos de la lista de arriba.
3. Una figurita está "pegada" cuando hay una pegatina visible que tapa el slot. NO si solo se ve la silueta y código impresos por el álbum.
4. Cuando dudes, omití el código.
5. NO inventes códigos fuera de la lista.
6. Sin texto antes/después del JSON.`;

  const userPrompt = `Esta foto corresponde a: ${desc}.
Devolveme qué figuritas (códigos) están pegadas. Devolvé SOLO el JSON.`;

  return { systemPrompt, userPrompt };
}

function parseDetected(text: string): { detected: string[]; sheet?: 1 | 2 } {
  const tryJson = (raw: string) => {
    try {
      const p = JSON.parse(raw);
      if (p && typeof p === "object") return p;
    } catch {}
    return null;
  };
  let parsed = tryJson(text);
  if (!parsed) {
    const m = text.match(/\{[\s\S]*"detected"[\s\S]*\}/);
    if (m) parsed = tryJson(m[0]);
  }
  if (parsed && Array.isArray(parsed.detected)) {
    const sheet =
      parsed.sheet === 1 || parsed.sheet === 2 ? parsed.sheet : undefined;
    return { detected: cleanCodes(parsed.detected), sheet };
  }

  // Fallback: extraer códigos del texto plano.
  const tokens = Array.from(
    text.matchAll(/\b(00|FWC\d{1,2}|CC\d{1,2}|[A-Z]{2,3}\d{1,2})\b/g),
  ).map((m) => m[1]);
  return { detected: cleanCodes(tokens) };
}

function cleanCodes(arr: unknown[]): string[] {
  const out = new Set<string>();
  for (const v of arr) {
    if (typeof v !== "string" && typeof v !== "number") continue;
    const parsed = parseStickerCode(String(v));
    if (parsed) out.add(parsed.code);
  }
  return Array.from(out).sort();
}

function parseIdentify(
  text: string,
): { kind: string; teamCode?: string; teamSheet?: number; reason?: string } | null {
  const tryParse = (raw: string) => {
    try {
      const j = JSON.parse(raw);
      if (j && typeof j === "object") return j;
    } catch {}
    return null;
  };
  let parsed = tryParse(text);
  if (!parsed) {
    const m = text.match(/\{[\s\S]*"kind"[\s\S]*\}/);
    if (m) parsed = tryParse(m[0]);
  }
  if (!parsed) return null;
  const kind = String(parsed.kind ?? "").toLowerCase();
  if (!["team", "coca_cola", "fwc", "intro", "unknown"].includes(kind))
    return null;
  return {
    kind,
    teamCode:
      typeof parsed.teamCode === "string"
        ? parsed.teamCode.toUpperCase()
        : undefined,
    teamSheet:
      parsed.teamSheet === 1 || parsed.teamSheet === 2
        ? parsed.teamSheet
        : undefined,
    reason: typeof parsed.reason === "string" ? parsed.reason : undefined,
  };
}

async function callWithRetry<T>(
  fn: () => Promise<T>,
  log: (...args: unknown[]) => void,
  label: string,
): Promise<T> {
  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= RETRY_MAX_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const status = extractStatus(e);
      const retryable =
        status === 429 || status === 503 || status === 529 || status === 502;
      if (!retryable || attempt === RETRY_MAX_ATTEMPTS) {
        throw e;
      }
      const retryAfter = extractRetryAfter(e);
      const waitMs = retryAfter
        ? retryAfter * 1000
        : Math.min(2000 * attempt + Math.random() * 500, 12000);
      log(`anthropic ${label} retry`, {
        attempt,
        status,
        waitMs,
        retryAfter,
      });
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("retry exhausted");
}

function extractStatus(e: unknown): number | null {
  if (e && typeof e === "object") {
    const anyE = e as { status?: number; response?: { status?: number } };
    return anyE.status ?? anyE.response?.status ?? null;
  }
  return null;
}

function extractRetryAfter(e: unknown): number | null {
  if (!e || typeof e !== "object") return null;
  const anyE = e as {
    headers?: Record<string, string>;
    response?: { headers?: Record<string, string> | Headers };
  };
  const h =
    anyE.headers ??
    (anyE.response?.headers && typeof anyE.response.headers === "object"
      ? (anyE.response.headers as Record<string, string>)
      : undefined);
  if (!h) return null;
  const v = h["retry-after"] ?? h["Retry-After"];
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}
