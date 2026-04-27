"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCollection } from "@/lib/store";
import {
  Camera,
  Loader2,
  Check,
  X,
  History,
  ChevronDown,
  Image as ImageIcon,
  ImagePlus,
  Library,
} from "lucide-react";
import {
  ALBUM_BY_CODE,
  describeContext,
  stickersForContext,
  type ScanContext,
} from "@/lib/album";
import { TEAMS } from "@/lib/teams";
import type { AlbumPage } from "@/lib/supabase/types";
import { compressForUpload } from "@/lib/compressImage";

type JobStatus = "queued" | "uploading" | "scanning" | "done" | "error";

type Job = {
  id: string;
  file: File;
  previewUrl: string;
  status: JobStatus;
  error?: string;
  detected?: string[];
  contextDescription?: string;
  candidatesCount?: number;
  durationMs?: number;
  reqId?: string;
  raw?: string;
  usedReference?: boolean;
  autoIdentified?: { kind: string; teamCode?: string; teamSheet?: number; reason?: string } | null;
};

const POOL_SIZE = 1;

export default function ScanPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [running, setRunning] = useState(false);
  const [ctxKind, setCtxKind] = useState<ScanContext["kind"]>("auto");
  const [teamCode, setTeamCode] = useState<string>("ARG");
  const [teamSheet, setTeamSheet] = useState<1 | 2>(1);
  const [customId, setCustomId] = useState<string>("");
  const [customPages, setCustomPages] = useState<AlbumPage[]>([]);
  const [showDebugFor, setShowDebugFor] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const bulkAdd = useCollection((s) => s.bulkAdd);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("album_pages")
        .select("*")
        .eq("kind", "custom")
        .order("created_at", { ascending: true })
        .returns<AlbumPage[]>();
      if (!mounted) return;
      setCustomPages(data ?? []);
      if ((data?.length ?? 0) > 0 && !customId) setCustomId(data![0].id);
    })();
    return () => {
      mounted = false;
    };
  }, [customId]);

  const ctx: ScanContext = useMemo(() => {
    if (ctxKind === "team") return { kind: "team", teamCode, teamSheet };
    if (ctxKind === "custom") {
      const page = customPages.find((p) => p.id === customId);
      return {
        kind: "custom",
        customId,
        customCodes: page?.sticker_codes ?? [],
        customLabel: page?.custom_label ?? undefined,
      };
    }
    return { kind: ctxKind };
  }, [ctxKind, teamCode, teamSheet, customId, customPages]);

  const candidates = useMemo(() => stickersForContext(ctx), [ctx]);

  // Mantenemos una ref del ctx actual para que cada job al ser claimeado tome
  // el contexto vigente (por si el user cambió el dropdown durante el proceso).
  const ctxRef = useRef<ScanContext>(ctx);
  useEffect(() => {
    ctxRef.current = ctx;
  }, [ctx]);

  function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const newJobs: Job[] = Array.from(files).map((f) => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      previewUrl: URL.createObjectURL(f),
      status: "queued",
    }));
    setJobs((prev) => [...prev, ...newJobs]);
  }

  /** Reclama atómicamente el siguiente job en cola y lo marca uploading. */
  function claimNextJob(): Promise<{
    id: string;
    file: File;
    ctxSnapshot: ScanContext;
  } | null> {
    return new Promise((resolve) => {
      setJobs((prev) => {
        const j = prev.find((x) => x.status === "queued");
        if (!j) {
          resolve(null);
          return prev;
        }
        resolve({ id: j.id, file: j.file, ctxSnapshot: ctxRef.current });
        return prev.map((x) =>
          x.id === j.id ? { ...x, status: "uploading" } : x,
        );
      });
    });
  }

  async function processQueue() {
    if (running) return;
    setRunning(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setJobs((prev) =>
          prev.map((j) =>
            j.status === "queued"
              ? { ...j, status: "error", error: "Necesitás estar logueado" }
              : j,
          ),
        );
        return;
      }

      const workers = Array.from({ length: POOL_SIZE }, async () => {
        while (true) {
          const claimed = await claimNextJob();
          if (!claimed) break;
          await processJob(
            claimed.id,
            claimed.file,
            claimed.ctxSnapshot,
            supabase,
            user.id,
          );
        }
      });
      await Promise.all(workers);
    } finally {
      setRunning(false);
    }
  }

  async function processJob(
    jobId: string,
    file: File,
    snapshotCtx: ScanContext,
    supabase: ReturnType<typeof createClient>,
    userId: string,
  ) {
    const job = { id: jobId, file };

    let toUpload: File;
    try {
      const r = await compressForUpload(job.file, { maxSide: 1920, quality: 0.85 });
      toUpload = r.file;
    } catch (e) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? {
                ...j,
                status: "error",
                error:
                  "No pude leer la imagen: " +
                  (e instanceof Error ? e.message : "error"),
              }
            : j,
        ),
      );
      return;
    }

    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.jpg`;
    const { error: upErr } = await supabase.storage
      .from("album-scans")
      .upload(path, toUpload, {
        contentType: "image/jpeg",
        upsert: false,
      });
    if (upErr) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? { ...j, status: "error", error: "Subida: " + upErr.message }
            : j,
        ),
      );
      return;
    }

    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: "scanning" } : j)),
    );

    const { data: scanRow, error: insErr } = await supabase
      .from("scans")
      .insert({ user_id: userId, storage_path: path, status: "processing" })
      .select()
      .single();
    if (insErr || !scanRow) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? {
                ...j,
                status: "error",
                error: "DB: " + (insErr?.message ?? "no row"),
              }
            : j,
        ),
      );
      return;
    }

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          scanId: scanRow.id,
          storagePath: path,
          context: snapshotCtx,
        }),
      });
      const json = (await res.json()) as
        | {
            reqId: string;
            detected: string[];
            contextDescription: string;
            candidatesCount: number;
            durationMs: number;
            raw: string;
            usedReference: boolean;
            referencesCount?: number;
            detectedSheet?: 1 | 2;
            autoIdentified?: {
              kind: string;
              teamCode?: string;
              teamSheet?: number;
              reason?: string;
            } | null;
          }
        | { error: string; reqId?: string };

      if (!res.ok || "error" in json) {
        const msg = "error" in json ? json.error : "error";
        const rid = "reqId" in json && json.reqId ? ` (req ${json.reqId})` : "";
        setJobs((prev) =>
          prev.map((j) =>
            j.id === jobId ? { ...j, status: "error", error: msg + rid } : j,
          ),
        );
        return;
      }

      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? {
                ...j,
                status: "done",
                detected: json.detected,
                contextDescription: json.contextDescription,
                candidatesCount: json.candidatesCount,
                durationMs: json.durationMs,
                reqId: json.reqId,
                raw: json.raw,
                usedReference: json.usedReference,
                autoIdentified: json.autoIdentified ?? null,
              }
            : j,
        ),
      );
    } catch (e) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? {
                ...j,
                status: "error",
                error: e instanceof Error ? e.message : "fetch error",
              }
            : j,
        ),
      );
    }
  }

  const queuedCount = jobs.filter((j) => j.status === "queued").length;
  const inProgressCount = jobs.filter(
    (j) => j.status === "uploading" || j.status === "scanning",
  ).length;
  const doneCount = jobs.filter((j) => j.status === "done").length;
  const errorCount = jobs.filter((j) => j.status === "error").length;
  const totalProcessable = jobs.filter((j) => j.status !== "queued").length;
  const allDetected = useMemo(() => {
    const set = new Set<string>();
    for (const j of jobs) {
      if (j.status === "done" && j.detected) {
        for (const c of j.detected) set.add(c);
      }
    }
    return Array.from(set).sort();
  }, [jobs]);

  async function applyAll() {
    if (allDetected.length === 0) return;
    await bulkAdd(allDetected);
    alert(
      `Se marcaron ${allDetected.length} figuritas distintas como "tengo".`,
    );
    setJobs([]);
  }

  // Auto-arranca el procesamiento apenas hay fotos en cola
  useEffect(() => {
    if (queuedCount > 0 && !running) {
      processQueue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queuedCount, running]);

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-32">
      <header className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Camera className="w-6 h-6" /> Escanear álbum
          </h1>
          <p className="text-sm text-[color:var(--muted)] mt-1">
            Subí todas las fotos juntas. La IA identifica cada página sola.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href="/scan/referencias"
            className="btn btn-secondary text-xs !px-2 !py-1"
            title="Páginas de referencia"
          >
            <Library className="w-4 h-4" />
          </Link>
          <Link
            href="/scan/historial"
            className="btn btn-secondary text-xs !px-2 !py-1"
            title="Historial"
          >
            <History className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <div className="card mt-4 !p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-sm">
            {ctxKind === "auto"
              ? "Modo automático"
              : "Forzar página manualmente"}
          </h2>
          <button
            onClick={() =>
              setCtxKind(ctxKind === "auto" ? "team" : "auto")
            }
            className="text-[11px] text-[color:var(--primary)] underline"
          >
            {ctxKind === "auto" ? "Forzar manual" : "Volver a Auto"}
          </button>
        </div>
        <p className="text-xs text-[color:var(--muted)] mt-1 mb-3">
          {ctxKind === "auto"
            ? "Subí cualquier foto: la IA detecta sola qué página es y qué figuritas hay pegadas."
            : "Elegí qué página estás escaneando. Útil cuando la IA falla en identificar."}
        </p>

        {ctxKind !== "auto" && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { v: "team", label: "Selección" },
              { v: "coca_cola", label: "Coca-Cola" },
              { v: "fwc", label: "FWC specials" },
              { v: "intro", label: "Portada (00)" },
              { v: "custom", label: "Hoja custom" },
            ].map((opt) => (
              <button
                key={opt.v}
                onClick={() => setCtxKind(opt.v as ScanContext["kind"])}
                className={`text-xs px-3 py-2 rounded-lg border transition ${
                  ctxKind === opt.v
                    ? "bg-[color:var(--primary)] border-[color:var(--primary)] text-black font-bold"
                    : "border-[color:var(--card-border)] text-[color:var(--fg)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {ctxKind === "team" && (
          <div className="space-y-2">
            <select
              value={teamCode}
              onChange={(e) => setTeamCode(e.target.value)}
              className="w-full rounded-lg bg-[color:var(--card-bg)] border border-[color:var(--card-border)] px-3 py-2 text-sm"
            >
              {TEAMS.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.flag} {t.name} (Grupo {t.group})
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              {[1, 2].map((sheet) => (
                <button
                  key={sheet}
                  onClick={() => setTeamSheet(sheet as 1 | 2)}
                  className={`text-xs px-3 py-2 rounded-lg border transition ${
                    teamSheet === sheet
                      ? "bg-[color:var(--primary)] border-[color:var(--primary)] text-black font-bold"
                      : "border-[color:var(--card-border)] text-[color:var(--fg)]"
                  }`}
                >
                  {sheet === 1
                    ? `Hoja 1 (${teamCode}1–${teamCode}10)`
                    : `Hoja 2 (${teamCode}11–${teamCode}20)`}
                </button>
              ))}
            </div>
          </div>
        )}

        {ctxKind === "custom" &&
          (customPages.length === 0 ? (
            <div className="text-xs text-[color:var(--muted)]">
              Todavía no creaste hojas custom.{" "}
              <Link
                href="/scan/referencias"
                className="text-[color:var(--primary)] underline"
              >
                Crear ahora
              </Link>
            </div>
          ) : (
            <select
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              className="w-full rounded-lg bg-[color:var(--card-bg)] border border-[color:var(--card-border)] px-3 py-2 text-sm"
            >
              {customPages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.custom_label ?? "Hoja sin nombre"} ·{" "}
                  {p.sticker_codes.length} cromos
                </option>
              ))}
            </select>
          ))}

        <p className="text-[11px] text-[color:var(--muted)] mt-2">
          {describeContext(ctx)} · {candidates.length} figuritas posibles
          {candidates.length > 0 &&
            ctxKind !== "auto" &&
            ` (${candidates[0].code}–${candidates[candidates.length - 1].code})`}
        </p>
      </div>

      <div className="card mt-3 !p-4">
        <p className="text-sm font-semibold mb-2">Agregar fotos</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={running}
            className="btn btn-primary disabled:opacity-50"
          >
            <Camera className="w-4 h-4" /> Cámara
          </button>
          <button
            onClick={() => galleryInputRef.current?.click()}
            disabled={running}
            className="btn btn-secondary disabled:opacity-50"
          >
            <ImagePlus className="w-4 h-4" /> Galería
          </button>
        </div>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="text-[11px] text-[color:var(--muted)] mt-2">
          Podés agregar varias y se procesan en cola, una por una.
        </p>
      </div>

      {jobs.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold flex items-center gap-2">
                {running && <Loader2 className="w-4 h-4 animate-spin" />}
                {totalProcessable} de {jobs.length} procesadas
              </p>
              <p className="text-[11px] text-[color:var(--muted)]">
                {queuedCount > 0 && `${queuedCount} en cola · `}
                {inProgressCount > 0 && `${inProgressCount} en proceso · `}
                {doneCount} OK
                {errorCount > 0 && ` · ${errorCount} error`}
              </p>
            </div>
            <button
              onClick={() => setJobs([])}
              disabled={running}
              className="text-xs text-[color:var(--muted)] disabled:opacity-50"
            >
              Limpiar
            </button>
          </div>

          <div className="h-1.5 bg-[color:var(--card-border)] rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-[color:var(--primary)] transition-all"
              style={{
                width: `${jobs.length === 0 ? 0 : (totalProcessable / jobs.length) * 100}%`,
              }}
            />
          </div>

          <ul className="space-y-3">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onRemove={() =>
                  setJobs((prev) => prev.filter((j) => j.id !== job.id))
                }
                showDebug={showDebugFor === job.id}
                onToggleDebug={() =>
                  setShowDebugFor((cur) => (cur === job.id ? null : job.id))
                }
              />
            ))}
          </ul>

          {allDetected.length > 0 && (
            <div className="card mt-4 !p-4 sticky bottom-20">
              <p className="text-sm">
                Total detectado: <b>{allDetected.length}</b> figuritas únicas.
              </p>
              <button
                onClick={applyAll}
                className="btn btn-primary mt-2 w-full"
              >
                <Check className="w-4 h-4" /> Marcar todas como tengo
              </button>
            </div>
          )}
        </div>
      )}

      {jobs.length === 0 && (
        <div className="card mt-3 text-center !p-6">
          <ImageIcon className="w-12 h-12 mx-auto text-[color:var(--muted)]" />
          <p className="mt-3 text-sm text-[color:var(--muted)]">
            Todavía no agregaste ninguna foto.
          </p>
        </div>
      )}
    </div>
  );
}

