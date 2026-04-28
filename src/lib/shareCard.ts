export type CardFormat = "square" | "stories";

export interface ShareCardOpts {
  name: string;
  username: string;
  owned: number;
  total: number;
  hostname: string;
  format: CardFormat;
}

export function getCardSize(format: CardFormat): { w: number; h: number } {
  return format === "stories" ? { w: 1080, h: 1920 } : { w: 1080, h: 1080 };
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

export function drawShareCard(
  ctx: CanvasRenderingContext2D,
  opts: ShareCardOpts,
): void {
  const { name, username, owned, total, hostname } = opts;
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const pct = Math.round((owned / total) * 100);
  const unit = Math.min(w, h);
  const midX = w / 2;
  const isStories = h > w;

  // --- Background ---
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#0b0d12";
  ctx.fillRect(0, 0, w, h);

  // Green radial glow (top-left)
  const gGreen = ctx.createRadialGradient(
    w * 0.15, h * 0.18, 0,
    w * 0.15, h * 0.18, w * 0.9,
  );
  gGreen.addColorStop(0, "rgba(0,176,79,0.30)");
  gGreen.addColorStop(1, "transparent");
  ctx.fillStyle = gGreen;
  ctx.fillRect(0, 0, w, h);

  // Pink radial glow (bottom-right)
  const gPink = ctx.createRadialGradient(
    w * 0.88, h * 0.88, 0,
    w * 0.88, h * 0.88, w * 0.7,
  );
  gPink.addColorStop(0, "rgba(255,51,102,0.18)");
  gPink.addColorStop(1, "transparent");
  ctx.fillStyle = gPink;
  ctx.fillRect(0, 0, w, h);

  // Decorative concentric arcs (bottom-right corner)
  const arcCx = w * 1.05;
  const arcCy = h * 1.05;
  for (const [scale, alpha] of [
    [0.9, 0.07],
    [0.68, 0.06],
    [0.46, 0.05],
  ] as [number, number][]) {
    ctx.beginPath();
    ctx.arc(arcCx, arcCy, unit * scale, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0,176,79,${alpha})`;
    ctx.lineWidth = unit * 0.022;
    ctx.stroke();
  }

  // --- Content ---
  const startY = isStories ? h * 0.3 : h * 0.22;

  // "⚽ MUNDIAL 2026"
  ctx.textAlign = "center";
  ctx.font = `600 ${unit * 0.046}px system-ui,-apple-system,sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillText("⚽  MUNDIAL 2026", midX, startY);

  // Big owned number
  ctx.font = `900 ${unit * 0.25}px system-ui,-apple-system,sans-serif`;
  ctx.fillStyle = "#00b04f";
  ctx.fillText(String(owned), midX, startY + unit * 0.3);

  // "de 994 figuritas"
  ctx.font = `500 ${unit * 0.058}px system-ui,-apple-system,sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText(`de ${total} figuritas`, midX, startY + unit * 0.4);

  // Progress bar
  const barY = startY + unit * 0.5;
  const barH = unit * 0.044;
  const barW = w * 0.72;
  const barX = (w - barW) / 2;
  const barR = barH / 2;

  // Track
  ctx.beginPath();
  roundRect(ctx, barX, barY, barW, barH, barR);
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.fill();

  // Fill
  const fillW = Math.max(barW * (owned / total), barR * 2);
  const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  grad.addColorStop(0, "#00b04f");
  grad.addColorStop(0.65, "#50c878");
  grad.addColorStop(1, "#d4af37");
  ctx.beginPath();
  roundRect(ctx, barX, barY, fillW, barH, barR);
  ctx.fillStyle = grad;
  ctx.fill();

  // Percentage
  ctx.font = `700 ${unit * 0.054}px system-ui,-apple-system,sans-serif`;
  ctx.fillStyle = "#d4af37";
  ctx.fillText(`${pct}% completado`, midX, barY + barH + unit * 0.08);

  // Separator line
  const sepY = barY + barH + unit * 0.18;
  ctx.beginPath();
  ctx.moveTo(w * 0.3, sepY);
  ctx.lineTo(w * 0.7, sepY);
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Display name
  ctx.font = `700 ${unit * 0.068}px system-ui,-apple-system,sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(truncate(name, 22), midX, sepY + unit * 0.105);

  // @username
  ctx.font = `500 ${unit * 0.047}px system-ui,-apple-system,sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillText(`@${username}`, midX, sepY + unit * 0.185);

  // Domain watermark
  ctx.font = `400 ${unit * 0.038}px system-ui,-apple-system,sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.fillText(hostname, midX, h - unit * 0.055);
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/png",
    );
  });
}
