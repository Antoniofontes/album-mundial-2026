"use client";

import { ALBUM, type StickerType } from "@/lib/album";
import { useCollection } from "@/lib/store";
import { StickerCell } from "@/components/StickerCell";
import { ArrowLeft, Layers } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

const SECTIONS: { key: StickerType; title: string; subtitle: string }[] = [
  {
    key: "intro",
    title: "Portada (00)",
    subtitle: "1 sticker",
  },
  {
    key: "fwc",
    title: "FIFA World Cup specials",
    subtitle: "FWC1 a FWC19 — mascotas, copa, sedes, campeones, etc.",
  },
  {
    key: "coca_cola",
    title: "Edición Coca-Cola",
    subtitle: "CC1 a CC14 — vienen en botellas",
  },
];

export default function ExtrasPage() {
  const router = useRouter();
  const collection = useCollection((s) => s.collection);
  const setCount = useCollection((s) => s.setCount);

  const groups = useMemo(() => {
    const out: Record<string, typeof ALBUM> = {};
    for (const sec of SECTIONS) {
      out[sec.key] = ALBUM.filter((s) => s.type === sec.key);
    }
    return out;
  }, []);

  return (
    <div className="max-w-md mx-auto px-4 pt-4">
      <div className="flex items-center gap-2">
        <button onClick={() => router.back()} className="btn btn-ghost !px-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-black text-xl">Extras del álbum</h1>
      </div>

      <p className="text-xs text-[color:var(--muted)] mt-2">
        Acá van todas las figuritas que no son de selecciones: portada (00),
        FIFA World Cup specials (FWC1–FWC19) y la línea Coca-Cola (CC1–CC14).
      </p>

      <Link
        href="/scan/referencias"
        className="card mt-3 flex items-center gap-3"
      >
        <Layers className="w-5 h-5 text-[color:var(--gold)]" />
        <div className="flex-1">
          <div className="font-semibold">Crear hojas custom</div>
          <div className="text-xs text-[color:var(--muted)]">
            Subí foto + ponele nombre + elegí qué códigos van
          </div>
        </div>
      </Link>

      {SECTIONS.map((sec) => {
        const list = groups[sec.key];
        const owned = list.filter(
          (s) => (collection[s.code] ?? 0) > 0,
        ).length;
        return (
          <section key={sec.key} className="mt-6">
            <div className="flex justify-between items-end mb-1">
              <h2 className="font-bold">{sec.title}</h2>
              <span className="text-xs text-[color:var(--muted)]">
                {owned}/{list.length}
              </span>
            </div>
            <p className="text-[11px] text-[color:var(--muted)] mb-2">
              {sec.subtitle}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {list.map((s) => (
                <StickerCell
                  key={s.code}
                  sticker={s}
                  count={collection[s.code] ?? 0}
                  onChange={(c) => setCount(s.code, c)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