function JobCard({
  job,
  onRemove,
  showDebug,
  onToggleDebug,
}: {
  job: Job;
  onRemove: () => void;
  showDebug: boolean;
  onToggleDebug: () => void;
}) {
  return (
    <li className="card !p-3">
      <div className="flex gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={job.previewUrl}
          alt=""
          className="w-20 h-20 rounded-lg object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <StatusPill status={job.status} />
            {job.status !== "uploading" && job.status !== "scanning" && (
              <button
                onClick={onRemove}
                className="text-[color:var(--muted)]"
                title="Quitar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {job.status === "queued" && (
            <p className="text-xs text-[color:var(--muted)] mt-1 truncate">
              {job.file.name}
            </p>
          )}
          {(job.status === "uploading" || job.status === "scanning") && (
            <p className="text-xs text-[color:var(--muted)] mt-1 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              {job.status === "uploading" ? "Subiendo..." : "IA mirando..."}
            </p>
          )}
          {job.status === "error" && (
            <p className="text-xs text-[color:var(--accent)] mt-1 break-words">
              {job.error}
            </p>
          )}
          {job.status === "done" && (
            <>
              <p className="text-xs mt-1">
                <b>{job.detected?.length ?? 0}</b> figuritas detectadas
              </p>
              <p className="text-[11px] text-[color:var(--muted)] truncate">
                {job.contextDescription}
                {job.usedReference ? " · con referencia" : ""}
              </p>
              {job.autoIdentified && (
                <p className="text-[11px] text-[color:var(--primary)] truncate">
                  IA detectó: {job.autoIdentified.kind}
                  {job.autoIdentified.teamCode
                    ? ` ${job.autoIdentified.teamCode}`
                    : ""}
                  {job.autoIdentified.teamSheet
                    ? ` h${job.autoIdentified.teamSheet}`
                    : ""}
                </p>
              )}
              {(job.detected?.length ?? 0) > 0 && (
                <p className="text-[11px] mt-1 line-clamp-2">
                  {job.detected!
                    .slice(0, 8)
                    .map(
                      (c) => `${c} ${ALBUM_BY_CODE[c]?.name ?? ""}`.trim(),
                    )
                    .join(" · ")}
                  {(job.detected?.length ?? 0) > 8
                    ? ` · +${(job.detected?.length ?? 0) - 8}`
                    : ""}
                </p>
              )}
              <button
                onClick={onToggleDebug}
                className="mt-1 text-[10px] text-[color:var(--muted)] flex items-center gap-1"
              >
                <ChevronDown
                  className={`w-3 h-3 transition ${showDebug ? "rotate-180" : ""}`}
                />
                {showDebug ? "Ocultar" : "Ver"} detalles
              </button>
            </>
          )}
        </div>
      </div>

      {job.status === "done" && showDebug && (
        <div className="mt-2 pt-2 border-t border-[color:var(--card-border)] text-[10px] font-mono space-y-0.5">
          <div>reqId: {job.reqId}</div>
          <div>duración: {job.durationMs}ms</div>
          <div>candidatos: {job.candidatesCount}</div>
          <div>referencia: {job.usedReference ? "sí" : "no"}</div>
          <details className="mt-1">
            <summary className="cursor-pointer text-[color:var(--muted)]">
              raw response
            </summary>
            <pre className="mt-1 whitespace-pre-wrap break-all max-h-40 overflow-auto">
              {job.raw}
            </pre>
          </details>
        </div>
      )}
    </li>
  );
}

function StatusPill({ status }: { status: JobStatus }) {
  const map: Record<JobStatus, { label: string; cls: string }> = {
    queued: { label: "en cola", cls: "bg-yellow-500/15 text-yellow-400" },
    uploading: { label: "subiendo", cls: "bg-blue-500/15 text-blue-400" },
    scanning: { label: "analizando", cls: "bg-purple-500/15 text-purple-400" },
    done: { label: "OK", cls: "bg-emerald-500/15 text-emerald-400" },
    error: { label: "error", cls: "bg-red-500/15 text-red-400" },
  };
  const m = map[status];
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${m.cls}`}>
      {m.label}
    </span>
  );
}
