"use client";

import { ALBUM } from "@/lib/album";
import { useCollection } from "@/lib/store";
import { StickerCell } from "@/components/StickerCell";
import { ArrowLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function ListaPage() {
  const router = useRouter();
  const collection = useCollection((s) => s.collection);
  const setCount = useCollection((s) => s.setCount);
  const [filter, setFilter] = useState<"all" | "owned" | "missing" | "dups">("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return ALBUM.filter((s) => {
      const c = collection[s.number] ?? 0;
      if (filter === "owned" && c === 0) return false;
      if (filter === "missing" && c > 0) return false;
      if (filter === "dups" && c < 2) return false;
      if (q) {
        const ql = q.toLowerCase();
        if (
          !s.name.toLowerCase().includes(ql) &&
          !String(s.number).includes(ql) &&
          !(s.team ?? "").toLowerCase().includes(ql)
        )
          return false;
      }
      return true;
    });
  }, [collection, filter, q]);

  return (
    <div className="max-w-md mx-auto px-4 pt-4">
      <div className="flex items-center gap-2">
        <button onClick={() => router.back()} className="btn btn-ghost !px-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-black text-xl">Las 980</h1>
      </div>

      <div className="mt-4 relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" />
        <input
          type="search"
          placeholder="Buscar número, nombre o ARG..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="!pl-10"
        />
      </div>

      <div className="scroll-x flex gap-2 mt-3">
        {(
          [
            ["all", "Todas"],
            ["owned", "Tengo"],
            ["dups", "Repetidas"],
            ["missing", "Faltan"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`chip whitespace-nowrap ${
              filter === k ? "!bg-[color:var(--primary)] text-white !border-transparent" : ""
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="text-xs text-[color:var(--muted)] mt-3">
        {filtered.length} resultados
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {filtered.map((s) => (
          <StickerCell
            key={s.number}
            sticker={s}
            count={collection[s.number] ?? 0}
            onChange={(c) => setCount(s.number, c)}
          />
        ))}
      </div>
    </div>
  );
}
