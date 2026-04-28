"use client";

import { useMemo, useState, useEffect } from "react";
import { ALBUM, stickersOfTeam, type Sticker } from "@/lib/album";
import { TEAMS, TEAM_BY_CODE } from "@/lib/teams";
import { Search, Check } from "lucide-react";
import clsx from "clsx";

const PAGE_SIZE = 72;

type Props = {
  ownerCollection: Record<string, number>;
  ownerName: string;
};

function albumSubset(scope: string | null): Sticker[] {
  if (!scope) return ALBUM;
  switch (scope) {
    case "__intro":
      return ALBUM.filter((s) => s.type === "intro");
    case "__fwc":
      return ALBUM.filter((s) => s.type === "fwc");
    case "__cc":
      return ALBUM.filter((s) => s.type === "coca_cola");
    default:
      return stickersOfTeam(scope);
  }
}

export function GuestStickers({ ownerCollection, ownerName }: Props) {
  const [q, setQ] = useState("");
  const [teamScope, setTeamScope] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    "useful" | "missing" | "dups" | "all"
  >("useful");
  const [shownCount, setShownCount] = useState(PAGE_SIZE);

  const baseAlbum = useMemo(() => albumSubset(teamScope), [teamScope]);

  const visible = useMemo(() => {
    return baseAlbum.filter((s) => {
      const c = ownerCollection[s.code] ?? 0;
      if (filter === "useful" && c <= 0) return false;
      if (filter === "missing" && c > 0) return false;
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
  }, [q, filter, ownerCollection, baseAlbum]);

  useEffect(() => {
    setShownCount(PAGE_SIZE);
  }, [teamScope, filter, q]);

  const searchPlaceholder =
    filter === "missing"
      ? `Buscar entre las que le faltan a ${ownerName}...`
      : filter === "dups"
        ? `Buscar entre las repetidas de ${ownerName}...`
        : filter === "all"
          ? "Buscar en esta vista..."
          : `Buscar entre las que tiene ${ownerName}...`;

  const scopeHint = !teamScope
    ? "Todo el álbum"
    : teamScope === "__intro"
      ? "Portada"
      : teamScope === "__fwc"
        ? "FWC"
        : teamScope === "__cc"
          ? "Coca-Cola"
          : TEAM_BY_CODE[teamScope]
            ? `${TEAM_BY_CODE[teamScope].flag} ${TEAM_BY_CODE[teamScope].name}`
            : "Sección";

  const slice = visible.slice(0, shownCount);
  const hasMore = visible.length > shownCount;

  return (
    <div>
      <label className="block text-[11px] font-semibold text-[color:var(--muted)] uppercase tracking-wide mb-1">
        País / sección
      </label>
      <select
        value={teamScope ?? ""}
        onChange={(e) => setTeamScope(e.target.value || null)}
        className="w-full"
      >
        <option value="">Todo el álbum</option>
        <optgroup label="Selecciones">
          {TEAMS.map((t) => (
            <option key={t.code} value={t.code}>
              {t.flag} {t.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="Extras">
          <option value="__intro">Portada (00)</option>
          <option value="__fwc">FIFA World Cup (FWC1–FWC19)</option>
          <option value="__cc">Coca-Cola (CC1–CC14)</option>
        </optgroup>
      </select>

      <div className="relative mt-3">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" />
        <input
          placeholder={searchPlaceholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="!pl-10"
        />
      </div>

      <div className="scroll-x flex gap-2 mt-3">
        {(
          [
            ["useful", "Las que tiene"],
            ["missing", "Le faltan"],
            ["dups", "Repetidas"],
            ["all", "Todas"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            type="button"
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
        {visible.length} resultado{visible.length === 1 ? "" : "s"}
        {" · "}
        <span className="text-[color:var(--muted)]/90">{scopeHint}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-2">
        {slice.map((s) => {
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

      {hasMore && (
        <button
          type="button"
          className="btn btn-secondary w-full mt-4 text-sm"
          onClick={() => setShownCount((n) => n + PAGE_SIZE)}
        >
          Mostrar más ({visible.length - slice.length} restantes)
        </button>
      )}
    </div>
  );
}
