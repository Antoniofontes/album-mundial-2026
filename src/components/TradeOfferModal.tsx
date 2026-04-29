"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ALBUM, type Sticker } from "@/lib/album";
import {
  parseStickerCodesInput,
  sortStickerCodesByAlbum,
  spareDupesTheyNeed,
} from "@/lib/trade-offers";
import { fetchTheirMissingCodes } from "@/lib/trade-queries";
import { useCollection } from "@/lib/store";
import clsx from "clsx";
import { Check, X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  toUserId: string;
  toLabel: string;
  defaultCodesText: string;
  onSent?: () => void;
};

export function TradeOfferModal({
  open,
  onClose,
  toUserId,
  toLabel,
  defaultCodesText,
  onSent,
}: Props) {
  const collection = useCollection((s) => s.collection);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingMissing, setLoadingMissing] = useState(false);

  const [theirMissing, setTheirMissing] = useState<Set<string> | null>(null);
  const [missingStickers, setMissingStickers] = useState<Sticker[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) {
      setTheirMissing(null);
      setMissingStickers([]);
      setSelected(new Set());
      setNote("");
      return;
    }

    let cancelled = false;
    setLoadingMissing(true);
    void (async () => {
      try {
        const ms = await fetchTheirMissingCodes(toUserId);
        if (cancelled) return;
        setTheirMissing(ms);
        setMissingStickers(ALBUM.filter((s) => ms.has(s.code)));

        const col = useCollection.getState().collection;
        const pref = parseStickerCodesInput(defaultCodesText).filter(
          (c) => ms.has(c) && (col[c] ?? 0) > 1,
        );
        const auto =
          pref.length > 0
            ? pref
            : spareDupesTheyNeed(col, ms);
        setSelected(new Set(auto));
      } finally {
        if (!cancelled) setLoadingMissing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, toUserId, defaultCodesText]);

  /** Si tu colección cargó después de abrir el modal, sugerí selección automática. */
  useEffect(() => {
    if (!open || !theirMissing || loadingMissing) return;
    const col = collection;
    if (Object.keys(col).length === 0) return;
    setSelected((prev) => {
      if (prev.size > 0) return prev;
      return new Set(spareDupesTheyNeed(col, theirMissing));
    });
  }, [collection, open, theirMissing, loadingMissing]);

  const offerableCount = useMemo(() => {
    if (!theirMissing) return 0;
    let n = 0;
    for (const code of theirMissing) {
      if ((collection[code] ?? 0) > 1) n++;
    }
    return n;
  }, [theirMissing, collection]);

  function canOffer(code: string): boolean {
    return (collection[code] ?? 0) > 1;
  }

  function toggle(code: string) {
    if (!theirMissing?.has(code) || !canOffer(code)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function selectAllOfferable() {
    if (!theirMissing) return;
    const next = new Set<string>();
    for (const s of ALBUM) {
      if (!theirMissing.has(s.code)) continue;
      if ((collection[s.code] ?? 0) > 1) next.add(s.code);
    }
    setSelected(next);
  }

  function applyManualText(raw: string) {
    if (!theirMissing) return;
    const col = collection;
    const parsed = parseStickerCodesInput(raw);
    const next = new Set<string>();
    for (const c of parsed) {
      if (!theirMissing.has(c)) continue;
      if ((col[c] ?? 0) <= 1) continue;
      next.add(c);
    }
    setSelected(next);
  }

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const codes = sortStickerCodesByAlbum(selected);
    if (codes.length === 0) {
      alert(
        "Elegí al menos una figurita donde tengas repetida (tocá las tarjetas o «Seleccionar todas las que puedo ofrecer»).",
      );
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("send_trade_offer", {
        p_to_user_id: toUserId,
        p_sticker_codes: codes,
        p_note: note.trim() || null,
      });
      if (error) {
        alert(error.message);
        return;
      }
      onSent?.();
      onClose();
      alert(
        `Solicitud enviada: ${codes.length} figuritas. Cuando ${toLabel} la acepte, se marcarán como reservadas en su álbum.`,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-black/55">
      <form
        onSubmit={(e) => void submit(e)}
        className="bg-[color:var(--card)] border border-[color:var(--card-border)] rounded-2xl w-full max-w-md max-h-[92vh] flex flex-col shadow-xl overflow-hidden"
      >
        <div className="flex items-start justify-between gap-2 p-4 border-b border-[color:var(--card-border)] shrink-0">
          <div>
            <h2 className="font-black text-lg">Solicitud de intercambio</h2>
            <p className="text-xs text-[color:var(--muted)] mt-1">
              Para <span className="text-[color:var(--foreground)] font-semibold">{toLabel}</span>.
              Tocá las figuritas que le faltan y donde vos tenés <strong>repetida</strong>.
            </p>
          </div>
          <button type="button" className="btn btn-ghost !p-2 shrink-0" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3 min-h-0 flex-1 overflow-hidden">
          {loadingMissing ? (
            <p className="text-sm text-[color:var(--muted)] text-center py-6">Cargando lo que le falta…</p>
          ) : missingStickers.length === 0 ? (
            <p className="text-sm text-center py-4">
              No hay figuritas marcadas como que le falten (o ya tiene el álbum completo según los datos).
            </p>
          ) : (
            <>
              <div className="text-[11px] text-[color:var(--muted)] flex flex-wrap gap-x-3 gap-y-1">
                <span>
                  Le faltan <strong>{missingStickers.length}</strong>
                </span>
                <span>
                  Podés ofrecer <strong>{offerableCount}</strong> (tenés repetida)
                </span>
                <span className="text-[color:var(--primary)]">
                  Seleccionadas <strong>{selected.size}</strong>
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-secondary !py-1.5 !px-2 text-xs"
                  onClick={() => selectAllOfferable()}
                >
                  Seleccionar todas las que puedo ofrecer
                </button>
                <button
                  type="button"
                  className="btn btn-ghost !py-1.5 !px-2 text-xs"
                  onClick={() => setSelected(new Set())}
                >
                  Limpiar
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 overflow-y-auto flex-1 min-h-[200px] max-h-[46vh] pr-1">
                {missingStickers.map((s) => {
                  const offered = canOffer(s.code);
                  const on = selected.has(s.code);
                  return (
                    <button
                      key={s.code}
                      type="button"
                      disabled={!offered}
                      onClick={() => toggle(s.code)}
                      title={
                        offered
                          ? on
                            ? "Quitar de la solicitud"
                            : "Agregar a la solicitud"
                          : "No tenés repetida para ofrecer esta"
                      }
                      className={clsx(
                        "sticker text-left transition-opacity relative",
                        !offered && "opacity-35",
                        offered && !on && "duplicate",
                        offered &&
                          on &&
                          "ring-2 ring-[color:var(--primary)] ring-offset-2 ring-offset-[color:var(--card)] duplicate",
                        s.premium && "premium",
                      )}
                    >
                      <span className="sticker-num">{s.code}</span>
                      <span className="sticker-name">{s.name}</span>
                      {!offered && (
                        <span className="absolute bottom-0 left-0 right-0 text-[8px] font-bold text-center bg-black/55 text-[color:var(--muted)] py-px">
                          Sin repetida
                        </span>
                      )}
                      {offered && on && (
                        <span className="absolute -top-2 -right-2 bg-[color:var(--primary)] text-white rounded-full w-6 h-6 flex items-center justify-center shadow">
                          <Check className="w-4 h-4" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <details className="text-xs border-t border-[color:var(--card-border)] pt-3">
                <summary className="cursor-pointer font-semibold text-[color:var(--muted)]">
                  Editar lista como texto (opcional)
                </summary>
                <textarea
                  rows={4}
                  className="font-mono text-xs mt-2 w-full"
                  value={sortStickerCodesByAlbum(selected).join(", ")}
                  onChange={(e) => applyManualText(e.target.value)}
                  placeholder="Los cambios deben ser códigos válidos, repetidas tuyas y que le falten a él/ella."
                />
              </details>
            </>
          )}

          <label className="text-xs font-semibold text-[color:var(--muted)] uppercase tracking-wide">
            Nota (opcional)
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ej: Nos vemos el domingo…"
          />

          <div className="flex gap-2 pt-1 shrink-0">
            <button type="button" className="btn btn-secondary flex-1" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={busy || loadingMissing || missingStickers.length === 0}
            >
              {busy ? "Enviando..." : `Enviar (${selected.size})`}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
