"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TEAMS } from "@/lib/teams";
import {
  ArrowLeft,
  CheckCircle2,
  Library,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { stickersForContext, describeContext } from "@/lib/album";
import type { AlbumPage, AlbumPageKind } from "@/lib/supabase/types";

type Slot = {
  id: string;
  kind: AlbumPageKind;
  teamCode?: string;
  teamSheet?: 1 | 2;
  label: string;
  stickerNumbers: number[];
  existing?: AlbumPage;
};

export default function ReferenciasPage() {
  const [pages, setPages] = useState<AlbumPage[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingSlot, setPendingSlot] = useState<Slot | null>(null);

  const slots: Slot[] = useMemo(() => {
    const out: Slot[] = [];
    out.push({
      id: "intro",
      kind: "intro",
      label: "Intro / FIFA / Mascotas",
      stickerNumbers: stickersForContext({ kind: "intro" }).map(
        (s) => s.number,
      ),
    });
    for (const t of TEAMS) {
      for (const sheet of [1, 2] as const) {
        out.push({
          id: `team-${t.code}-${sheet}`,
          kind: "team",
          teamCode: t.code,
          teamSheet: sheet,
          label: `${t.flag} ${t.name} · hoja ${sheet}`,
          stickerNumbers: stickersForContext({
            kind: "team",
            teamCode: t.code,
            teamSheet: sheet,
          }).map((s) => s.number),
        });
      }
    }
    out.push({
      id: "stadium",
      kind: "stadium",
      label: "Estadios / Sedes 2026",
      stickerNumbers: stickersForContext({ kind: "stadium" }).map(
        (s) => s.number,
      ),
    });
    out.push({
      id: "coca_cola",
      kind: "coca_cola",
      label: "Especiales Coca-Cola",
      stickerNumbers: stickersForContext({ kind: "coca_cola" }).map(
        (s) => s.number,
      ),
    });
    out.push({
      id: "legend",
      kind: "legend",
      label: "Leyendas del Mundial",
      stickerNumbers: stickersForContext({ kind: "legend" }).map(
        (s) => s.number,
      ),
    });
    out.push({
      id: "special",
      kind: "special",
      label: "Brillantes / Foil finales",
      stickerNumbers: stickersForContext({ kind: "special" }).map(
        (s) => s.number,
      ),
    });
    return out;
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const supabase = createClient();
      const { data, error: dbErr } = await supabase
        .from("album_pages")
        .select("*")
        .order("created_at", { ascending: false })
        .returns<AlbumPage[]>();
      if (!mounted) return;
      if (dbErr) {
        setError("Error cargando: " + dbErr.message);
      } else {
        setPages(data ?? []);
        const map: Record<string, string> = {};
        await Promise.all(
          (data ?? []).map(async (p) => {
            const { data: s } = await supabase.storage
              .from("album-pages")
              .createSignedUrl(p.storage_path, 60 * 60);
            if (s?.signedUrl) map[p.id] = s.signedUrl;
          }),
        );
        if (mounted) setSignedUrls(map);
      }
      setLoaded(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const slotsWithExisting: Slot[] = useMemo(() => {
    return slots.map((slot) => {
      const existing = pages.find(
        (p) =>
          p.kind === slot.kind &&
          (p.team_code ?? null) === (slot.teamCode ?? null) &&
          (p.team_sheet ?? null) === (slot.teamSheet ?? null),
      );
      return { ...slot, existing };
    });
  }, [slots, pages]);

  const totalSlots = slotsWithExisting.length;
  const filledSlots = slotsWithExisting.filter((s) => s.existing).length;

  function chooseFile(slot: Slot) {
    setPendingSlot(slot);
    fileInputRef.current?.click();
  }

  async function onFileChosen(file: File) {
    if (!pendingSlot) return;
    const slot = pendingSlot;
    setPendingSlot(null);
    setBusy(slot.id);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Necesitás estar logueado");
        setBusy(null);
        return;
      }

      const ext = file.name.split(".").pop() || "jpg";
      const sheetSuffix = slot.teamSheet ? `-h${slot.teamSheet}` : "";
      const path = `${slot.kind}-${slot.teamCode ?? "all"}${sheetSuffix}-${Date.now()}.${ext}`;

      // Si ya existe, eliminamos la foto vieja del storage primero
      if (slot.existing) {
        await supabase.storage
          .from("album-pages")
          .remove([slot.existing.storage_path]);
      }

      const { error: upErr } = await supabase.storage
        .from("album-pages")
        .upload(path, file, {
          contentType: file.type || "image/jpeg",
          upsert: true,
        });
      if (upErr) {
        setError("Subida: " + upErr.message);
        setBusy(null);
        return;
      }

      if (slot.existing) {
        const { error: updErr } = await supabase
          .from("album_pages")
          .update({
            storage_path: path,
            sticker_numbers: slot.stickerNumbers,
            updated_at: new Date().toISOString(),
            uploaded_by: user.id,
          })
          .eq("id", slot.existing.id);
        if (updErr) {
          setError("Update: " + updErr.message);
          setBusy(null);
          return;
        }
      } else {
        const { error: insErr } = await supabase.from("album_pages").insert({
          kind: slot.kind,
          team_code: slot.teamCode ?? null,
          team_sheet: slot.teamSheet ?? null,
          storage_path: path,
          sticker_numbers: slot.stickerNumbers,
          uploaded_by: user.id,
        });
        if (insErr) {
          setError("Insert: " + insErr.message);
          setBusy(null);
          return;
        }
      }

      // Refrescar
      const { data } = await supabase
        .from("album_pages")
        .select("*")
        .order("created_at", { ascending: false })
        .returns<AlbumPage[]>();
      setPages(data ?? []);
      const newRow = (data ?? []).find(
        (p) =>
          p.kind === slot.kind &&
          (p.team_code ?? null) === (slot.teamCode ?? null) &&
          (p.team_sheet ?? null) === (slot.teamSheet ?? null),
      );
      if (newRow) {
        const { data: s } = await supabase.storage
          .from("album-pages")
          .createSignedUrl(newRow.storage_path, 60 * 60);
        if (s?.signedUrl) {
          setSignedUrls((prev) => ({ ...prev, [newRow.id]: s.signedUrl }));
        }
      }
    } finally {
      setBusy(null);
    }
  }

  async function deleteSlot(slot: Slot) {
    if (!slot.existing) return;
    if (!confirm(`Borrar la referencia de "${slot.label}"?`)) return;
    setBusy(slot.id);
    try {
      const supabase = createClient();
      await supabase.storage
        .from("album-pages")
        .remove([slot.existing.storage_path]);
      await supabase.from("album_pages").delete().eq("id", slot.existing.id);
      setPages((prev) => prev.filter((p) => p.id !== slot.existing!.id));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-24">
      <header className="flex items-center gap-3">
        <Link
          href="/scan"
          className="text-[color:var(--muted)]"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Library className="w-6 h-6" /> Referencias
          </h1>
          <p className="text-xs text-[color:var(--muted)]">
            Páginas del álbum vacío. La IA las usa para comparar.
          </p>
        </div>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileChosen(f);
          e.target.value = "";
        }}
      />

      <div className="card mt-4 !p-4">
        <p className="text-sm">
          <b>{filledSlots}</b> de {totalSlots} páginas con referencia subida.
        </p>
        <div className="h-2 bg-[color:var(--card-border)] rounded-full mt-2 overflow-hidden">
          <div
            className="h-full bg-[color:var(--primary)]"
            style={{ width: `${(filledSlots / totalSlots) * 100}%` }}
          />
        </div>
        <p className="text-[11px] text-[color:var(--muted)] mt-2">
          Subí al menos las páginas de las selecciones que vas a escanear más.
          Mientras más subas, más preciso es el reconocimiento.
        </p>
      </div>

      {error && (
        <p className="text-sm text-[color:var(--accent)] mt-3 break-words">
          {error}
        </p>
      )}

      {!loaded && (
        <div className="text-center mt-6">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[color:var(--muted)]" />
        </div>
      )}

      <ul className="mt-4 space-y-2">
        {slotsWithExisting.map((slot) => {
          const url = slot.existing
            ? signedUrls[slot.existing.id]
            : undefined;
          const isBusy = busy === slot.id;
          const ctxLabel = describeContext(
            slot.kind === "team"
              ? {
                  kind: "team",
                  teamCode: slot.teamCode,
                  teamSheet: slot.teamSheet,
                }
              : { kind: slot.kind },
          );
          return (
            <li
              key={slot.id}
              className="card !p-3 flex items-center gap-3"
              title={ctxLabel}
            >
              <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-[color:var(--card-border)] flex items-center justify-center">
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : slot.existing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[color:var(--muted)]" />
                ) : (
                  <Plus className="w-5 h-5 text-[color:var(--muted)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{slot.label}</p>
                <p className="text-[11px] text-[color:var(--muted)] truncate">
                  {slot.stickerNumbers.length} figuritas · #
                  {slot.stickerNumbers[0]}–#
                  {slot.stickerNumbers[slot.stickerNumbers.length - 1]}
                </p>
                {slot.existing && (
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" /> referencia cargada
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  disabled={isBusy}
                  onClick={() => chooseFile(slot)}
                  className="btn btn-primary text-[10px] !px-2 !py-1 disabled:opacity-50"
                >
                  {isBusy ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Upload className="w-3 h-3" />
                  )}
                  {slot.existing ? "Cambiar" : "Subir"}
                </button>
                {slot.existing && (
                  <button
                    disabled={isBusy}
                    onClick={() => deleteSlot(slot)}
                    className="text-[10px] text-[color:var(--muted)] flex items-center gap-1 justify-center"
                  >
                    <Trash2 className="w-3 h-3" /> borrar
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
