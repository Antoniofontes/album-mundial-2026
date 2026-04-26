"use client";

import { useMemo, useState } from "react";
import { ALBUM } from "@/lib/album";
import { Search, Check } from "lucide-react";
import clsx from "clsx";

type Props = {
  ownerCollection: Record<string, number>;
  ownerName: string;
};

export function GuestStickers({ ownerCollection, ownerName }: Props) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"useful" | "owned" | "dups" | "all">(
    "useful",
  );

  const visible = useMemo(() => {
    return ALBUM.filter((s) => {
      const c = ownerCollection[s.code] ?? 0;
      if (filter === "owned" && c === 0) return false;
      if (filter === "useful" && c <= 0) return false;
      if (filter === "dups" && c < 2) return false;
      if (q) {
        const ql = q.toLowerCase();
        if (
          !s.name.toLowerCase().includes(ql) &&
          !s.code.toLowerCase().includes(ql) &&
          !(s.team ?? "").toLowerCase().includes(ql)
        )
          return false;
      }
      return true;
    });
  }, [q, filter, ownerCollection]);

  return (
    <div>
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" />
        <input
          placeholder={`Buscar entre las que tiene ${ownerName}...`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="!pl-10"
        />
      </div>

      <div className="scroll-x flex gap-2 mt-3">
        {(
          [
            ["useful", "Las que tiene"],
            ["dups", "Repetidas"],
            ["all", "Todas"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`chip whitespace-nowrap ${
              filter === k
                ? "!bg-[color:var(--primary)] text-white !border-transparent"
                : ""
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="text-xs text-[color:var(--muted)] mt-2">
        {visible.length} resultados
      </div>

      <div className="grid grid-cols-3 gap-2 mt-2">
        {visible.slice(0, 60).map((s) => {
          const c = ownerCollection[s.code] ?? 0;
          return (
            <div
              key={s.code}
              className={clsx(
                "sticker",
                c === 0 ? "missing" : c === 1 ? "owned" : "duplicate",
              )}
            >
              <span className="sticker-num">{s.code}</span>
              <span className="sticker-name">{s.name}</span>
              {c > 1 && (
                <span className="absolute -top-2 -right-2 bg-[color:var(--accent)] text-white text-[10px] font-bold rounded-full w-6 h-6 flex items-center justify-center shadow">
                  ×{c}
                </span>
              )}
              {c === 1 && (
                <span className="absolute -top-2 -right-2 bg-white text-[color:var(--primary)] rounded-full w-6 h-6 flex items-center justify-center shadow">
                  <Check className="w-4 h-4" />
                </span>
              )}
            </div>
          );
        })}
      </div>
      {visible.length > 60 && (
        <p className="text-xs text-[color:var(--muted)] mt-3 text-center">
          Mostrando 60 de {visible.length}. Filtrá por equipo para ver más.
        </p>
      )}
    </div>
  );
}
