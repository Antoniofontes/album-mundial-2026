"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
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

  return (
    <main className="gradient-hero min-h-screen">
      <div className="max-w-md mx-auto px-5 pt-6">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-[color:var(--muted)]">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>

        <div className="mt-10">
          <h1 className="text-3xl font-black">Entrá a tu álbum</h1>
          <p className="text-[color:var(--muted)] mt-2">
            Te mandamos un link mágico al mail. Sin contraseñas.
          </p>
        </div>

        {sent ? (
          <div className="card mt-8">
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
          <form onSubmit={submit} className="mt-8 grid gap-3">
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
            {err && (
              <p className="text-sm text-[color:var(--accent)] text-center">{err}</p>
            )}
          </form>
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
