"use client";

import Link from "next/link";
import { TEAMS, GROUPS, teamsByGroup } from "@/lib/teams";
import { ALBUM, stickersOfTeam } from "@/lib/album";
import { useCollection } from "@/lib/store";
import { ChevronRight, Sparkles, BookOpen } from "lucide-react";
import { useMemo } from "react";

export default function AlbumPage() {
  const collection = useCollection((s) => s.collection);
  const loaded = useCollection((s) => s.loaded);

  const stats = useMemo(() => {
    const owned = ALBUM.filter((s) => (collection[s.number] ?? 0) > 0).length;
    const dups = ALBUM.reduce(
      (acc, s) => acc + Math.max(0, (collection[s.number] ?? 0) - 1),
      0,
    );
    return { owned, dups, total: ALBUM.length };
  }, [collection]);

  const grouped = useMemo(() => teamsByGroup(), []);

  const extrasCount = useMemo(() => {
    const extras = ALBUM.filter(
      (s) => s.type === "coca_cola" || s.type === "special",
    );
    const ownedExtras = extras.filter(
      (s) => (collection[s.number] ?? 0) > 0,
    ).length;
    return { owned: ownedExtras, total: extras.length };
  }, [collection]);

  return (
    <div className="max-w-md mx-auto px-4 pt-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Mi álbum</h1>
          <p className="text-sm text-[color:var(--muted)]">
            Tocá una figurita para marcarla
          </p>
        </div>
        <Link href="/perfil" className="chip">
          {stats.owned}/{stats.total}
        </Link>
      </header>

      <ProgressBar value={stats.owned} max={stats.total} />

      <div className="grid grid-cols-3 gap-2 mt-4">
        <StatCard label="Tengo" value={stats.owned} color="primary" />
        <StatCard label="Repetidas" value={stats.dups} color="gold" />
        <StatCard
          label="Faltan"
          value={stats.total - stats.owned}
          color="muted"
        />
      </div>

      {!loaded && (
        <p className="text-center text-sm text-[color:var(--muted)] mt-8">
          Cargando tu álbum...
        </p>
      )}

      <Link
        href="/album/extras"
        className="card mt-5 flex items-center gap-3 hover:border-[color:var(--primary)]"
      >
        <Sparkles className="w-5 h-5 text-[color:var(--gold)]" />
        <div className="flex-1">
          <div className="font-semibold">Coca-Cola y Especiales</div>
          <div className="text-xs text-[color:var(--muted)]">
            {extrasCount.owned}/{extrasCount.total} figuritas
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-[color:var(--muted)]" />
      </Link>

      <h2 className="text-xs font-bold tracking-widest text-[color:var(--muted)] mt-8 mb-3">
        SELECCIONES POR GRUPO
      </h2>

      {GROUPS.map((g) => (
        <section key={g} className="mb-6">
          <h3 className="text-sm font-bold mb-2 px-1">Grupo {g}</h3>
          <div className="grid grid-cols-2 gap-2">
            {grouped[g].map((team) => {
              const teamStickers = stickersOfTeam(team.code);
              const owned = teamStickers.filter(
                (s) => (collection[s.number] ?? 0) > 0,
              ).length;
              const pct = Math.round((owned / teamStickers.length) * 100);
              return (
                <Link
                  key={team.code}
                  href={`/album/equipo/${team.code}`}
                  className="card !p-3 flex items-center gap-2 hover:border-[color:var(--primary)]"
                >
                  <span className="text-2xl">{team.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {team.name}
                    </div>
                    <div className="text-[10px] text-[color:var(--muted)]">
                      {owned}/{teamStickers.length} • {pct}%
                    </div>
                    <div className="h-1 bg-[color:var(--card-border)] rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full bg-[color:var(--primary)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      <div className="mt-10 text-center">
        <Link
          href="/album/lista"
          className="inline-flex items-center gap-2 text-sm text-[color:var(--muted)] underline"
        >
          <BookOpen className="w-4 h-4" /> Ver las 980 en una sola lista
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "primary" | "gold" | "muted";
}) {
  const colorClass =
    color === "primary"
      ? "text-[color:var(--primary)]"
      : color === "gold"
        ? "text-[color:var(--gold)]"
        : "text-[color:var(--muted)]";
  return (
    <div className="card text-center !p-3">
      <div className={`text-2xl font-black ${colorClass}`}>{value}</div>
      <div className="text-[10px] text-[color:var(--muted)] uppercase tracking-wider mt-0.5">
        {label}
      </div>
    </div>
  );
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mt-4">
      <div className="h-3 bg-[color:var(--card)] border border-[color:var(--card-border)] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--gold)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-center text-xs text-[color:var(--muted)] mt-1">
        {pct}% completado
      </div>
    </div>
  );
}
