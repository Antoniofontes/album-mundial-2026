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
    key: "coca_cola",
    title: "Edición Coca-Cola",
    subtitle: "12 figuritas (vienen en botellas)",
  },
  {
    key: "special",
    title: "Especiales / Portada",
    subtitle: "8 figuritas misceláneas (intro, copa, mascotas, etc.)",
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
        Las hojas físicas como portada, mascotas, copa, sedes y campeones del
        mundo varían entre versiones del álbum. Podés organizarlas vos mismo
        creando hojas custom desde el escáner.
      </p>

      <Link
        href="/scan/referencias"
        className="card mt-3 flex items-center gap-3"
      >
        <Layers className="w-5 h-5 text-[color:var(--gold)]" />
        <div className="flex-1">
          <div className="font-semibold">Crear hojas custom</div>
          <div className="text-xs text-[color:var(--muted)]">
            Subí foto + ponele nombre + elegí qué números van
          </div>
        </div>
      </Link>

      {SECTIONS.map((sec) => {
        const list = groups[sec.key];
        const owned = list.filter((s) => (collection[s.number] ?? 0) > 0).length;
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
                  key={s.number}
                  sticker={s}
                  count={collection[s.number] ?? 0}
                  onChange={(c) => setCount(s.number, c)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
