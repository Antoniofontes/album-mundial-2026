"use client";

import { useParams, useRouter } from "next/navigation";
import { TEAM_BY_CODE } from "@/lib/teams";
import { stickersOfTeam } from "@/lib/album";
import { useCollection } from "@/lib/store";
import { StickerCell } from "@/components/StickerCell";
import { ArrowLeft, MoreVertical } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export default function TeamPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const team = TEAM_BY_CODE[params.code];
  const collection = useCollection((s) => s.collection);
  const setCount = useCollection((s) => s.setCount);

  const stickers = useMemo(
    () => (team ? stickersOfTeam(team.code) : []),
    [team],
  );
  const owned = stickers.filter((s) => (collection[s.number] ?? 0) > 0).length;
  const dups = stickers.reduce(
    (acc, s) => acc + Math.max(0, (collection[s.number] ?? 0) - 1),
    0,
  );

  if (!team) {
    return (
      <div className="p-4">
        <p>Equipo no encontrado.</p>
        <button onClick={() => router.back()} className="btn btn-secondary mt-4">
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-4">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="btn btn-ghost !px-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="text-3xl">{team.flag}</div>
          <h1 className="font-black text-lg leading-tight">{team.name}</h1>
          <span className="text-[10px] text-[color:var(--muted)]">
            Grupo {team.group} · {team.confederation}
          </span>
        </div>
        <Link href={`/comunidad/asignar?team=${team.code}`} className="btn btn-ghost !px-2">
          <MoreVertical className="w-5 h-5" />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        <Stat label="Tengo" v={owned} t="primary" />
        <Stat label="Repetidas" v={dups} t="gold" />
        <Stat label="Faltan" v={stickers.length - owned} t="muted" />
      </div>

      <div className="grid grid-cols-3 gap-2 mt-5">
        {stickers.map((s) => (
          <StickerCell
            key={s.number}
            sticker={s}
            count={collection[s.number] ?? 0}
            onChange={(c) => setCount(s.number, c)}
          />
        ))}
      </div>

      <p className="text-center text-xs text-[color:var(--muted)] mt-6">
        Toque corto: tengo / repetida / falta · Toque largo: sumar repetida
      </p>
    </div>
  );
}

function Stat({ label, v, t }: { label: string; v: number; t: string }) {
  const c =
    t === "primary"
      ? "text-[color:var(--primary)]"
      : t === "gold"
        ? "text-[color:var(--gold)]"
        : "text-[color:var(--muted)]";
  return (
    <div className="card !p-3 text-center">
      <div className={`text-2xl font-black ${c}`}>{v}</div>
      <div className="text-[10px] uppercase text-[color:var(--muted)] mt-0.5">
        {label}
      </div>
    </div>
  );
}
