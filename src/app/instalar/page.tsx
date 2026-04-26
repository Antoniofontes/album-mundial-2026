"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Share,
  PlusSquare,
  CheckCircle2,
  MoreVertical,
  Download,
  Apple,
  Smartphone,
  Copy,
} from "lucide-react";
import { detectPlatform, isStandalone, type Platform } from "@/lib/platform";

const SITE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : "https://album-mundial-2026-five.vercel.app";

export default function InstalarPage() {
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [standalone, setStandalone] = useState(false);
  const [tab, setTab] = useState<Platform>("ios");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const p = detectPlatform();
    setPlatform(p);
    setStandalone(isStandalone());
    if (p === "ios" || p === "android" || p === "desktop") setTab(p);
  }, []);

  async function copyLink() {
    await navigator.clipboard.writeText(SITE_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (standalone) {
    return (
      <main className="gradient-hero min-h-screen">
        <div className="max-w-md mx-auto px-5 pt-12 text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto text-[color:var(--primary)]" />
          <h1 className="mt-4 text-2xl font-black">¡Ya la tenés instalada!</h1>
          <p className="text-[color:var(--muted)] mt-2">
            Estás usando la app en modo standalone. Sumá amigos compartiendo el
            link.
          </p>
          <button onClick={copyLink} className="btn btn-secondary mt-6 inline-flex">
            <Copy className="w-4 h-4" />
            {copied ? "¡Copiado!" : "Copiar link para pasar a alguien"}
          </button>
          <div className="mt-8">
            <Link href="/" className="btn btn-primary">
              Volver
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="gradient-hero min-h-screen">
      <div className="max-w-md mx-auto px-5 pt-6 pb-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-[color:var(--muted)]"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>

        <header className="mt-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[color:var(--primary)]/10 mb-3">
            <Smartphone className="w-8 h-8 text-[color:var(--primary)]" />
          </div>
          <h1 className="text-3xl font-black">Instalar como app</h1>
          <p className="text-[color:var(--muted)] mt-2 text-sm">
            En 30 segundos la tenés en la pantalla de inicio sin App Store ni
            Play Store.
          </p>
        </header>

        <div className="grid grid-cols-3 gap-2 mt-6">
          {(["ios", "android", "desktop"] as Platform[]).map((p) => (
            <button
              key={p}
              onClick={() => setTab(p)}
              className={`btn ${
                tab === p ? "btn-primary" : "btn-secondary"
              } !py-3 text-xs`}
            >
              {p === "ios" ? "iPhone" : p === "android" ? "Android" : "Compu"}
              {platform === p && (
                <span className="ml-1 text-[10px] opacity-80">(vos)</span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "ios" && <IOSGuide />}
          {tab === "android" && <AndroidGuide />}
          {tab === "desktop" && <DesktopGuide />}
        </div>

        <div className="mt-10">
          <h2 className="text-xs uppercase tracking-widest text-[color:var(--muted)] mb-2">
            Pasale el link a alguien
          </h2>
          <div className="card flex items-center gap-2 !p-3">
            <span className="flex-1 text-xs truncate text-[color:var(--muted)]">
              {SITE_URL}
            </span>
            <button onClick={copyLink} className="btn btn-secondary !px-3">
              <Copy className="w-4 h-4" />
              {copied ? "¡Copiado!" : "Copiar"}
            </button>
          </div>
          <p className="text-[11px] text-[color:var(--muted)] mt-2">
            Sugerencia: copialo y mandalo por WhatsApp con este texto:
          </p>
          <div className="card !p-3 mt-2 text-sm leading-relaxed">
            <p>
              📕 Te paso una app que armé para llevar la cuenta del álbum del
              Mundial 2026. Marcás las que tenés, las repetidas, escaneás con
              la cámara y vemos quién tiene cuáles para arreglar intercambios.
            </p>
            <p className="mt-2">
              Entrá desde el celular: {SITE_URL}
            </p>
            <p className="mt-2 text-xs text-[color:var(--muted)]">
              👉 Y agregala a la pantalla de inicio para que quede como app.
            </p>
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link href="/" className="btn btn-primary">
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}

function Step({
  n,
  icon,
  title,
  text,
}: {
  n: number;
  icon: React.ReactNode;
  title: React.ReactNode;
  text: React.ReactNode;
}) {
  return (
    <div className="card !p-4 flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-[color:var(--primary)] text-white font-black flex items-center justify-center">
          {n}
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 font-semibold">
          {icon}
          <span>{title}</span>
        </div>
        <div className="text-sm text-[color:var(--muted)] mt-1">{text}</div>
      </div>
    </div>
  );
}

function IOSGuide() {
  return (
    <div className="grid gap-3">
      <div className="card !p-4 bg-[color:var(--primary)]/5 border-[color:var(--primary)]/30">
        <div className="flex items-center gap-2 font-semibold">
          <Apple className="w-5 h-5" />
          iPhone / iPad
        </div>
        <p className="text-sm text-[color:var(--muted)] mt-1">
          Importante: tiene que ser <b>Safari</b> (no Chrome ni Instagram in-app).
          Si estás en Chrome, copiá el link y abrilo en Safari.
        </p>
      </div>

      <Step
        n={1}
        icon={null}
        title="Abrí esta página en Safari"
        text="Si estás en otro navegador, copiá el link y pegalo en Safari."
      />
      <Step
        n={2}
        icon={<Share className="w-4 h-4" />}
        title={
          <>
            Tocá el ícono <span className="font-mono">Compartir</span>
          </>
        }
        text={
          <>
            Es el cuadradito con la flecha hacia arriba que está abajo en el
            medio de la pantalla.
          </>
        }
      />
      <Step
        n={3}
        icon={<PlusSquare className="w-4 h-4" />}
        title='Tocá "Añadir a pantalla de inicio"'
        text='Bajá un poco la lista de opciones; está entre "Marcadores" y "Imprimir". A veces dice "Add to Home Screen".'
      />
      <Step
        n={4}
        icon={<CheckCircle2 className="w-4 h-4" />}
        title='Tocá "Añadir" arriba a la derecha'
        text="Listo. Te aparece como app con su ícono propio. Cuando la abras, no vas a ver la barra de Safari."
      />

      <div className="card !p-3 text-xs text-[color:var(--muted)]">
        💡 Si la abriste desde el link de Instagram, WhatsApp o el mail, te
        abre el "navegador in-app" que <b>no</b> tiene la opción "Añadir a
        pantalla de inicio". Tocá los 3 puntitos / "Abrir en Safari" primero.
      </div>
    </div>
  );
}

function AndroidGuide() {
  return (
    <div className="grid gap-3">
      <div className="card !p-4 bg-[color:var(--primary)]/5 border-[color:var(--primary)]/30">
        <div className="flex items-center gap-2 font-semibold">
          <Smartphone className="w-5 h-5" />
          Android (Chrome)
        </div>
        <p className="text-sm text-[color:var(--muted)] mt-1">
          Si te aparece un banner que dice "Instalar app" abajo, tocalo y listo.
          Si no, seguí los pasos.
        </p>
      </div>

      <Step
        n={1}
        icon={null}
        title="Abrí esta página en Chrome"
        text="O en Brave / Edge: todos soportan PWA. Mejor no usar el navegador in-app de Instagram o WhatsApp."
      />
      <Step
        n={2}
        icon={<MoreVertical className="w-4 h-4" />}
        title="Tocá los 3 puntitos arriba a la derecha"
        text="Es el menú de Chrome."
      />
      <Step
        n={3}
        icon={<Download className="w-4 h-4" />}
        title='Tocá "Instalar app" o "Agregar a pantalla principal"'
        text="Algunos celulares dicen una y otros la otra. Es lo mismo."
      />
      <Step
        n={4}
        icon={<CheckCircle2 className="w-4 h-4" />}
        title='Confirmá "Instalar"'
        text="Te aparece en el cajón de apps con su ícono. Se abre como una app real, sin barra del navegador."
      />
    </div>
  );
}

function DesktopGuide() {
  return (
    <div className="grid gap-3">
      <div className="card !p-4 bg-[color:var(--primary)]/5 border-[color:var(--primary)]/30">
        <div className="flex items-center gap-2 font-semibold">
          <Smartphone className="w-5 h-5" />
          PC / Mac
        </div>
        <p className="text-sm text-[color:var(--muted)] mt-1">
          También se puede instalar en la compu, pero la idea principal es que
          la uses en el celular cuando estés con el álbum físico.
        </p>
      </div>
      <Step
        n={1}
        icon={null}
        title="Abrí en Chrome / Edge / Brave"
        text="Funciona en cualquier navegador basado en Chromium."
      />
      <Step
        n={2}
        icon={<Download className="w-4 h-4" />}
        title="Mirá la barra de direcciones"
        text='A la derecha del ícono de candado debería aparecer un ícono de "Instalar app". Tocalo.'
      />
      <Step
        n={3}
        icon={<CheckCircle2 className="w-4 h-4" />}
        title='Tocá "Instalar"'
        text="Se abre como ventana propia y queda en el dock / barra de tareas."
      />
    </div>
  );
}
