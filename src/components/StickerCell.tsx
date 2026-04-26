"use client";

import clsx from "clsx";
import type { Sticker } from "@/lib/album";

type Props = {
  sticker: Sticker;
  count: number;
  onChange: (newCount: number) => void;
  /** En modo readOnly se muestra pero no se puede tocar */
  readOnly?: boolean;
};

export function StickerCell({ sticker, count, onChange, readOnly }: Props) {
  const state = count === 0 ? "missing" : count === 1 ? "owned" : "duplicate";

  function cycle() {
    if (readOnly) return;
    // ciclo: 0 → 1 → 2 → 0
    const next = count >= 2 ? 0 : count + 1;
    onChange(next);
  }

  function longPress() {
    if (readOnly) return;
    onChange(count > 0 ? count + 1 : 1);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      onContextMenu={(e) => {
        e.preventDefault();
        longPress();
      }}
      className={clsx(
        "sticker",
        state,
        sticker.premium && "premium",
        readOnly && "cursor-default",
      )}
      aria-label={`Figurita ${sticker.number} ${sticker.name}`}
    >
      <span className="sticker-num">{sticker.number}</span>
      <span className="sticker-name">{sticker.name}</span>
      {count > 1 && (
        <span className="absolute -top-2 -right-2 bg-[color:var(--accent)] text-white text-[10px] font-bold rounded-full w-6 h-6 flex items-center justify-center shadow">
          ×{count}
        </span>
      )}
    </button>
  );
}
