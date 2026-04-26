import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `Eres un sistema OCR especializado en álbumes de figuritas Panini. \
Analiza la foto del álbum Panini "FIFA World Cup 2026" y devuelve EXCLUSIVAMENTE las figuritas que estén PEGADAS (es decir, casillas que tienen un sticker visible encima del lugar reservado del álbum). \
Para cada figurita detectada, devolvé el NÚMERO impreso en la figurita o el número del slot del álbum si éste se ve. \
Los números válidos van del 1 al 980. \
Ignorá las casillas vacías (donde se ve la silueta o el número del álbum sin pegatina). \
Tu respuesta DEBE ser un único objeto JSON válido con la forma: \
{ "detected": [ <numero>, <numero>, ... ], "notes": "observaciones cortas opcionales" }. \
Sin texto antes ni después del JSON. Sin markdown.`;

export async function POST(req: Request) {
  try {
    const { scanId, storagePath } = (await req.json()) as {
      scanId: string;
      storagePath: string;
    };

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY no configurada" },
        { status: 500 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "no auth" }, { status: 401 });

    const { data: file, error: dlErr } = await supabase.storage
      .from("album-scans")
      .download(storagePath);
    if (dlErr || !file) {
      return NextResponse.json(
        { error: "No pude leer la imagen del storage: " + (dlErr?.message ?? "") },
        { status: 500 },
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const b64 = buf.toString("base64");
    const mediaType =
      (file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif") ??
      "image/jpeg";

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const msg = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: b64 },
            },
            {
              type: "text",
              text: "Detectá las figuritas pegadas en esta página del álbum. Devolvé SOLO el JSON.",
            },
          ],
        },
      ],
    });

    const text = msg.content
      .filter((c) => c.type === "text")
      .map((c) => (c as { type: "text"; text: string }).text)
      .join("");

    const detected = parseDetected(text);

    await supabase
      .from("scans")
      .update({
        detected_numbers: detected,
        status: "done",
      })
      .eq("id", scanId);

    return NextResponse.json({ detected, raw: text });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "scan failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function parseDetected(text: string): number[] {
  // 1. Intento JSON directo
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed?.detected)) return cleanNumbers(parsed.detected);
  } catch {}

  // 2. Intento extraer bloque JSON del texto
  const match = text.match(/\{[\s\S]*"detected"[\s\S]*\}/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed?.detected)) return cleanNumbers(parsed.detected);
    } catch {}
  }

  // 3. Fallback: extraer todos los números entre 1-980
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
