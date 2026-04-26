import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ALBUM_BY_CODE } from "@/lib/album";
import { ArrowLeft, Camera, Image as ImageIcon } from "lucide-react";
import type { Scan } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function HistorialPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: scans, error } = await supabase
    .from("scans")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(40)
    .returns<Scan[]>();

  const items = scans ?? [];

  // Generamos signed URLs para previews
  const withUrl = await Promise.all(
    items.map(async (scan) => {
      const { data: signed } = await supabase.storage
        .from("album-scans")
        .createSignedUrl(scan.storage_path, 60 * 30);
      return { scan, url: signed?.signedUrl ?? null };
    }),
  );

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-24">
      <header className="flex items-center gap-3">
        <Link
          href="/scan"
          className="text-[color:var(--muted)]"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Camera className="w-6 h-6" /> Historial
        </h1>
      </header>

      {error && (
        <p className="text-sm text-[color:var(--accent)] mt-4">
          Error cargando historial: {error.message}
        </p>
      )}

      {items.length === 0 && (
        <div className="card mt-6 text-center !p-6">
          <ImageIcon className="w-12 h-12 mx-auto text-[color:var(--muted)]" />
          <p className="mt-3 text-sm text-[color:var(--muted)]">
            Todavía no escaneaste ninguna página.
          </p>
          <Link href="/scan" className="btn btn-primary mt-4 inline-flex">
            Escanear ahora
          </Link>
        </div>
      )}

      <ul className="mt-4 space-y-3">
        {withUrl.map(({ scan, url }) => {
          const codes = scan.detected_codes ?? [];
          const date = new Date(scan.created_at).toLocaleString("es-AR", {
            dateStyle: "short",
            timeStyle: "short",
          });
          return (
            <li key={scan.id} className="card !p-3">
              <div className="flex gap-3">
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt=""
                    className="w-24 h-24 object-cover rounded-lg shrink-0"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-[color:var(--card-border)] shrink-0 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-[color:var(--muted)]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-[color:var(--muted)]">
                      {date}
                    </span>
                    <StatusBadge status={scan.status} />
                  </div>
                  <p className="font-bold mt-1">
                    {codes.length === 0
                      ? "Sin detecciones"
                      : `${codes.length} figurita${codes.length === 1 ? "" : "s"}`}
                  </p>
                  {codes.length > 0 && (
                    <p className="text-[11px] text-[color:var(--muted)] mt-1 line-clamp-2">
                      {codes
                        .slice(0, 8)
                        .map(
                          (c) =>
                            `${c} ${ALBUM_BY_CODE[c]?.name ?? ""}`.trim(),
                        )
                        .join(" · ")}
                      {codes.length > 8 ? ` · +${codes.length - 8}` : ""}
                    </p>
                  )}
                  {scan.error && (
                    <p className="text-[11px] text-[color:var(--accent)] mt-1 break-words">
                      {scan.error}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {items.length > 0 && (
        <p className="text-[11px] text-[color:var(--muted)] mt-4 text-center">
          Mostramos los últimos 40 scans. Los logs detallados de cada llamada a
          la IA están en Vercel.
        </p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Scan["status"] }) {
  const map: Record<Scan["status"], { label: string; cls: string }> = {
    done: { label: "OK", cls: "bg-emerald-500/15 text-emerald-400" },
    processing: { label: "procesando", cls: "bg-blue-500/15 text-blue-400" },
    pending: { label: "pendiente", cls: "bg-yellow-500/15 text-yellow-400" },
    error: { label: "error", cls: "bg-red-500/15 text-red-400" },
  };
  const m = map[status] ?? map.pending;
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${m.cls}`}>
      {m.label}
    </span>
  );
}
