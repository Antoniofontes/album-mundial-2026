/**
 * Comprime y convierte una imagen del cliente a JPEG antes de subirla.
 * - Resuelve HEIC del iPhone (Safari iOS los puede dibujar en canvas, y
 *   acá los exportamos como JPEG estándar).
 * - Reescala a máximo `maxSide` px del lado mayor.
 * - Comprime a JPEG con la calidad indicada.
 *
 * Si el archivo ya es JPEG y pesa < 1.5MB, no toca nada.
 */
export async function compressForUpload(
  file: File,
  opts: { maxSide?: number; quality?: number } = {},
): Promise<{ file: File; original: { sizeKb: number }; compressed: { sizeKb: number; width: number; height: number } }> {
  const maxSide = opts.maxSide ?? 1920;
  const quality = opts.quality ?? 0.85;

  const originalKb = Math.round(file.size / 1024);

  const looksHeic =
    /heic|heif/i.test(file.type) || /\.heic$|\.heif$/i.test(file.name);
  const isJpegLike = /jpeg|jpg/i.test(file.type) && !looksHeic;
  if (isJpegLike && file.size < 1.5 * 1024 * 1024) {
    return {
      file,
      original: { sizeKb: originalKb },
      compressed: { sizeKb: originalKb, width: 0, height: 0 },
    };
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;
    if (!width || !height) {
      throw new Error("no pude leer las dimensiones");
    }
    const longest = Math.max(width, height);
    if (longest > maxSide) {
      const scale = maxSide / longest;
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no se pudo crear el canvas");
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob) throw new Error("toBlob falló");

    const newName = replaceExt(file.name || "scan", "jpg");
    const newFile = new File([blob], newName, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
    return {
      file: newFile,
      original: { sizeKb: originalKb },
      compressed: { sizeKb: Math.round(blob.size / 1024), width, height },
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(
        new Error(
          "no pude cargar la imagen (¿formato no soportado por el navegador?)",
        ),
      );
    img.src = src;
  });
}

function replaceExt(name: string, ext: string) {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  return `${base}.${ext}`;
}
