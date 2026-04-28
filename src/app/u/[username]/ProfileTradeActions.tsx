"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TradeOfferModal } from "@/components/TradeOfferModal";
import { useCollection } from "@/lib/store";
import { fetchTheirMissingCodes } from "@/lib/trade-queries";
import { spareDupesTheyNeed } from "@/lib/trade-offers";
import { ClipboardList, Inbox, Users } from "lucide-react";

type Props = {
  targetUserId: string;
  targetDisplayName: string;
};

export function ProfileTradeActions({ targetUserId, targetDisplayName }: Props) {
  const load = useCollection((s) => s.load);
  const collection = useCollection((s) => s.collection);
  const loaded = useCollection((s) => s.loaded);

  useEffect(() => {
    void load();
  }, [load]);
  const [open, setOpen] = useState(false);
  const [defaultText, setDefaultText] = useState("");
  const [prepBusy, setPrepBusy] = useState(false);

  async function openModal() {
    setPrepBusy(true);
    try {
      const missing = await fetchTheirMissingCodes(targetUserId);
      const codes = spareDupesTheyNeed(collection, missing);
      setDefaultText(codes.join(", "));
      setOpen(true);
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo armar la lista.");
    } finally {
      setPrepBusy(false);
    }
  }

  return (
    <>
      <div className="card mt-3 !p-3 bg-[color:var(--primary)]/10 border-[color:var(--primary)]/35">
        <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--muted)] mb-1">
          Intercambios
        </p>
        <p className="text-xs text-[color:var(--muted)] mb-3">
          Enviá una solicitud con las repetidas que podés ofrecerle según este álbum público. La otra
          persona la acepta o rechaza desde la app.
        </p>
        <div className="grid gap-2">
          <button
            type="button"
            className="btn btn-primary w-full inline-flex justify-center items-center gap-2 text-sm"
            disabled={prepBusy || !loaded}
            onClick={() => void openModal()}
          >
            <ClipboardList className="w-4 h-4 shrink-0" />
            {prepBusy ? "Preparando..." : "Solicitud de intercambio"}
          </button>
          <Link
            href="/comunidad/solicitudes"
            className="btn btn-secondary w-full inline-flex justify-center items-center gap-2 text-sm"
          >
            <Inbox className="w-4 h-4 shrink-0" />
            Mis solicitudes
          </Link>
          <Link
            href="/comunidad"
            className="btn btn-ghost w-full inline-flex justify-center items-center gap-2 text-sm !py-2"
          >
            <Users className="w-4 h-4 shrink-0" />
            Comunidad
          </Link>
        </div>
      </div>

      <TradeOfferModal
        open={open}
        onClose={() => setOpen(false)}
        toUserId={targetUserId}
        toLabel={targetDisplayName}
        defaultCodesText={defaultText}
      />
    </>
  );
}
