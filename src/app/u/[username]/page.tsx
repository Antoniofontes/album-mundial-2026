import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ALBUM, stickersOfTeam } from "@/lib/album";
import { GROUPS, teamsByGroup } from "@/lib/teams";
import Link from "next/link";
import { ArrowLeft, Trophy, User } from "lucide-react";
import { GuestStickers } from "./GuestStickers";
import { ProfileTradeActions } from "./ProfileTradeActions";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props) {
  const { username } = await params;
  return {
    title: `Álbum de @${username}`,
    description: `Mirá las figuritas que tiene @${username}`,
  };
}

export default async function PublicProfile({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .eq("is_public", true)
    .maybeSingle();

  if (!profile) notFound();

  const { data: collection } = await supabase
    .from("collection")
    .select("sticker_code, count")
    .eq("user_id", profile.id);

  const map = new Map<string, number>();
  for (const r of collection ?? []) map.set(r.sticker_code, r.count);

  const owned = Array.from(map.values()).filter((c) => c > 0).length;
  const dups = Array.from(map.values()).reduce(
    (a, c) => a + Math.max(0, c - 1),
    0,
  );
  const total = ALBUM.length;

  const { data: authData } = await supabase.auth.getUser();
  const viewerId = authData.user?.id ?? null;

  const isOwnProfile = viewerId !== null && viewerId === profile.id;
  const collectionObj: Record<string, number> = {};
  map.forEach((v, k) => (collectionObj[k] = v));

  const grouped = teamsByGroup();

  return (
    <main className="min-h-screen pb-12">
      <div className="max-w-md mx-auto px-4 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-[color:var(--muted)]"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>

        <header className="mt-4">
          <h1 className="text-3xl font-black">{profile.display_name}</h1>
          <p className="text-sm text-[color:var(--muted)]">@{profile.username}</p>
          {profile.bio && (
            <p className="text-sm mt-2 text-[color:var(--foreground)]">{profile.bio}</p>
          )}
        </header>

        <div className="card mt-4 grid grid-cols-3 text-center !p-3">
          <div>
            <div className="text-2xl font-black text-[color:var(--primary)]">
              {owned}
            </div>
            <div className="text-[10px] uppercase text-[color:var(--muted)]">
              Tiene
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[color:var(--gold)]">{dups}</div>
            <div className="text-[10px] uppercase text-[color:var(--muted)]">
              Repetidas
            </div>
          </div>
          <div>
            <div className="text-2xl font-black">{total - owned}</div>
            <div className="text-[10px] uppercase text-[color:var(--muted)]">
              Faltan
            </div>
          </div>
        </div>

        {!viewerId ? (
          <div className="card mt-3 !p-3 flex items-center gap-2 bg-[color:var(--primary)]/10 border-[color:var(--primary)]/30">
            <Trophy className="w-5 h-5 text-[color:var(--primary)] shrink-0" />
            <p className="text-xs">
              Modo invitado · podés ver pero no marcar.{" "}
              <Link href="/login" className="underline font-semibold">
                Crear cuenta / Entrar
              </Link>{" "}
              para intercambiar y tener tu álbum.
            </p>
          </div>
        ) : isOwnProfile ? (
          <div className="card mt-3 !p-3 flex items-center gap-2 bg-[color:var(--muted)]/10 border-[color:var(--card-border)]">
            <User className="w-5 h-5 text-[color:var(--muted)] shrink-0" />
            <p className="text-xs">
              Estás viendo tu perfil público ·{" "}
              <Link href="/perfil" className="underline font-semibold">
                Ir a mi cuenta
              </Link>
            </p>
          </div>
        ) : (
          <ProfileTradeActions
            targetUserId={profile.id}
            targetDisplayName={profile.display_name}
          />
        )}

        <h2 className="text-xs font-bold tracking-widest text-[color:var(--muted)] mt-6 mb-2">
          ¿LE BUSCÁS UNA FIGURITA?
        </h2>

        <GuestStickers
          ownerCollection={collectionObj}
          ownerName={profile.display_name}
        />

        <h2 className="text-xs font-bold tracking-widest text-[color:var(--muted)] mt-8 mb-2">
          POR EQUIPO
        </h2>

        {GROUPS.map((g) => (
          <section key={g} className="mb-4">
            <h3 className="text-sm font-bold mb-2">Grupo {g}</h3>
            <div className="grid grid-cols-2 gap-2">
              {grouped[g].map((team) => {
                const ts = stickersOfTeam(team.code);
                const o = ts.filter((s) => (map.get(s.code) ?? 0) > 0).length;
                const pct = Math.round((o / ts.length) * 100);
                return (
                  <div key={team.code} className="card !p-3 flex items-center gap-2">
                    <span className="text-2xl">{team.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {team.name}
                      </div>
                      <div className="text-[10px] text-[color:var(--muted)]">
                        {o}/{ts.length} • {pct}%
                      </div>
                      <div className="h-1 bg-[color:var(--card-border)] rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-[color:var(--primary)]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
