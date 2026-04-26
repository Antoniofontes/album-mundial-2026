"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ALBUM, stickersOfTeam, type Sticker } from "@/lib/album";
import { TEAM_BY_CODE, TEAMS } from "@/lib/teams";
import type { Holding, MarkedFriend } from "@/lib/supabase/types";
import { useCollection } from "@/lib/store";
import { ArrowLeft, Check, Search } from "lucide-react";
import clsx from "clsx";

function AsignarInner() {
  const params = useSearchParams();
  const router = useRouter();
  const initialFriend = params.get("friend");
  const teamFilter = params.get("team");

  const [friends, setFriends] = useState<MarkedFriend[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [friendId, setFriendId] = useState<string | null>(initialFriend);
  const [team, setTeam] = useState<string | null>(teamFilter);
  const [q, setQ] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(true);

  const collection = useCollection((s) => s.collection);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const [{ data: f }, { data: h }] = await Promise.all([
        supabase.from("marked_friends").select("*").order("name").returns<MarkedFriend[]>(),
        supabase.from("holdings").select("*").returns<Holding[]>(),
      ]);
      const fList = f ?? [];
      const hList = h ?? [];
      setFriends(fList);
      setHoldings(hList);
      if (!initialFriend && fList.length > 0) setFriendId(fList[0].id);
    })();
  }, [initialFriend]);

  const friendHas = useMemo(() => {
    const set = new Set<string>();
    if (!friendId) return set;
    for (const h of holdings)
      if (h.marked_friend_id === friendId) set.add(h.sticker_code);
    return set;
  }, [holdings, friendId]);

  const visible = useMemo(() => {
    let list: Sticker[] = team ? stickersOfTeam(team) : ALBUM;
    if (onlyMissing) list = list.filter((s) => (collection[s.code] ?? 0) === 0);
    if (q) {
      const ql = q.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(ql) ||
          s.code.toLowerCase().includes(ql) ||
          (s.team ?? "").toLowerCase().includes(ql),
      );
    }
    return list;
  }, [team, q, onlyMissing, collection]);

  async function toggle(stickerCode: string) {
    if (!friendId) {
      alert("Primero agregá o elegí un amigo desde Comunidad.");
      return;
    }
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (friendHas.has(stickerCode)) {
      await supabase
        .from("holdings")
        .delete()
        .eq("owner_id", user.id)
        .eq("marked_friend_id", friendId)
        .eq("sticker_code", stickerCode);
      setHoldings((prev) =>
        prev.filter(
          (h) =>
            !(h.marked_friend_id === friendId && h.sticker_code === stickerCode),
        ),
      );
    } else {
      const { data } = await supabase
        .from("holdings")
        .insert({
          owner_id: user.id,
          marked_friend_id: friendId,
          sticker_code: stickerCode,
          count: 1,
        })
        .select()
        .single();
      if (data) setHoldings((prev) => [...prev, data]);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-4">
      <div className="flex items-center gap-2">
        <button onClick={() => router.back()} className="btn btn-ghost !px-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-black text-xl">Asignar figuritas</h1>
      </div>

      <p className="text-sm text-[color:var(--muted)] mt-1">
        Marcá las figuritas que sabés que tu amigo tiene.
      </p>

      <div className="mt-4 grid gap-2">
        <select
          value={friendId ?? ""}
          onChange={(e) => setFriendId(e.target.value || null)}
        >
          <option value="">Elegí un amigo...</option>
          {friends.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>

        <select value={team ?? ""} onChange={(e) => setTeam(e.target.value || null)}>
          <option value="">Todos los equipos / álbum entero</option>
          {TEAMS.map((t) => (
            <option key={t.code} value={t.code}>
              {t.flag} {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" />
        <input
          placeholder="Buscar..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="!pl-10"
        />
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={onlyMissing}
          onChange={(e) => setOnlyMissing(e.target.checked)}
          className="!w-4 !h-4"
        />
        <span>Sólo mostrar las que me faltan</span>
      </label>

      <div className="text-xs text-[color:var(--muted)] mt-2">
        {visible.length} figuritas · {friendHas.size} marcadas en este amigo
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {visible.map((s) => {
          const has = friendHas.has(s.code);
          const c = collection[s.code] ?? 0;
          return (
            <button
              key={s.code}
              type="button"
              onClick={() => toggle(s.code)}
              className={clsx("sticker", has ? "duplicate" : c > 0 ? "owned" : "missing")}
            >
              <span className="sticker-num">{s.code}</span>
              <span className="sticker-name">{s.name}</span>
              {has && (
                <span className="absolute -top-2 -right-2 bg-white text-[color:var(--gold)] rounded-full w-6 h-6 flex items-center justify-center shadow">
                  <Check className="w-4 h-4" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {visible.length === 0 && (
        <p className="text-center text-sm text-[color:var(--muted)] mt-8">
          No hay figuritas que coincidan con el filtro.
        </p>
      )}
    </div>
  );
}

export default function AsignarPage() {
  return (
    <Suspense fallback={<div className="p-6">Cargando...</div>}>
      <AsignarInner />
    </Suspense>
  );
}
