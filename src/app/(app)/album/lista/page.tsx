"use client";

import { ALBUM } from "@/lib/album";
import { TEAM_BY_CODE } from "@/lib/teams";
import { useCollection } from "@/lib/store";
import { StickerCell } from "@/components/StickerCell";
import { ArrowLeft, Search, Share2, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

function buildWhatsAppList(collection: Record<string, number>): string {
  const missing = ALBUM.filter((s) => (collection[s.code] ?? 0) === 0);
  if (missing.length === 0) return "¡Tengo el álbum completo! 🏆";

  const lines: string[] = [];
  lines.push(`📋 *Mis faltantes - Mundial 2026*`);
  lines.push(`_(${missing.length} de ${ALBUM.length})_`);

  const specials = missing.filter(
    (s) => s.type === "intro" || s.type === "fwc" || s.type === "coca_cola",
  );
  if (specials.length > 0) {
    lines.push("");
    lines.push(`*⭐ Especiales:* ${specials.map((s) => s.code).join(", ")}`);
  }

  const teamCodes = [
    ...new Set(
      missing
        .filter((s) => s.team && s.type !== "coca_cola")
        .map((s) => s.team!),
    ),
  ];
  for (const teamCode of teamCodes) {
    const team = TEAM_BY_CODE[teamCode];
    if (!team) continue;
    const codes = missing
      .filter((s) => s.team === teamCode && s.type !== "coca_cola")
      .map((s) => s.code)
      .join(", ");
    lines.push(`*${team.flag} ${team.name}:* ${codes}`);
  }

  return lines.join("\n");
}

export default function ListaPage() {
  const router = useRouter();
  const collection = useCollection((s) => s.collection);
  const setCount = useCollection((s) => s.setCount);
  const [filter, setFilter] = useState<"all" | "owned" | "missing" | "dups">("all");
  const [q, setQ] = useState("");
  const [shareState, setShareState] = useState<"idle" | "copied" | "shared">("idle");

  const missingCount = useMemo(
    () => ALBUM.filter((s) => (collection[s.code] ?? 0) === 0).length,
    [collection],
  );

  async function shareWhatsApp() {
    const text = buildWhatsAppList(collection);
    if (navigator.share) {
      try {
        await navigator.share({ text });
        setShareState("shared");
        setTimeout(() => setShareState("idle"), 2000);
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 2000);
    }
  }

  const filtered = useMemo(() => {
    return ALBUM.filter((s) => {
      const c = collection[s.code] ?? 0;
      if (filter === "owned" && c === 0) return false;
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
  }, [collection, filter, q]);

  return (
    <div className="max-w-md mx-auto px-4 pt-4">
      <div className="flex items-center gap-2">
        <button onClick={() => router.back()} className="btn btn-ghost !px-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-black text-xl">Las 994</h1>
      </div>

      <div className="mt-4 relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" />
        <input
          type="search"
          placeholder="Buscar código (ARG12, FWC3, CC7) o nombre..."
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

      {missingCount > 0 && (
        <button
          onClick={shareWhatsApp}
          className="btn btn-secondary w-full mt-3 gap-2"
        >
          {shareState === "copied" ? (
            <>
              <Check className="w-4 h-4 text-green-500" />
              ¡Copiado! Pegá en WhatsApp
            </>
          ) : shareState === "shared" ? (
            <>
              <Check className="w-4 h-4 text-green-500" />
              ¡Compartido!
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              Compartir faltantes por WhatsApp
              <span className="ml-auto text-[color:var(--muted)] text-xs">
                {missingCount}
              </span>
            </>
          )}
        </button>
      )}

      <div className="text-xs text-[color:var(--muted)] mt-3">
        {filtered.length} resultados
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {filtered.map((s) => (
          <StickerCell
            key={s.code}
            sticker={s}
            count={collection[s.code] ?? 0}
            onChange={(c) => setCount(s.code, c)}
          />
        ))}
      </div>
    </div>
  );
}
