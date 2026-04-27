"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const supabase = createClient();
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });
    setLoading(false);
    if (error) setErr(error.message);
    else setSent(true);
  }

  async function loginGoogle() {
    setErr(null);
    setGoogleLoading(true);
    const supabase = createClient();
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback` },
    });
    if (error) {
      setGoogleLoading(false);
      setErr(error.message);
    }
  }

  return (
    <main className="gradient-hero min-h-screen">
      <div className="max-w-md mx-auto px-5 pt-6">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-[color:var(--muted)]">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>

        <div className="mt-10">
          <h1 className="text-3xl font-black">Entrá a tu álbum</h1>
          <p className="text-[color:var(--muted)] mt-2">
            Entrá con Google en un toque, o pedí un link mágico al mail.
          </p>
        </div>

        <button
          type="button"
          onClick={loginGoogle}
          disabled={googleLoading}
          className="btn mt-8 w-full py-4 text-base bg-white text-black border border-black/10 hover:bg-white/90 disabled:opacity-50 flex items-center justify-center gap-3"
        >
          <GoogleIcon />
          {googleLoading ? "Redirigiendo..." : "Continuar con Google"}
        </button>

        <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-widest text-[color:var(--muted)]">
          <div className="flex-1 h-px bg-[color:var(--card-border)]" />
          o con mail
          <div className="flex-1 h-px bg-[color:var(--card-border)]" />
        </div>

        {sent ? (
          <div className="card">
            <div className="flex gap-3 items-start">
              <Mail className="w-6 h-6 text-[color:var(--primary)]" />
              <div>
                <h2 className="font-semibold">Revisá tu mail</h2>
                <p className="text-sm text-[color:var(--muted)] mt-1">
                  Te mandamos un link a <b>{email}</b>. Tocalo desde el celular y
                  ya quedás logueado.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-3">
            <input
              type="email"
              required
              placeholder="tu@mail.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary py-4 text-base disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Enviarme el link"}
            </button>
          </form>
        )}

        {err && (
          <p className="text-sm text-[color:var(--accent)] text-center mt-3">{err}</p>
        )}

        <div className="mt-10 text-center">
          <Link href="/comunidad" className="text-sm text-[color:var(--muted)] underline">
            o entrá como invitado
          </Link>
        </div>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 5.1 29.3 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 5.1 29.3 3 24 3 16.3 3 9.7 7.4 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 45c5.2 0 9.9-2 13.5-5.2l-6.2-5.3c-2 1.5-4.5 2.5-7.3 2.5-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 40.6 16.2 45 24 45z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.2 5.3c-.4.4 6.7-4.9 6.7-15 0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
