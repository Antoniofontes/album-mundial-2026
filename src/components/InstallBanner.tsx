"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Smartphone, X } from "lucide-react";
import { detectPlatform, isStandalone } from "@/lib/platform";

const DISMISS_KEY = "install-banner-dismissed-v1";

export function InstallBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    const p = detectPlatform();
    if (p === "ios" || p === "android") {
      setTimeout(() => setShow(true), 600);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-40 px-3 pt-3">
      <div className="max-w-md mx-auto card !p-3 flex items-center gap-3 shadow-lg border-[color:var(--primary)]/40">
        <div className="bg-[color:var(--primary)]/15 rounded-xl p-2">
          <Smartphone className="w-5 h-5 text-[color:var(--primary)]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold leading-tight">
            Usalo como app en tu celular
          </div>
          <Link href="/instalar" className="text-xs text-[color:var(--primary)] underline">
            Ver cómo instalar (1 toque)
          </Link>
        </div>
        <button
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, "1");
            setShow(false);
          }}
          aria-label="Cerrar"
          className="p-1 text-[color:var(--muted)]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
