"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Profile, TradeOfferRow } from "@/lib/supabase/types";
import { useCollection } from "@/lib/store";
import { ArrowLeft, Check, Inbox, PackageCheck, Send, XCircle } from "lucide-react";

export default function SolicitudesPage() {
  const reloadReservations = useCollection((s) => s.reloadReservations);
  const loadCollection = useCollection((s) => s.load);
  const [uid, setUid] = useState<string | null>(null);
  const [offers, setOffers] = useState<TradeOfferRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadOffers = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUid(null);
      setOffers([]);
      setLoading(false);
      return;
    }
    setUid(user.id);
    const { data, error } = await supabase
      .from("trade_offers")
      .select("*")
      .or(`to_user_id.eq.${user.id},from_user_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(80);
    if (error) {
      console.error(error);
      setOffers([]);
    } else {
      setOffers((data ?? []) as TradeOfferRow[]);
      const ids = new Set<string>();
      for (const o of data ?? []) {
        ids.add(o.from_user_id);
        ids.add(o.to_user_id);
      }
      if (ids.size > 0) {
        const { data: ps } = await supabase
          .from("profiles")
          .select("*")
          .in("id", [...ids]);
        const pmap: Record<string, Profile> = {};
        for (const p of ps ?? []) pmap[p.id] = p as Profile;
        setProfiles(pmap);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadOffers();
  }, [loadOffers]);

  async function accept(id: string) {
    setBusyId(id);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("accept_trade_offer", { p_offer_id: id });
      if (error) {
        alert(error.message);
        return;
      }
      await reloadReservations();
      await loadOffers();
    } finally {
      setBusyId(null);
    }
  }

  async function decline(id: string) {
    setBusyId(id);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("decline_trade_offer", { p_offer_id: id });
      if (error) {
        alert(error.message);
        return;
      }
      await loadOffers();
    } finally {
      setBusyId(null);
    }
  }

  async function cancel(id: string) {
    setBusyId(id);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("cancel_trade_offer", { p_offer_id: id });
      if (error) {
        alert(error.message);
        return;
      }
      await loadOffers();
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelivery(id: string) {
    setBusyId(id);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("confirm_trade_delivery", { p_offer_id: id });
      if (error) {
        alert(error.message);
        return;
      }
      await loadCollection();
      await loadOffers();
    } finally {
      setBusyId(null);
    }
  }

  const incoming = useMemo(
    () =>
      uid ? offers.filter((o) => o.to_user_id === uid && o.status === "pending") : [],
    [offers, uid],
  );

  const outgoing = useMemo(
    () =>
      uid ? offers.filter((o) => o.from_user_id === uid && o.status === "pending") : [],
    [offers, uid],
  );

  const inProgress = useMemo(
    () =>
      uid
        ? offers.filter(
            (o) =>
              o.status === "accepted" &&
              (o.from_user_id === uid || o.to_user_id === uid),
          )
        : [],
    [offers, uid],
  );

  const recent = useMemo(
    () =>
      uid ? offers.filter((o) => o.status !== "pending").slice(0, 15) : [],
    [offers, uid],
  );

  function label(id: string) {
    const p = profiles[id];
    return p ? `${p.display_name} (@${p.username})` : id.slice(0, 8);
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-24">
      <Link
        href="/comunidad"
        className="inline-flex items-center gap-1 text-sm text-[color:var(--muted)]"
      >
        <ArrowLeft className="w-4 h-4" /> Comunidad
      </Link>

      <h1 className="font-black text-2xl mt-3 flex items-center gap-2">
        <Inbox className="w-7 h-7" /> Solicitudes
      </h1>
      <p className="text-sm text-[color:var(--muted)] mt-1">
        Aceptá para reservar las figuritas. Cuando se entreguen, ambos deben confirmar
        para actualizar los álbumes.
      </p>

      {loading ? (
        <p className="text-center text-[color:var(--muted)] mt-10">Cargando...</p>
      ) : !uid ? (
        <p className="card mt-6 text-sm text-center">
          <Link href="/login" className="underline font-semibold">
            Iniciá sesión
          </Link>{" "}
          para ver solicitudes.
        </p>
      ) : (
        <>
          <section className="mt-8">
            <h2 className="text-xs font-bold tracking-widest text-[color:var(--muted)] mb-2">
              TE LLEGARON ({incoming.length})
            </h2>
            {incoming.length === 0 ? (
              <p className="text-sm text-[color:var(--muted)]">Nada pendiente.</p>
            ) : (
              <ul className="grid gap-3">
                {incoming.map((o) => (
                  <li key={o.id} className="card !p-3">
                    <div className="text-sm font-semibold">{label(o.from_user_id)}</div>
                    <div className="text-xs text-[color:var(--muted)] mt-1">
                      Ofrece {o.sticker_codes.length} figuritas
                      {o.note ? ` · ${o.note}` : ""}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <button
                        type="button"
                        className="btn btn-primary inline-flex items-center justify-center gap-2"
                        disabled={busyId === o.id}
                        onClick={() => void accept(o.id)}
                      >
                        <Check className="w-4 h-4" />
                        Aceptar
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary inline-flex items-center justify-center gap-2"
                        disabled={busyId === o.id}
                        onClick={() => void decline(o.id)}
                      >
                        Rechazar
                      </button>
                    </div>
                    <p className="text-[10px] text-[color:var(--muted)] mt-2">
                      Al aceptar, las figuritas quedan reservadas en tu álbum para ese intercambio.
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-8">
            <h2 className="text-xs font-bold tracking-widest text-[color:var(--muted)] mb-2">
              EN CURSO — CONFIRMAR ENTREGA ({inProgress.length})
            </h2>
            {inProgress.length === 0 ? (
              <p className="text-sm text-[color:var(--muted)]">
                No tenés intercambios aceptados pendientes de cierre.
              </p>
            ) : (
              <ul className="grid gap-3">
                {inProgress.map((o) => {
                  const imFrom = o.from_user_id === uid;
                  const peerId = imFrom ? o.to_user_id : o.from_user_id;
                  const offererDone = Boolean(o.from_delivered_at);
                  const recipientDone = Boolean(o.to_delivered_at);
                  const iConfirmed = imFrom ? offererDone : recipientDone;
                  return (
                    <li key={o.id} className="card !p-3">
                      <div className="flex items-start gap-2">
                        <PackageCheck className="w-5 h-5 shrink-0 mt-0.5 opacity-80" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold">
                            {imFrom ? `Para ${label(peerId)}` : `De ${label(peerId)}`}
                          </div>
                          <div className="text-xs text-[color:var(--muted)] mt-1">
                            {o.sticker_codes.length} figuritas
                            {o.note ? ` · ${o.note}` : ""}
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px]">
                            <span
                              className={
                                offererDone
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-[color:var(--muted)]"
                              }
                            >
                              Quien ofrece: {offererDone ? "✓ entregó" : "pendiente"}
                            </span>
                            <span
                              className={
                                recipientDone
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-[color:var(--muted)]"
                              }
                            >
                              Quien recibe: {recipientDone ? "✓ recibió" : "pendiente"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary w-full mt-3 inline-flex items-center justify-center gap-2"
                        disabled={busyId === o.id || iConfirmed}
                        onClick={() => void confirmDelivery(o.id)}
                      >
                        <Check className="w-4 h-4" />
                        {imFrom
                          ? iConfirmed
                            ? "Ya confirmaste la entrega"
                            : "Confirmo que entregué"
                          : iConfirmed
                            ? "Ya confirmaste la recepción"
                            : "Confirmo que recibí"}
                      </button>
                      <p className="text-[10px] text-[color:var(--muted)] mt-2">
                        Cuando ambos confirmen, se suman las figuritas al álbum de quien recibe y se
                        resta una copia a quien ofreció (si tenía).
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="mt-8">
            <h2 className="text-xs font-bold tracking-widest text-[color:var(--muted)] mb-2">
              ENVIASTE ({outgoing.length})
            </h2>
            {outgoing.length === 0 ? (
              <p className="text-sm text-[color:var(--muted)]">Sin envíos pendientes.</p>
            ) : (
              <ul className="grid gap-3">
                {outgoing.map((o) => (
                  <li key={o.id} className="card !p-3 flex justify-between gap-2 items-start">
                    <div>
                      <div className="text-sm font-semibold">Para {label(o.to_user_id)}</div>
                      <div className="text-xs text-[color:var(--muted)] mt-1">
                        {o.sticker_codes.length} figuritas · esperando respuesta
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary !px-2 text-xs shrink-0"
                      disabled={busyId === o.id}
                      onClick={() => void cancel(o.id)}
                      title="Cancelar solicitud"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {recent.length > 0 && (
            <section className="mt-8">
              <h2 className="text-xs font-bold tracking-widest text-[color:var(--muted)] mb-2">
                RECIENTES
              </h2>
              <ul className="text-sm text-[color:var(--muted)] grid gap-2">
                {recent.map((o) => (
                  <li key={o.id} className="flex gap-2 items-center">
                    <Send className="w-4 h-4 shrink-0 opacity-60" />
                    <span>
                      {o.from_user_id === uid ? "Enviaste" : "Recibiste"} ·{" "}
                      {o.sticker_codes.length} ·{" "}
                      <span className="text-[color:var(--foreground)]">
                        {o.status === "completed"
                          ? "Completada"
                          : o.status === "accepted"
                            ? "Aceptada"
                            : o.status === "declined"
                              ? "Rechazada"
                              : "Cancelada"}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
