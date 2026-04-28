"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { parseStickerCodesInput } from "@/lib/trade-offers";
import { X } from "lucide-react";

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
  const [text, setText] = useState(defaultCodesText);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setText(defaultCodesText);
      setNote("");
    }
  }, [open, defaultCodesText]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const codes = parseStickerCodesInput(text);
    if (codes.length === 0) {
      alert("No quedó ningún código válido del álbum. Revisá el texto (ej. ARG12, FWC3…).");
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

  const previewCount = parseStickerCodesInput(text).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
      <form
        onSubmit={(e) => void submit(e)}
        className="bg-[color:var(--card)] border border-[color:var(--card-border)] rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-xl"
      >
        <div className="flex items-start justify-between gap-2 p-4 border-b border-[color:var(--card-border)]">
          <div>
            <h2 className="font-black text-lg">Solicitud de intercambio</h2>
            <p className="text-xs text-[color:var(--muted)] mt-1">
              Para <span className="text-[color:var(--foreground)] font-semibold">{toLabel}</span>. Podés pegar
              la lista que armaste a mano (comas o espacios).
            </p>
          </div>
          <button type="button" className="btn btn-ghost !p-2" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 grid gap-3">
          <label className="text-xs font-semibold text-[color:var(--muted)] uppercase tracking-wide">
            Códigos de figuritas ({previewCount})
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            className="font-mono text-sm min-h-[140px]"
            placeholder="Ej: ARG12 ARG13 MAR5 ..."
          />

          <label className="text-xs font-semibold text-[color:var(--muted)] uppercase tracking-wide">
            Nota (opcional)
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ej: Nos vemos el domingo en..."
          />

          <div className="flex gap-2 pt-2">
            <button type="button" className="btn btn-secondary flex-1" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary flex-1" disabled={busy}>
              {busy ? "Enviando..." : "Enviar solicitud"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
