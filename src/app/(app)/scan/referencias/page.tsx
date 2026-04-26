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
  X,
} from "lucide-react";
import { ALBUM, stickersForContext, describeContext } from "@/lib/album";
import type { AlbumPage, AlbumPageKind } from "@/lib/supabase/types";
import { compressForUpload } from "@/lib/compressImage";

type Slot = {
  id: string;
  kind: AlbumPageKind;
  teamCode?: string;
  teamSheet?: 1 | 2;
  customLabel?: string;
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
  const [pendingSlot, setPendingSlot] = useState<Slot | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const presetSlots: Slot[] = useMemo(() => {
    const out: Slot[] = [];
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
      id: "coca_cola",
      kind: "coca_cola",
      label: "Coca-Cola (12 cromos)",
      stickerNumbers: stickersForContext({ kind: "coca_cola" }).map(
        (s) => s.number,
      ),
    });
    out.push({
      id: "special",
      kind: "special",
      label: "Especiales / Portada (8 cromos)",
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

  const presetSlotsWithExisting: Slot[] = useMemo(() => {
    return presetSlots.map((slot) => {
      const existing = pages.find(
        (p) =>
          p.kind === slot.kind &&
          (p.team_code ?? null) === (slot.teamCode ?? null) &&
          (p.team_sheet ?? null) === (slot.teamSheet ?? null),
      );
      return { ...slot, existing };
    });
  }, [presetSlots, pages]);

  const customPages = useMemo(
    () => pages.filter((p) => p.kind === "custom"),
    [pages],
  );

  const totalSlots = presetSlotsWithExisting.length;
  const filledSlots = presetSlotsWithExisting.filter((s) => s.existing).length;

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

      let toUpload: File;
      try {
        const r = await compressForUpload(file, { maxSide: 1920, quality: 0.85 });
        toUpload = r.file;
      } catch (e) {
        setError(
          "No pude leer la imagen: " +
            (e instanceof Error ? e.message : "error"),
        );
        setBusy(null);
        return;
      }

      const sheetSuffix = slot.teamSheet ? `-h${slot.teamSheet}` : "";
      const path = `${slot.kind}-${slot.teamCode ?? "all"}${sheetSuffix}-${Date.now()}.jpg`;

      if (slot.existing) {
        await supabase.storage
          .from("album-pages")
          .remove([slot.existing.storage_path]);
      }

      const { error: upErr } = await supabase.storage
        .from("album-pages")
        .upload(path, toUpload, {
          contentType: "image/jpeg",
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
          custom_label: slot.customLabel ?? null,
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

      const { data } = await supabase
        .from("album_pages")
        .select("*")
        .order("created_at", { ascending: false })
        .returns<AlbumPage[]>();
      setPages(data ?? []);

      const newRow = (data ?? []).find((p) => p.storage_path === path);
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

  async function deletePage(p: AlbumPage) {
    if (
      !confirm(
        `Borrar referencia "${p.custom_label ?? p.team_code ?? p.kind}"?`,
      )
    )
      return;
    setBusy(p.id);
    try {
      const supabase = createClient();
      await supabase.storage.from("album-pages").remove([p.storage_path]);
      await supabase.from("album_pages").delete().eq("id", p.id);
      setPages((prev) => prev.filter((x) => x.id !== p.id));
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
          <b>{filledSlots}</b> de {totalSlots} hojas con referencia.{" "}
          <b>{customPages.length}</b> hojas custom creadas.
        </p>
        <div className="h-2 bg-[color:var(--card-border)] rounded-full mt-2 overflow-hidden">
          <div
            className="h-full bg-[color:var(--primary)]"
            style={{ width: `${(filledSlots / totalSlots) * 100}%` }}
          />
        </div>
        <p className="text-[11px] text-[color:var(--muted)] mt-2">
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

      {/* Custom pages */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold">Hojas custom</h2>
          <button
            onClick={() => setShowCustomForm(true)}
            className="btn btn-primary text-xs !px-3 !py-1.5"
          >
            <Plus className="w-3 h-3" /> Nueva
          </button>
        </div>
        <p className="text-[11px] text-[color:var(--muted)] mb-3">
          Para hojas no estándar (portada, mascotas, copa, países sede,
          campeones del mundo, etc.). Vos definís qué cromos van.
        </p>

        {customPages.length === 0 && (
          <div className="text-center text-xs text-[color:var(--muted)] py-4">
            Todavía no creaste ninguna hoja custom.
          </div>
        )}

        <ul className="space-y-2">
          {customPages.map((p) => {
            const url = signedUrls[p.id];
            return (
              <li key={p.id} className="card !p-3 flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-[color:var(--card-border)] flex items-center justify-center">
                  {url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Loader2 className="w-4 h-4 animate-spin text-[color:var(--muted)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {p.custom_label ?? "Hoja sin nombre"}
                  </p>
                  <p className="text-[11px] text-[color:var(--muted)] truncate">
                    {p.sticker_numbers.length} cromos:{" "}
                    {p.sticker_numbers.slice(0, 8).join(", ")}
                    {p.sticker_numbers.length > 8 ? "..." : ""}
                  </p>
                </div>
                <button
                  onClick={() => deletePage(p)}
                  disabled={busy === p.id}
                  className="text-[color:var(--accent)]"
                >
                  {busy === p.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Preset slots */}
      <section className="mt-6">
        <h2 className="text-sm font-bold mb-2">Hojas estándar</h2>
        <p className="text-[11px] text-[color:var(--muted)] mb-3">
          96 hojas de equipos (2 por país) + 2 secciones especiales.
        </p>
        <ul className="space-y-2">
          {presetSlotsWithExisting.map((slot) => {
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
                    /* eslint-disable-next-line @next/next/no-img-element */
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
                  <p className="text-sm font-semibold truncate">
                    {slot.label}
                  </p>
                  <p className="text-[11px] text-[color:var(--muted)] truncate">
                    {slot.stickerNumbers.length} cromos · #
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
                      onClick={() => deletePage(slot.existing!)}
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
      </section>

      {showCustomForm && (
        <CustomPageModal
          onClose={() => setShowCustomForm(false)}
          onSaved={(p) => {
            setShowCustomForm(false);
            setPages((prev) => [p, ...prev]);
            (async () => {
              const supabase = createClient();
              const { data: s } = await supabase.storage
                .from("album-pages")
                .createSignedUrl(p.storage_path, 60 * 60);
              if (s?.signedUrl) {
                setSignedUrls((prev) => ({ ...prev, [p.id]: s.signedUrl }));
              }
            })();
          }}
        />
      )}
    </div>
  );
}

function CustomPageModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (p: AlbumPage) => void;
}) {
  const [label, setLabel] = useState("");
  const [numbersText, setNumbersText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const parsedNumbers = useMemo(() => parseRanges(numbersText), [numbersText]);

  function handleFile(f: File) {
    setFile(f);
    const r = new FileReader();
    r.onload = (e) => setFilePreview(e.target?.result as string);
    r.readAsDataURL(f);
  }

  async function handleSubmit() {
    setErr(null);
    if (!label.trim()) {
      setErr("Poné un nombre.");
      return;
    }
    if (parsedNumbers.length === 0) {
      setErr(
        "Tenés que poner al menos un número. Ej: 1, 2, 3 o 1-5 o 1, 5-10",
      );
      return;
    }
    if (!file) {
      setErr("Subí una foto del álbum vacío de esta hoja.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setErr("No estás logueado.");
        return;
      }

      let toUpload: File;
      try {
        const r = await compressForUpload(file, { maxSide: 1920, quality: 0.85 });
        toUpload = r.file;
      } catch (e) {
        setErr(
          "No pude leer la imagen: " +
            (e instanceof Error ? e.message : "error"),
        );
        return;
      }

      const path = `custom-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("album-pages")
        .upload(path, toUpload, {
          contentType: "image/jpeg",
          upsert: false,
        });
      if (upErr) {
        setErr("Subida: " + upErr.message);
        return;
      }

      const { data: row, error: insErr } = await supabase
        .from("album_pages")
        .insert({
          kind: "custom",
          custom_label: label.trim(),
          sticker_numbers: parsedNumbers,
          storage_path: path,
          uploaded_by: user.id,
        })
        .select()
        .single<AlbumPage>();
      if (insErr || !row) {
        setErr("DB: " + (insErr?.message ?? "no row"));
        return;
      }

      onSaved(row);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-3">
      <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto !p-0">
        <div className="flex items-center justify-between p-4 border-b border-[color:var(--card-border)] sticky top-0 bg-[color:var(--card-bg)] z-10">
          <h3 className="font-bold">Nueva hoja custom</h3>
          <button onClick={onClose} className="text-[color:var(--muted)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="text-xs font-semibold">Nombre</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ej: Portada / 00, Copa y pelota, Países sede"
              className="w-full mt-1 rounded-lg bg-[color:var(--card-bg)] border border-[color:var(--card-border)] px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold">
              Números de figuritas en esta hoja
            </label>
            <input
              value={numbersText}
              onChange={(e) => setNumbersText(e.target.value)}
              placeholder="Ej: 973, 974, 975 ó 973-980 ó 1, 5-10"
              className="w-full mt-1 rounded-lg bg-[color:var(--card-bg)] border border-[color:var(--card-border)] px-3 py-2 text-sm font-mono"
            />
            <p className="text-[11px] text-[color:var(--muted)] mt-1">
              Detectados: {parsedNumbers.length} números (
              {parsedNumbers.slice(0, 12).join(", ")}
              {parsedNumbers.length > 12 ? "..." : ""})
            </p>
            <p className="text-[10px] text-[color:var(--muted)]">
              Cromos especiales válidos: 973–980 (los 8 misceláneos del álbum).
              Si tu álbum tiene la disposición distinta, usá los números reales.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold">
              Foto del álbum vacío
            </label>
            <label className="btn btn-secondary mt-1 w-full cursor-pointer">
              <Upload className="w-4 h-4" />
              {file ? "Cambiar foto" : "Elegir foto"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </label>
            {filePreview && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={filePreview}
                alt=""
                className="mt-2 rounded-lg max-h-40 mx-auto"
              />
            )}
          </div>

          {err && (
            <p className="text-sm text-[color:var(--accent)] break-words">
              {err}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={onClose}
              disabled={submitting}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn btn-primary disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Guardando
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Guardar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Parsea "1, 5-10, 12" => [1, 5, 6, 7, 8, 9, 10, 12] */
function parseRanges(text: string): number[] {
  const set = new Set<number>();
  const parts = text.split(/[,\s]+/).filter(Boolean);
  for (const p of parts) {
    const m = p.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      const a = Number(m[1]);
      const b = Number(m[2]);
      if (Number.isFinite(a) && Number.isFinite(b)) {
        const lo = Math.min(a, b);
        const hi = Math.max(a, b);
        for (let i = lo; i <= hi; i++) {
          if (i >= 1 && i <= 980 && ALBUM[i - 1]) set.add(i);
        }
      }
    } else {
      const n = Number(p);
      if (Number.isFinite(n) && n >= 1 && n <= 980) set.add(n);
    }
  }
  return Array.from(set).sort((a, b) => a - b);
}
