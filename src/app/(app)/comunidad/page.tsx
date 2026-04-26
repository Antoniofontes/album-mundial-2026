"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { MarkedFriend, Holding, UserStats } from "@/lib/supabase/types";
import { ALBUM_BY_NUMBER } from "@/lib/album";
import { useCollection } from "@/lib/store";
import { Plus, Search, Users, UserPlus, Trash2 } from "lucide-react";

type FriendStat = {
  id: string;
  name: string;
  source: "marked" | "user";
  hasNumbers: number[];
};

export default function ComunidadPage() {
  const [friends, setFriends] = useState<MarkedFriend[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [otherUsers, setOtherUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [q, setQ] = useState("");

  const collection = useCollection((s) => s.collection);

  async function load() {
    const supabase = createClient();
    const [{ data: f }, { data: h }, { data: u }] = await Promise.all([
      supabase.from("marked_friends").select("*").order("created_at"),
      supabase.from("holdings").select("*"),
      supabase
        .from("user_stats")
        .select("*")
        .eq("is_public", true)
        .order("owned", { ascending: false })
        .limit(50),
    ]);
    setFriends(f ?? []);
    setHoldings(h ?? []);
    setOtherUsers(u ?? []);
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
      const nums = holdings
        .filter((h) => h.marked_friend_id === f.id)
        .map((h) => h.sticker_number);
      out.push({ id: f.id, name: f.name, source: "marked", hasNumbers: nums });
    }
    for (const u of otherUsers) {
      out.push({
        id: u.user_id,
        name: u.display_name + " (@" + u.username + ")",
        source: "user",
        hasNumbers: [],
      });
    }
    return out;
  }, [friends, holdings, otherUsers]);

  const filtered = friendStats.filter((f) =>
    f.name.toLowerCase().includes(q.toLowerCase()),
  );

  const myMissing = useMemo(
    () =>
      Object.keys(ALBUM_BY_NUMBER)
        .map(Number)
        .filter((n) => (collection[n] ?? 0) === 0),
    [collection],
  );

  return (
    <div className="max-w-md mx-auto px-4 pt-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Users className="w-6 h-6" /> Comunidad
          </h1>
          <p className="text-sm text-[color:var(--muted)]">
            Quién tiene qué — para arreglar intercambios
          </p>
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
          placeholder="Buscar amigo..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="!pl-10"
        />
      </div>

      {loading ? (
        <p className="text-sm text-[color:var(--muted)] text-center mt-8">
          Cargando...
        </p>
      ) : friendStats.length === 0 ? (
        <div className="card mt-6 text-center">
          <p className="text-sm">
            Todavía no agregaste a nadie. Tocá el botón <Plus className="inline w-4 h-4" /> arriba para
            empezar a marcar quién tiene cada figurita.
          </p>
        </div>
      ) : (
        <ul className="mt-4 grid gap-2">
          {filtered.map((f) => (
            <li key={`${f.source}-${f.id}`}>
              <FriendCard
                friend={f}
                myMissing={myMissing}
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
  onRemove,
}: {
  friend: FriendStat;
  myMissing: number[];
  onRemove?: () => void;
}) {
  const useful = friend.hasNumbers.filter((n) => myMissing.includes(n));
  return (
    <div className="card !p-3">
      <div className="flex items-center justify-between gap-2">
        <Link
          href={
            friend.source === "marked"
              ? `/comunidad/asignar?friend=${friend.id}`
              : `/u/${friend.name.match(/@([^)]+)/)?.[1]}`
          }
          className="flex-1 min-w-0"
        >
          <div className="font-semibold truncate">{friend.name}</div>
          <div className="text-xs text-[color:var(--muted)] mt-0.5">
            {friend.source === "marked"
              ? `Tiene ${friend.hasNumbers.length} marcadas`
              : "Usuario público"}
            {useful.length > 0 && (
              <span className="ml-2 text-[color:var(--accent)] font-bold">
                · {useful.length} te sirven!
              </span>
            )}
          </div>
        </Link>
        {onRemove && (
          <button
            onClick={onRemove}
            className="btn btn-ghost !px-2 text-[color:var(--muted)]"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
