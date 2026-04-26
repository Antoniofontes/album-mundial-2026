import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Trophy, Search, ScanLine, Users, Sparkles, Smartphone } from "lucide-react";
import { InstallBanner } from "@/components/InstallBanner";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/album");

  return (
    <main className="gradient-hero min-h-screen">
      <InstallBanner />
      <div className="max-w-md mx-auto px-5 pt-12 pb-32">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-[color:var(--gold)]" />
            <span className="text-xs font-semibold tracking-widest text-[color:var(--muted)]">
              PANINI 2026
            </span>
            <Sparkles className="w-5 h-5 text-[color:var(--gold)]" />
          </div>
          <h1 className="text-4xl font-black leading-tight">
            Tu álbum del{" "}
            <span className="text-[color:var(--primary)]">Mundial 2026</span>,
            <br />
            siempre con vos
          </h1>
          <p className="mt-4 text-[color:var(--muted)]">
            980 figuritas. 48 selecciones. Marcá las que tenés, escaneá el álbum
            con la cámara y arreglá intercambios con amigos en segundos.
          </p>
        </div>

        <div className="mt-10 grid gap-3">
          <Feature
            icon={<Trophy className="w-5 h-5 text-[color:var(--primary)]" />}
            title="Marcá lo que tenés y lo que te falta"
            text="Tocá una figurita: tenés / repetida / falta. Sincroniza online."
          />
          <Feature
            icon={<ScanLine className="w-5 h-5 text-[color:var(--primary)]" />}
            title="Escaneá el álbum con la cámara"
            text="Sacale una foto a la página y la IA detecta cuáles ya pegaste."
          />
          <Feature
            icon={<Users className="w-5 h-5 text-[color:var(--primary)]" />}
            title="Intercambios con amigos"
            text="Anotá quién tiene qué y vé al toque a quién pedirle la que te falta."
          />
          <Feature
            icon={<Search className="w-5 h-5 text-[color:var(--primary)]" />}
            title="Modo invitado"
            text="Compartí tu álbum por link sin que la otra persona se registre."
          />
        </div>

        <div className="mt-10 grid gap-3">
          <Link href="/login" className="btn btn-primary text-base py-4">
            Crear cuenta / Entrar
          </Link>
          <Link href="/comunidad" className="btn btn-secondary text-base py-4">
            Entrar como invitado
          </Link>
          <Link
            href="/instalar"
            className="btn btn-ghost text-sm text-[color:var(--muted)] py-3 inline-flex"
          >
            <Smartphone className="w-4 h-4" />
            Cómo instalarla como app en tu celular
          </Link>
        </div>

        <p className="mt-8 text-center text-xs text-[color:var(--muted)]">
          Hecho por y para la comunidad. No oficial Panini.
        </p>
      </div>
    </main>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="card flex gap-3 items-start">
      <div className="mt-1">{icon}</div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-[color:var(--muted)] mt-0.5">{text}</p>
      </div>
    </div>
  );
}
