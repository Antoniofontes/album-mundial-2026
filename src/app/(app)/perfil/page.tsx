"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";
import { useCollection } from "@/lib/store";
import { ALBUM } from "@/lib/album";
import {
  LogOut,
  Share2,
  Save,
  Eye,
  EyeOff,
  Copy,
  Smartphone,
  Download,
  ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  drawShareCard,
  getCardSize,
  canvasToBlob,
  type CardFormat,
} from "@/lib/shareCard";

const PREVIEW_SIZE = { square: { w: 280, h: 280 }, stories: { w: 158, h: 280 } };

export default function PerfilPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [siteUrl, setSiteUrl] = useState("");

  // Card state
  const [cardFormat, setCardFormat] = useState<CardFormat>("square");
  const [cardSharing, setCardSharing] = useState(false);
  const previewRef = useRef<HTMLCanvasElement>(null);

  const collection = useCollection((s) => s.collection);
  const owned = ALBUM.filter((s) => (collection[s.code] ?? 0) > 0).length;
  const dups = ALBUM.reduce(
    (a, s) => a + Math.max(0, (collection[s.code] ?? 0) - 1),
    0,
  );
  const total = ALBUM.length;

  useEffect(() => {
    setSiteUrl(window.location.origin);
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (data) {
        setProfile(data);
        setName(data.display_name);
        setUsername(data.username);
        setBio(data.bio ?? "");
        setIsPublic(data.is_public);
      }
    })();
  }, []);

  // Redraw preview whenever relevant data changes
  const drawPreview = useCallback(() => {
    const canvas = previewRef.current;
    if (!canvas || !profile) return;
    const prev = PREVIEW_SIZE[cardFormat];
    canvas.width = prev.w;
    canvas.height = prev.h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawShareCard(ctx, {
      name,
      username,
      owned,
      total,
      hostname: siteUrl ? new URL(siteUrl).hostname : "albumuniversal.app",
      format: cardFormat,
    });
  }, [profile, name, username, owned, total, siteUrl, cardFormat]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  function buildFullCanvas(): HTMLCanvasElement {
    const { w, h } = getCardSize(cardFormat);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    drawShareCard(ctx, {
      name,
      username,
      owned,
      total,
      hostname: siteUrl ? new URL(siteUrl).hostname : "albumuniversal.app",
      format: cardFormat,
    });
    return canvas;
  }

  function handleDownload() {
    const canvas = buildFullCanvas();
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `album-mundial-2026-${username}.png`;
    a.click();
  }

  async function handleShareCard() {
    setCardSharing(true);
    try {
      const canvas = buildFullCanvas();
      const blob = await canvasToBlob(canvas);
      const file = new File([blob], `album-mundial-2026-${username}.png`, {
        type: "image/png",
      });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${name} — Álbum Mundial 2026`,
          text: `Tengo ${owned} de ${total} figuritas del Mundial 2026 🌍`,
        });
      } else {
        // Fallback: download
        handleDownload();
      }
    } catch {
      // user cancelled or not supported — silently ignore
    } finally {
      setCardSharing(false);
    }
  }

  async function save() {
    if (!profile) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: name,
        username: username.toLowerCase().replace(/[^a-z0-9_]/g, ""),
        bio: bio || null,
        is_public: isPublic,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) alert(error.message);
    else alert("Guardado!");
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  async function share() {
    if (!profile) return;
    const url = `${siteUrl}/u/${username}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${name} — Álbum Mundial 2026`,
          text: `Mirá mi álbum del Mundial 2026: ${owned}/${total} figuritas`,
          url,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (!profile) {
    return <div className="p-6 text-center text-sm">Cargando...</div>;
  }

  const publicUrl = `${siteUrl}/u/${username}`;
  const prev = PREVIEW_SIZE[cardFormat];

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-8">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black">Mi perfil</h1>
          <p className="text-sm text-[color:var(--muted)]">
            Configurá tu cuenta y compartí tu álbum
          </p>
        </div>
        <button onClick={logout} className="btn btn-ghost text-sm text-[color:var(--muted)]">
          <LogOut className="w-4 h-4" />
          Salir
        </button>
      </header>

      <div className="card mt-4 grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-2xl font-black text-[color:var(--primary)]">{owned}</div>
          <div className="text-[10px] uppercase text-[color:var(--muted)]">Tengo</div>
        </div>
        <div>
          <div className="text-2xl font-black text-[color:var(--gold)]">{dups}</div>
          <div className="text-[10px] uppercase text-[color:var(--muted)]">Repetidas</div>
        </div>
        <div>
          <div className="text-2xl font-black">{total - owned}</div>
          <div className="text-[10px] uppercase text-[color:var(--muted)]">Faltan</div>
        </div>
      </div>

      {/* ── Tarjeta compartible ── */}
      <section className="mt-6">
        <h2 className="text-xs uppercase text-[color:var(--muted)] mb-3">
          Tarjeta de progreso
        </h2>

        {/* Format toggle */}
        <div className="flex gap-2 mb-4">
          {(["square", "stories"] as CardFormat[]).map((fmt) => (
            <button
              key={fmt}
              onClick={() => setCardFormat(fmt)}
              className={`chip ${
                cardFormat === fmt
                  ? "!bg-[color:var(--primary)] text-white !border-transparent"
                  : ""
              }`}
            >
              {fmt === "square" ? "⬛ Cuadrado" : "📱 Stories"}
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className="flex justify-center">
          <div
            className="rounded-2xl overflow-hidden shadow-xl"
            style={{ width: prev.w, height: prev.h }}
          >
            <canvas
              ref={previewRef}
              width={prev.w}
              height={prev.h}
              style={{ display: "block", width: prev.w, height: prev.h }}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button onClick={handleDownload} className="btn btn-secondary">
            <Download className="w-4 h-4" />
            Descargar
          </button>
          <button
            onClick={handleShareCard}
            disabled={cardSharing}
            className="btn btn-primary disabled:opacity-60"
          >
            {cardSharing ? (
              <ImageIcon className="w-4 h-4 animate-pulse" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            {cardSharing ? "Compartiendo..." : "Compartir"}
          </button>
        </div>
        <p className="text-[11px] text-center text-[color:var(--muted)] mt-2">
          Descargá y compartí en Instagram, WhatsApp o donde quieras
        </p>
      </section>

      <section className="mt-6 grid gap-3">
        <label className="block">
          <span className="text-xs uppercase text-[color:var(--muted)]">
            Nombre visible
          </span>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-xs uppercase text-[color:var(--muted)]">Usuario</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ej: pablito"
          />
          <span className="text-[11px] text-[color:var(--muted)]">{publicUrl}</span>
        </label>
        <label className="block">
          <span className="text-xs uppercase text-[color:var(--muted)]">Bio</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={2}
            placeholder="ej: vivo en Belgrano, hago intercambios sábados"
          />
        </label>

        <div className="card flex justify-between items-center !p-3">
          <div className="flex items-center gap-2">
            {isPublic ? (
              <Eye className="w-4 h-4 text-[color:var(--primary)]" />
            ) : (
              <EyeOff className="w-4 h-4 text-[color:var(--muted)]" />
            )}
            <div>
              <div className="text-sm font-semibold">Perfil público</div>
              <div className="text-[11px] text-[color:var(--muted)]">
                Aparece en el ranking y se puede ver por link
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsPublic((p) => !p)}
            className={`btn !px-4 ${isPublic ? "btn-primary" : "btn-secondary"}`}
          >
            {isPublic ? "Sí" : "No"}
          </button>
        </div>

        <button onClick={save} disabled={saving} className="btn btn-primary py-3">
          <Save className="w-4 h-4" />
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </section>

      <section className="mt-6">
        <h2 className="text-xs uppercase text-[color:var(--muted)] mb-2">
          Compartir mi álbum
        </h2>
        <div className="card flex items-center gap-2 !p-3">
          <span className="text-xs flex-1 truncate text-[color:var(--muted)]">
            {publicUrl}
          </span>
          <button onClick={share} className="btn btn-secondary !px-3">
            {copied ? <Copy className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {copied ? "¡Copiado!" : "Compartir"}
          </button>
        </div>
      </section>

      <section className="mt-6">
        <Link
          href="/instalar"
          className="card !p-3 flex items-center gap-3 hover:border-[color:var(--primary)]"
        >
          <div className="bg-[color:var(--primary)]/15 rounded-xl p-2">
            <Smartphone className="w-5 h-5 text-[color:var(--primary)]" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Instalar como app</div>
            <div className="text-[11px] text-[color:var(--muted)]">
              Paso a paso para iPhone y Android
            </div>
          </div>
        </Link>
      </section>
    </div>
  );
}
