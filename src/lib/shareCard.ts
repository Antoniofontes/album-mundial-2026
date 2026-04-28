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

function filledRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
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
  const progress = Math.min(owned / total, 1);

  ctx.clearRect(0, 0, w, h);

  // ── Background: deep navy → dark teal gradient ──
  const bg = ctx.createLinearGradient(0, 0, w * 0.6, h);
  bg.addColorStop(0, "#050c18");
  bg.addColorStop(0.5, "#071612");
  bg.addColorStop(1, "#06091a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Green radial glow at top-center
  const gGreen = ctx.createRadialGradient(midX, 0, 0, midX, 0, h * 0.65);
  gGreen.addColorStop(0, "rgba(0,176,79,0.28)");
  gGreen.addColorStop(1, "transparent");
  ctx.fillStyle = gGreen;
  ctx.fillRect(0, 0, w, h);

  // Gold radial glow at bottom
  const gGold = ctx.createRadialGradient(midX, h, 0, midX, h, unit * 0.7);
  gGold.addColorStop(0, "rgba(212,175,55,0.14)");
  gGold.addColorStop(1, "transparent");
  ctx.fillStyle = gGold;
  ctx.fillRect(0, 0, w, h);

  // Subtle dot grid texture
  const dotSpacing = unit * 0.057;
  const dotR = unit * 0.0015;
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  for (let dx = dotSpacing * 0.5; dx < w; dx += dotSpacing) {
    for (let dy = dotSpacing * 0.5; dy < h; dy += dotSpacing) {
      ctx.beginPath();
      ctx.arc(dx, dy, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Layout anchors ──
  const badgeCY    = isStories ? h * 0.115 : h * 0.1;
  const ringCY     = isStories ? h * 0.36  : h * 0.43;
  const ringRadius = unit * 0.245;
  const ringStroke = unit * 0.027;

  // ── TOP BADGE "FIFA WORLD CUP 2026" ──
  const badgeFontSz = unit * 0.038;
  ctx.font = `700 ${badgeFontSz}px system-ui,-apple-system,sans-serif`;
  const badgeLabel = "FIFA WORLD CUP 2026";
  const labelW = ctx.measureText(badgeLabel).width;
  const bpx = unit * 0.04;
  const bpy = unit * 0.02;
  const bW = labelW + bpx * 2;
  const bH = badgeFontSz + bpy * 2;
  const bX = midX - bW / 2;
  const bY = badgeCY - bH / 2;

  filledRoundRect(ctx, bX, bY, bW, bH, bH / 2);
  ctx.fillStyle = "rgba(0,176,79,0.18)";
  ctx.fill();
  ctx.strokeStyle = "rgba(0,200,90,0.35)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const badgeTextGrad = ctx.createLinearGradient(bX, 0, bX + bW, 0);
  badgeTextGrad.addColorStop(0, "#55eea0");
  badgeTextGrad.addColorStop(1, "#d4af37");
  ctx.fillStyle = badgeTextGrad;
  ctx.textAlign = "center";
  ctx.fillText(badgeLabel, midX, bY + bH * 0.72);

  // ── CIRCULAR PROGRESS RING ──
  const startAngle = -Math.PI / 2;

  // Track
  ctx.beginPath();
  ctx.arc(midX, ringCY, ringRadius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = ringStroke;
  ctx.lineCap = "butt";
  ctx.stroke();

  if (progress > 0) {
    // Outer glow (wider, low opacity)
    ctx.beginPath();
    ctx.arc(midX, ringCY, ringRadius, startAngle, startAngle + Math.PI * 2 * progress);
    ctx.strokeStyle = "rgba(0,220,100,0.12)";
    ctx.lineWidth = ringStroke * 2.8;
    ctx.lineCap = "round";
    ctx.stroke();

    // Main arc with gradient
    const arcGrad = ctx.createLinearGradient(
      midX - ringRadius, ringCY,
      midX + ringRadius, ringCY,
    );
    arcGrad.addColorStop(0, "#00b04f");
    arcGrad.addColorStop(0.55, "#40dd80");
    arcGrad.addColorStop(1, "#d4af37");

    ctx.beginPath();
    ctx.arc(midX, ringCY, ringRadius, startAngle, startAngle + Math.PI * 2 * progress);
    ctx.strokeStyle = arcGrad;
    ctx.lineWidth = ringStroke;
    ctx.lineCap = "round";
    ctx.stroke();

    // Gold dot at arc tip
    const tipAngle = startAngle + Math.PI * 2 * progress;
    const tipX = midX + Math.cos(tipAngle) * ringRadius;
    const tipY = ringCY + Math.sin(tipAngle) * ringRadius;
    ctx.beginPath();
    ctx.arc(tipX, tipY, ringStroke * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = "#d4af37";
    ctx.fill();
    // Glow around dot
    const dotGlow = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, ringStroke * 1.5);
    dotGlow.addColorStop(0, "rgba(212,175,55,0.5)");
    dotGlow.addColorStop(1, "transparent");
    ctx.fillStyle = dotGlow;
    ctx.beginPath();
    ctx.arc(tipX, tipY, ringStroke * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Number inside ring ──
  const numFontSz = ringRadius * 0.74;
  ctx.textAlign = "center";
  ctx.font = `900 ${numFontSz}px system-ui,-apple-system,sans-serif`;
  ctx.fillStyle = "#ffffff";
  const numBaseline = ringCY + numFontSz * 0.25;
  ctx.fillText(String(owned), midX, numBaseline);

  const subFontSz = ringRadius * 0.22;
  ctx.font = `400 ${subFontSz}px system-ui,-apple-system,sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillText(`de ${total}`, midX, numBaseline + subFontSz * 1.5);

  // ── Percentage label ──
  const pctY = ringCY + ringRadius + unit * 0.1;
  const pctFontSz = unit * 0.052;
  ctx.font = `700 ${pctFontSz}px system-ui,-apple-system,sans-serif`;
  const pctGrad = ctx.createLinearGradient(midX - unit * 0.2, 0, midX + unit * 0.2, 0);
  pctGrad.addColorStop(0, "#d4af37");
  pctGrad.addColorStop(1, "#f0d060");
  ctx.fillStyle = pctGrad;
  ctx.fillText(`${pct}% completado`, midX, pctY);

  // ── Name card (frosted glass effect) ──
  const cardGap  = unit * 0.09;
  const cardH    = unit * 0.21;
  const cardW    = w * 0.76;
  const cardX    = (w - cardW) / 2;
  const cardY    = isStories ? h * 0.66 : pctY + cardGap;
  const cardRad  = unit * 0.035;

  filledRoundRect(ctx, cardX, cardY, cardW, cardH, cardRad);
  ctx.fillStyle = "rgba(255,255,255,0.055)";
  ctx.fill();

  // Subtle border gradient (top brighter, bottom dimmer)
  ctx.strokeStyle = "rgba(255,255,255,0.11)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Top-left bright highlight line on card
  ctx.beginPath();
  ctx.moveTo(cardX + cardRad, cardY);
  ctx.lineTo(cardX + cardW - cardRad, cardY);
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1;
  ctx.stroke();

  const nameY = cardY + cardH * 0.46;
  ctx.font = `700 ${unit * 0.065}px system-ui,-apple-system,sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(truncate(name, 20), midX, nameY);

  ctx.font = `400 ${unit * 0.042}px system-ui,-apple-system,sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.fillText(`@${username}`, midX, cardY + cardH * 0.79);

  // ── Domain watermark ──
  ctx.font = `400 ${unit * 0.034}px system-ui,-apple-system,sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.fillText(hostname, midX, h - unit * 0.035);
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/png",
    );
  });
}
