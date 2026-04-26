"use client";

import { ALBUM, type StickerType } from "@/lib/album";
import { useCollection } from "@/lib/store";
import { StickerCell } from "@/components/StickerCell";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

const SECTIONS: { key: StickerType; title: string }[] = [
  { key: "intro", title: "Introducción" },
  { key: "stadium", title: "Estadios" },
  { key: "coca_cola", title: "Edición Coca-Cola" },
  { key: "legend", title: "Leyendas" },
  { key: "special", title: "Especiales brillantes" },
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

      {SECTIONS.map((sec) => {
        const list = groups[sec.key];
        const owned = list.filter((s) => (collection[s.number] ?? 0) > 0).length;
        return (
          <section key={sec.key} className="mt-6">
            <div className="flex justify-between items-end mb-2">
              <h2 className="font-bold">{sec.title}</h2>
              <span className="text-xs text-[color:var(--muted)]">
                {owned}/{list.length}
              </span>
            </div>
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
