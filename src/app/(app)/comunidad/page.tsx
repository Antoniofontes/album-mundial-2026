"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { MarkedFriend, Holding } from "@/lib/supabase/types";
import { ALBUM_BY_CODE } from "@/lib/album";
import {
  messageSpareDupes,
  spareDupesBeyondMarkedOwned,
  spareDupesTheyNeed,
} from "@/lib/trade-offers";
import { fetchTheirMissingCodes } from "@/lib/trade-queries";
import { TradeOfferModal } from "@/components/TradeOfferModal";
import { useCollection } from "@/lib/store";
import { ClipboardList, Plus, Search, Send, Users, UserPlus, Trash2 } from "lucide-react";

/** Usuario con perfil público (toda la comunidad intercambiable) */
type PublicCommunityMember = {
  id: string;
  username: string;
  display_name: string;
};

type FriendStat = {
  id: string;
  name: string;
  source: "marked" | "user";
  hasCodes: string[];
  username?: string;
  phone?: string | null;
};

export default function ComunidadPage() {
  const [friends, setFriends] = useState<MarkedFriend[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [communityMembers, setCommunityMembers] = useState<PublicCommunityMember[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [q, setQ] = useState("");
  const [pendingOffersIn, setPendingOffersIn] = useState(0);

  const collection = useCollection((s) => s.collection);

  useEffect(() => {
    void (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setPendingOffersIn(0);
        return;
      }
      const { count, error } = await supabase
        .from("trade_offers")
        .select("*", { count: "exact", head: true })
        .eq("to_user_id", user.id)
        .eq("status", "pending");
      if (!error) setPendingOffersIn(count ?? 0);
    })();
  }, []);

  async function load() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const [{ data: f }, { data: h }] = await Promise.all([
      supabase.from("marked_friends").select("*").order("created_at"),
      supabase.from("holdings").select("*"),
    ]);

    let profilesQuery = supabase
      .from("profiles")
      .select("id, username, display_name")
      .eq("is_public", true)
      .order("display_name", { ascending: true });

    if (user?.id) {
      profilesQuery = profilesQuery.neq("id", user.id);
    }

    const { data: profs, error: profErr } = await profilesQuery;
    if (profErr) console.error(profErr);

    setFriends(f ?? []);
    setHoldings(h ?? []);
    setCommunityMembers((profs ?? []) as PublicCommunityMember[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addFriend(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("marked_friends")
      .insert({
        owner_id: user.id,
        name: name.trim(),
        phone: phone.trim() || null,
      })
      .select()
      .single();
    if (data) {
      setFriends((prev) => [...prev, data]);
      setName("");
      setPhone("");
      setShowAdd(false);
    } else if (error) alert(error.message);
  }

  async function removeFriend(id: string) {
    if (!confirm("¿Eliminar este amigo? Se borran sus marcas también.")) return;
    const supabase = createClient();
    await supabase.from("marked_friends").delete().eq("id", id);
    setFriends((prev) => prev.filter((f) => f.id !== id));
    setHoldings((prev) => prev.filter((h) => h.marked_friend_id !== id));
  }

  const friendStats: FriendStat[] = useMemo(() => {
    const out: FriendStat[] = [];
    for (const f of friends) {
      const codes = holdings
        .filter((h) => h.marked_friend_id === f.id)
        .map((h) => h.sticker_code);
      out.push({
        id: f.id,
        name: f.name,
        source: "marked",
        hasCodes: codes,
        phone: f.phone,
      });
    }
    for (const m of communityMembers) {
      out.push({
        id: m.id,
        name: `${m.display_name} (@${m.username})`,
        source: "user",
        hasCodes: [],
        username: m.username,
      });
    }
    return out;
  }, [friends, holdings, communityMembers]);

  const filtered = friendStats.filter((f) =>
    f.name.toLowerCase().includes(q.toLowerCase()),
  );

  const myMissing = useMemo(
    () =>
      Object.keys(ALBUM_BY_CODE).filter((c) => (collection[c] ?? 0) === 0),
    [collection],
  );

  return (
    <div className="max-w-md mx-auto px-4 pt-6">
      <header className="flex justify-between items-end gap-2">
        <div className="min-w-0">
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Users className="w-6 h-6 shrink-0" /> Comunidad
          </h1>
          <p className="text-sm text-[color:var(--muted)]">
            Quién tiene qué — para arreglar intercambios
          </p>
          <Link
            href="/comunidad/solicitudes"
            className="inline-block mt-2 text-xs font-semibold text-[color:var(--primary)] underline underline-offset-2"
          >
            Solicitudes de intercambio
            {pendingOffersIn > 0 ? ` (${pendingOffersIn} nueva${pendingOffersIn === 1 ? "" : "s"})` : ""}
          </Link>
        </div>
        <button onClick={() => setShowAdd((s) => !s)} className="btn btn-primary !px-3">
          <UserPlus className="w-4 h-4" />
        </button>
      </header>

      {showAdd && (
        <form onSubmit={addFriend} className="card mt-4 grid gap-2">
          <input
            placeholder="Nombre del amigo (ej: Juan, primo de Pablo)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <input
            placeholder="WhatsApp / teléfono (opcional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
          />
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary flex-1">
              Agregar
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowAdd(false)}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="mt-4 relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" />
        <input
          placeholder="Buscar por nombre o @usuario..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="!pl-10"
        />
      </div>
      <p className="text-[11px] text-[color:var(--muted)] mt-2">
        Lista completa de cuentas públicas en la app{communityMembers.length > 0
          ? ` (${communityMembers.length})`
          : ""}
        . Los que agregás a mano sin cuenta aparecen arriba en la lista.
      </p>

      {loading ? (
        <p className="text-sm text-[color:var(--muted)] text-center mt-8">
          Cargando...
        </p>
      ) : friendStats.length === 0 ? (
        <div className="card mt-6 text-center">
          <p className="text-sm">
            No hay perfiles públicos para mostrar o todavía no agregaste amigos sin cuenta. Usá el botón{" "}
            <Plus className="inline w-4 h-4" /> para anotar a alguien que no usa la app.
          </p>
        </div>
      ) : (
        <ul className="mt-4 grid gap-2">
          {filtered.map((f) => (
            <li key={`${f.source}-${f.id}`}>
              <FriendCard
                friend={f}
                myMissing={myMissing}
                myCollection={collection}
                onRemove={f.source === "marked" ? () => removeFriend(f.id) : undefined}
              />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10 text-center">
        <Link
          href="/comunidad/asignar"
          className="btn btn-secondary inline-flex"
        >
          Asignar figuritas a un amigo
        </Link>
      </div>
    </div>
  );
}

function FriendCard({
  friend,
  myMissing,
  myCollection,
  onRemove,
}: {
  friend: FriendStat;
  myMissing: string[];
  myCollection: Record<string, number>;
  onRemove?: () => void;
}) {
  const missingSet = new Set(myMissing);
  const useful = friend.hasCodes.filter((c) => missingSet.has(c));
  const [shareBusy, setShareBusy] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerDefaultText, setOfferDefaultText] = useState("");
  const [offerPrepBusy, setOfferPrepBusy] = useState(false);

  async function shareSpareDupes() {
    setShareBusy(true);
    try {
      let codes: string[];
      if (friend.source === "marked") {
        codes = spareDupesBeyondMarkedOwned(
          myCollection,
          new Set(friend.hasCodes),
        );
      } else {
        const theirMissing = await fetchTheirMissingCodes(friend.id);
        codes = spareDupesTheyNeed(myCollection, theirMissing);
      }

      if (codes.length === 0) {
        alert(
          friend.source === "marked"
            ? "No tenés repetidas para ofrecer fuera de lo que ya marcaste que tiene, o revisá tu álbum."
            : "No tenés repetidas que le falten según su álbum público.",
        );
        return;
      }

      const shortName =
        friend.source === "marked"
          ? friend.name.split(/\s+/)[0] ?? friend.name
          : friend.name.replace(/\s*\(@.+?\)\s*$/, "").trim();
      const msg = messageSpareDupes(codes, shortName);

      await navigator.clipboard.writeText(msg);

      const digits =
        friend.source === "marked" && friend.phone
          ? friend.phone.replace(/\D/g, "")
          : "";
      if (digits.length >= 8) {
        window.open(
          `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`,
          "_blank",
          "noopener,noreferrer",
        );
      } else {
        alert(
          "Listo: el mensaje se copió al portapapeles. Pegalo en WhatsApp o donde quieras.",
        );
      }
    } finally {
      setShareBusy(false);
    }
  }

  async function openTradeOfferModal() {
    if (friend.source !== "user") return;
    setOfferPrepBusy(true);
    try {
      const theirMissing = await fetchTheirMissingCodes(friend.id);
      const codes = spareDupesTheyNeed(myCollection, theirMissing);
      setOfferDefaultText(codes.join(", "));
      setOfferOpen(true);
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo cargar su álbum.");
    } finally {
      setOfferPrepBusy(false);
    }
  }

  const profileHref =
    friend.source === "marked"
      ? `/comunidad/asignar?friend=${friend.id}`
      : friend.username
        ? `/u/${friend.username}`
        : "#";

  return (
    <div className="card !p-3">
      <div className="flex items-start justify-between gap-2">
        <Link href={profileHref} className="flex-1 min-w-0">
          <div className="font-semibold truncate">{friend.name}</div>
          <div className="text-xs text-[color:var(--muted)] mt-0.5">
            {friend.source === "marked"
              ? `Tiene ${friend.hasCodes.length} marcadas`
              : "Usuario público"}
            {useful.length > 0 && (
              <span className="ml-2 text-[color:var(--accent)] font-bold">
                · {useful.length} te sirven!
              </span>
            )}
          </div>
        </Link>
        <div className="flex flex-wrap justify-end gap-1 shrink-0 max-w-[min(100%,220px)]">
          <button
            type="button"
            onClick={() => void shareSpareDupes()}
            disabled={shareBusy}
            className="btn btn-secondary !px-2 !py-1.5 text-xs inline-flex items-center gap-1"
            title="Copiar mensaje con tus repetidas que le pueden servir"
          >
            <Send className="w-4 h-4 shrink-0" />
            Ofrecer
          </button>
          {friend.source === "user" && (
            <button
              type="button"
              onClick={() => void openTradeOfferModal()}
              disabled={offerPrepBusy}
              className="btn btn-primary !px-2 !py-1.5 text-xs inline-flex items-center gap-1"
              title="Enviar solicitud para que pueda marcarlas como reservadas en su álbum"
            >
              <ClipboardList className="w-4 h-4 shrink-0" />
              Solicitud
            </button>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="btn btn-ghost !px-2 text-[color:var(--muted)]"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <p className="text-[10px] text-[color:var(--muted)] mt-2 leading-snug">
        {friend.source === "marked"
          ? "Ofrecer: repetidas tuyas entre las que no marcaste que él tiene."
          : "Ofrecer: WhatsApp. Solicitud: la otra persona acepta o rechaza desde Solicitudes (si acepta, quedan reservadas)."}
      </p>

      {friend.source === "user" && (
        <TradeOfferModal
          open={offerOpen}
          onClose={() => setOfferOpen(false)}
          toUserId={friend.id}
          toLabel={friend.name.replace(/\s*\(@.+?\)\s*$/, "").trim()}
          defaultCodesText={offerDefaultText}
        />
      )}
    </div>
  );
}
