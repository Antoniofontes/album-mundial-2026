"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCollection } from "@/lib/store";
import { Camera, Upload, Loader2, Check, X } from "lucide-react";
import { ALBUM_BY_NUMBER } from "@/lib/album";

type Phase = "idle" | "uploading" | "scanning" | "result" | "error";

export default function ScanPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [detected, setDetected] = useState<number[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const bulkAdd = useCollection((s) => s.bulkAdd);

  async function handleFile(file: File) {
    setError(null);
    setDetected([]);
    setPhase("uploading");

    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Necesitás estar logueado");
      setPhase("error");
      return;
    }

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("album-scans")
      .upload(path, file, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
    if (upErr) {
      setError("Error subiendo: " + upErr.message);
      setPhase("error");
      return;
    }

    setPhase("scanning");
    const { data: scanRow, error: insErr } = await supabase
      .from("scans")
      .insert({ user_id: user.id, storage_path: path, status: "processing" })
      .select()
      .single();
    if (insErr || !scanRow) {
      setError("Error creando scan");
      setPhase("error");
      return;
    }

    const res = await fetch("/api/scan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scanId: scanRow.id, storagePath: path }),
    });
    if (!res.ok) {
      const t = await res.text();
      setError("La IA no pudo procesar la imagen: " + t);
      setPhase("error");
      return;
    }
    const json = (await res.json()) as { detected: number[] };
    setDetected(json.detected ?? []);
    setPhase("result");
  }

  async function applyDetected() {
    if (detected.length === 0) return;
    await bulkAdd(detected);
    alert(`Se marcaron ${detected.length} figuritas como "tengo"`);
    setPhase("idle");
    setDetected([]);
    setPreviewUrl(null);
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6">
      <header>
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Camera className="w-6 h-6" /> Escanear álbum
        </h1>
        <p className="text-sm text-[color:var(--muted)] mt-1">
          Sacale una foto a una página y la IA detecta qué tenés.
        </p>
      </header>

      {(phase === "idle" || phase === "error") && (
        <div className="card mt-6 text-center !p-6">
          <Upload className="w-12 h-12 mx-auto text-[color:var(--muted)]" />
          <p className="mt-3 text-sm">
            Subí o sacá una foto de tu álbum bien iluminada y plana.
          </p>
          <label className="btn btn-primary mt-4 inline-flex">
            <Camera className="w-4 h-4" />
            Tomar / Elegir foto
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </label>
          {error && (
            <p className="text-sm text-[color:var(--accent)] mt-3">{error}</p>
          )}
        </div>
      )}

      {(phase === "uploading" || phase === "scanning") && (
        <div className="card mt-6 text-center !p-6">
          <Loader2 className="w-10 h-10 mx-auto animate-spin text-[color:var(--primary)]" />
          <p className="mt-3 font-semibold">
            {phase === "uploading" ? "Subiendo foto..." : "La IA está mirando tu álbum..."}
          </p>
          <p className="text-xs text-[color:var(--muted)] mt-1">
            Puede tardar 10-30 segundos.
          </p>
          {previewUrl && (
            <img src={previewUrl} alt="" className="mt-4 rounded-xl max-h-60 mx-auto" />
          )}
        </div>
      )}

      {phase === "result" && (
        <div className="mt-6">
          <div className="card !p-4">
            <h2 className="font-bold">
              {detected.length === 0
                ? "No detecté figuritas"
                : `Detecté ${detected.length} figuritas pegadas`}
            </h2>
            {previewUrl && (
              <img
                src={previewUrl}
                alt=""
                className="mt-3 rounded-xl max-h-48 mx-auto"
              />
            )}

            {detected.length > 0 && (
              <ul className="grid grid-cols-3 gap-2 mt-4">
                {detected.map((n) => {
                  const s = ALBUM_BY_NUMBER[n];
                  return (
                    <li
                      key={n}
                      className="rounded-lg border border-[color:var(--card-border)] p-2 text-center"
                    >
                      <div className="text-lg font-black">{n}</div>
                      <div className="text-[10px] text-[color:var(--muted)] truncate">
                        {s?.name ?? "Desconocida"}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => {
                  setPhase("idle");
                  setPreviewUrl(null);
                  setDetected([]);
                }}
                className="btn btn-secondary"
              >
                <X className="w-4 h-4" /> Cancelar
              </button>
              <button
                onClick={applyDetected}
                disabled={detected.length === 0}
                className="btn btn-primary disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> Marcar como tengo
              </button>
            </div>
          </div>

          <p className="text-xs text-[color:var(--muted)] mt-3 text-center">
            La IA puede equivocarse. Revisá el resultado antes de aplicar.
          </p>
        </div>
      )}
    </div>
  );
}
