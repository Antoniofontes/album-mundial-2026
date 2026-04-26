"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserStats } from "@/lib/supabase/types";
import { Trophy, Medal } from "lucide-react";
import Link from "next/link";
import { ALBUM } from "@/lib/album";

const TOTAL = ALBUM.length;

export default function LeaderboardPage() {
  const [users, setUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("user_stats")
        .select("*")
        .eq("is_public", true)
        .order("owned", { ascending: false })
        .limit(100);
      setUsers(data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="max-w-md mx-auto px-4 pt-6">
      <header>
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Trophy className="w-6 h-6 text-[color:var(--gold)]" /> Top coleccionistas
        </h1>
        <p className="text-sm text-[color:var(--muted)]">
          Ranking público de quién más figuritas tiene.
        </p>
      </header>

      {loading ? (
        <p className="text-center text-sm text-[color:var(--muted)] mt-8">Cargando...</p>
      ) : users.length === 0 ? (
        <p className="text-center text-sm text-[color:var(--muted)] mt-8">
          Todavía nadie. ¡Empezá a marcar tus figuritas para liderar!
        </p>
      ) : (
        <ol className="mt-6 grid gap-2">
          {users.map((u, i) => (
            <li key={u.user_id}>
              <Row user={u} rank={i + 1} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function Row({ user, rank }: { user: UserStats; rank: number }) {
  const pct = Math.round((user.owned / TOTAL) * 100);
  const medalColor =
    rank === 1
      ? "text-[color:var(--gold)]"
      : rank === 2
        ? "text-gray-400"
        : rank === 3
          ? "text-amber-700"
          : "text-[color:var(--muted)]";
  return (
    <Link
      href={`/u/${user.username}`}
      className="card !p-3 flex items-center gap-3 hover:border-[color:var(--primary)]"
    >
      <div className="w-8 text-center font-black flex items-center justify-center">
        {rank <= 3 ? <Medal className={`w-6 h-6 ${medalColor}`} /> : <span>{rank}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate">{user.display_name}</div>
        <div className="text-[11px] text-[color:var(--muted)]">@{user.username}</div>
        <div className="h-1 bg-[color:var(--card-border)] rounded-full overflow-hidden mt-1">
          <div
            className="h-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--gold)]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="text-right">
        <div className="font-black text-lg">{user.owned}</div>
        <div className="text-[10px] text-[color:var(--muted)] -mt-0.5">/{TOTAL}</div>
      </div>
    </Link>
  );
}
