import sharp from "sharp";
import { writeFile } from "node:fs/promises";

// SVG del icono de la app
const ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#00b04f"/>
      <stop offset="100%" stop-color="#008a3e"/>
    </linearGradient>
    <linearGradient id="cup" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff8d6"/>
      <stop offset="100%" stop-color="#d4af37"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <!-- Trofeo -->
  <g transform="translate(96 56)">
    <path d="M64 32 H256 V120 Q256 192 160 200 Q64 192 64 120 Z" fill="url(#cup)"/>
    <path d="M40 60 Q-8 60 0 110 Q12 156 56 156" stroke="url(#cup)" stroke-width="20" fill="none" stroke-linecap="round"/>
    <path d="M280 60 Q328 60 320 110 Q308 156 264 156" stroke="url(#cup)" stroke-width="20" fill="none" stroke-linecap="round"/>
    <rect x="120" y="200" width="80" height="40" rx="6" fill="url(#cup)"/>
    <rect x="80" y="240" width="160" height="32" rx="10" fill="url(#cup)"/>
  </g>
  <!-- Texto 26 -->
  <text x="256" y="430" font-family="Arial Black, sans-serif" font-weight="900"
        font-size="120" fill="white" text-anchor="middle">26</text>
</svg>
`;

const MASKABLE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#00b04f"/>
      <stop offset="100%" stop-color="#008a3e"/>
    </linearGradient>
    <linearGradient id="cup2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff8d6"/>
      <stop offset="100%" stop-color="#d4af37"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg2)"/>
  <g transform="translate(160 110)">
    <path d="M40 20 H160 V75 Q160 120 100 125 Q40 120 40 75 Z" fill="url(#cup2)"/>
    <rect x="75" y="125" width="50" height="25" rx="4" fill="url(#cup2)"/>
    <rect x="55" y="150" width="90" height="20" rx="6" fill="url(#cup2)"/>
  </g>
  <text x="256" y="380" font-family="Arial Black, sans-serif" font-weight="900"
        font-size="100" fill="white" text-anchor="middle">26</text>
</svg>
`;

await sharp(Buffer.from(ICON_SVG))
  .resize(192, 192)
  .png()
  .toFile("public/icons/icon-192.png");

await sharp(Buffer.from(ICON_SVG))
  .resize(512, 512)
  .png()
  .toFile("public/icons/icon-512.png");

await sharp(Buffer.from(MASKABLE_SVG))
  .resize(512, 512)
  .png()
  .toFile("public/icons/icon-maskable-512.png");

await sharp(Buffer.from(ICON_SVG))
  .resize(180, 180)
  .png()
  .toFile("public/icons/apple-touch-icon.png");

await sharp(Buffer.from(ICON_SVG))
  .resize(32, 32)
  .png()
  .toFile("public/favicon-32.png");

await writeFile("src/app/icon.svg", ICON_SVG);
console.log("✅ Iconos generados.");
