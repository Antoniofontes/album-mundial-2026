import { TEAMS } from "./teams";

/**
 * Modelo real del álbum Panini "FIFA World Cup 2026".
 *
 * Cada sticker tiene un CÓDIGO impreso (string), no un número global.
 * Categorías:
 *   - 48 selecciones × 20 stickers = 960
 *       Por equipo se numeran <CODE>1 … <CODE>20:
 *         · <CODE>1   = escudo de la selección                 (hoja 1)
 *         · <CODE>2..10 = 9 jugadores                            (hoja 1)
 *         · <CODE>11..12 = 2 jugadores                           (hoja 2)
 *         · <CODE>13  = foto grupal del equipo                  (hoja 2)
 *         · <CODE>14..20 = 7 jugadores                           (hoja 2)
 *       Hoja 1 trae 10 stickers, hoja 2 trae 10 stickers.
 *   - Portada: "00"                                              1
 *   - FIFA World Cup specials: FWC1..FWC19                      19
 *   - Coca-Cola: CC1..CC14                                       14
 *
 * Total: 994 stickers.
 */

export type StickerType =
  | "team_logo" // escudo de selección (<CODE>1)
  | "team_photo" // foto grupal del equipo (<CODE>13)
  | "player" // jugador
  | "coca_cola" // exclusivos Coca-Cola (CC1..CC14)
  | "fwc" // FIFA World Cup specials (FWC1..FWC19)
  | "intro"; // portada (00)

export type Sticker = {
  /** Código impreso en el sticker (identificador real). Ej: "ARG12", "FWC3", "CC7", "00". */
  code: string;
  /** Tipo de figurita */
  type: StickerType;
  /** Equipo asociado (sólo para team_logo, team_photo, player). */
  team?: string;
  /** Número dentro del equipo (1..20). Solo para tipos de equipo. */
  teamNumber?: number;
  /** Nombre / etiqueta humana */
  name: string;
  /** Posición o rol opcional */
  role?: string;
  /** Si la figurita es brillante / foil / premium. */
  premium?: boolean;
};

const COCA_COLA_PLAYERS: { team: string; name: string }[] = [
  { team: "CAN", name: "Alphonso Davies" },
  { team: "USA", name: "Antonee Robinson" },
  { team: "MEX", name: "Edson Álvarez" },
  { team: "BRA", name: "Gabriel Magalhães" },
  { team: "ENG", name: "Harry Kane" },
  { team: "COL", name: "Jefferson Lerma" },
  { team: "GER", name: "Joshua Kimmich" },
  { team: "ESP", name: "Lamine Yamal" },
  { team: "ARG", name: "Lautaro Martínez" },
  { team: "MEX", name: "Santiago Giménez" },
  { team: "NED", name: "Virgil van Dijk" },
  { team: "USA", name: "Weston McKennie" },
  { team: "POR", name: "Cristiano Ronaldo" },
  { team: "FRA", name: "Kylian Mbappé" },
];

/** Plantilla de roles tentativos por equipo (18 jugadores) */
const ROLES_18 = [
  "Arquero 1",
  "Arquero 2",
  "Defensor 1",
  "Defensor 2",
  "Defensor 3",
  "Defensor 4",
  "Defensor 5",
  "Mediocampista 1",
  "Mediocampista 2",
  "Mediocampista 3",
  "Mediocampista 4",
  "Mediocampista 5",
  "Mediocampista 6",
  "Delantero 1",
  "Delantero 2",
  "Delantero 3",
  "Delantero 4",
  "Capitán",
];

/**
 * Plantillas tentativas para selecciones top (Apr 2026).
 * Sólo son default. El sistema permite editarlas en runtime.
 */
const KNOWN_SQUADS: Record<string, string[]> = {
  ARG: [
    "Emiliano Martínez",
    "Gerónimo Rulli",
    "Nahuel Molina",
    "Cristian Romero",
    "Nicolás Otamendi",
    "Lisandro Martínez",
    "Nicolás Tagliafico",
    "Rodrigo De Paul",
    "Enzo Fernández",
    "Alexis Mac Allister",
    "Giovani Lo Celso",
    "Leandro Paredes",
    "Thiago Almada",
    "Ángel Di María",
    "Julián Álvarez",
    "Lautaro Martínez",
    "Alejandro Garnacho",
    "Lionel Messi",
  ],
  BRA: [
    "Alisson",
    "Ederson",
    "Danilo",
    "Marquinhos",
    "Gabriel Magalhães",
    "Éder Militão",
    "Wendell",
    "Casemiro",
    "Bruno Guimarães",
    "Lucas Paquetá",
    "Rodrygo",
    "Raphinha",
    "Gabriel Martinelli",
    "Vinicius Jr.",
    "Endrick",
    "Richarlison",
    "Gabriel Jesus",
    "Neymar Jr.",
  ],
  FRA: [
    "Mike Maignan",
    "Brice Samba",
    "Jules Koundé",
    "William Saliba",
    "Dayot Upamecano",
    "Ibrahima Konaté",
    "Théo Hernández",
    "Aurélien Tchouaméni",
    "Eduardo Camavinga",
    "Adrien Rabiot",
    "Antoine Griezmann",
    "Warren Zaïre-Emery",
    "N'Golo Kanté",
    "Ousmane Dembélé",
    "Marcus Thuram",
    "Bradley Barcola",
    "Randal Kolo Muani",
    "Kylian Mbappé",
  ],
  ESP: [
    "Unai Simón",
    "David Raya",
    "Dani Carvajal",
    "Aymeric Laporte",
    "Robin Le Normand",
    "Pau Cubarsí",
    "Marc Cucurella",
    "Rodri",
    "Pedri",
    "Fabián Ruiz",
    "Mikel Merino",
    "Martín Zubimendi",
    "Dani Olmo",
    "Nico Williams",
    "Lamine Yamal",
    "Mikel Oyarzabal",
    "Álvaro Morata",
    "Ferran Torres",
  ],
  ENG: [
    "Jordan Pickford",
    "Aaron Ramsdale",
    "Kyle Walker",
    "John Stones",
    "Marc Guéhi",
    "Ezri Konsa",
    "Luke Shaw",
    "Declan Rice",
    "Jude Bellingham",
    "Conor Gallagher",
    "Cole Palmer",
    "Phil Foden",
    "Bukayo Saka",
    "Jarrod Bowen",
    "Anthony Gordon",
    "Ollie Watkins",
    "Marcus Rashford",
    "Harry Kane",
  ],
  POR: [
    "Diogo Costa",
    "Rui Patrício",
    "João Cancelo",
    "Pepe",
    "Rúben Dias",
    "António Silva",
    "Nuno Mendes",
    "Bernardo Silva",
    "João Palhinha",
    "Vitinha",
    "Rúben Neves",
    "Bruno Fernandes",
    "Rafael Leão",
    "João Félix",
    "Diogo Jota",
    "Pedro Neto",
    "Gonçalo Ramos",
    "Cristiano Ronaldo",
  ],
  GER: [
    "Manuel Neuer",
    "Marc-André ter Stegen",
    "Joshua Kimmich",
    "Antonio Rüdiger",
    "Jonathan Tah",
    "Nico Schlotterbeck",
    "David Raum",
    "Toni Kroos",
    "İlkay Gündoğan",
    "Robert Andrich",
    "Pascal Groß",
    "Jamal Musiala",
    "Florian Wirtz",
    "Leroy Sané",
    "Serge Gnabry",
    "Kai Havertz",
    "Niclas Füllkrug",
    "Thomas Müller",
  ],
};

export function buildAlbum(): Sticker[] {
  const stickers: Sticker[] = [];

  // 1) Selecciones: 48 × 20 = 960
  for (const team of TEAMS) {
    const squad = KNOWN_SQUADS[team.code];
    let playerIdx = 0;
    for (let n = 1; n <= 20; n++) {
      const code = `${team.code}${n}`;
      if (n === 1) {
        stickers.push({
          code,
          type: "team_logo",
          team: team.code,
          teamNumber: n,
          name: `Escudo ${team.name}`,
          premium: true,
        });
        continue;
      }
      if (n === 13) {
        stickers.push({
          code,
          type: "team_photo",
          team: team.code,
          teamNumber: n,
          name: `Foto grupal ${team.name}`,
        });
        continue;
      }
      const playerName =
        squad?.[playerIdx] ?? `${team.name} - Jugador ${playerIdx + 1}`;
      const role = ROLES_18[playerIdx];
      stickers.push({
        code,
        type: "player",
        team: team.code,
        teamNumber: n,
        name: playerName,
        role,
        premium: playerIdx === 17,
      });
      playerIdx++;
    }
  }

  // 2) Portada / intro: "00"
  stickers.push({
    code: "00",
    type: "intro",
    name: "Portada",
    premium: true,
  });

  // 3) FIFA World Cup specials: FWC1..FWC19
  for (let i = 1; i <= 19; i++) {
    stickers.push({
      code: `FWC${i}`,
      type: "fwc",
      name: `FIFA World Cup ${i}`,
      premium: true,
    });
  }

  // 4) Coca-Cola: CC1..CC14
  for (let i = 1; i <= 14; i++) {
    const cc = COCA_COLA_PLAYERS[i - 1];
    stickers.push({
      code: `CC${i}`,
      type: "coca_cola",
      team: cc?.team,
      name: cc?.name ?? `Coca-Cola ${i}`,
      role: "Edición Coca-Cola",
      premium: true,
    });
  }

  return stickers;
}

export const ALBUM: Sticker[] = buildAlbum();

export const ALBUM_BY_CODE: Record<string, Sticker> = Object.fromEntries(
  ALBUM.map((s) => [s.code, s]),
);

export function stickersOfTeam(teamCode: string): Sticker[] {
  return ALBUM.filter((s) => s.team === teamCode && s.type !== "coca_cola");
}

export function totalStickers(): number {
  return ALBUM.length;
}

// ============================================================
//  CONTEXTO DE ESCANEO
// ============================================================

export type ScanContextKind =
  | "team"
  | "coca_cola"
  | "fwc"
  | "intro"
  | "custom"
  | "auto";

export type ScanContext = {
  kind: ScanContextKind;
  teamCode?: string;
  /** 1 = hoja izquierda (escudo + 9 jugadores 1-10), 2 = hoja derecha (9 jugadores 11-20 con foto grupal en 13) */
  teamSheet?: 1 | 2;
  /** id de fila album_pages si kind === "custom" */
  customId?: string;
  /** lista de códigos de la hoja custom (server-side la rellena) */
  customCodes?: string[];
  /** etiqueta humana de la hoja custom */
  customLabel?: string;
};

/**
 * Distribución por hoja de la página de equipo (20 cromos):
 * - Hoja 1: <CODE>1..<CODE>10  (escudo + 9 jugadores)
 * - Hoja 2: <CODE>11..<CODE>20 (9 jugadores con foto grupal en <CODE>13)
 */
export function splitTeamSheet(stickers: Sticker[], sheet: 1 | 2): Sticker[] {
  return stickers.filter((s) => {
    const n = s.teamNumber;
    if (!n) return false;
    return sheet === 1 ? n >= 1 && n <= 10 : n >= 11 && n <= 20;
  });
}

export function stickersForContext(ctx: ScanContext): Sticker[] {
  switch (ctx.kind) {
    case "team": {
      if (!ctx.teamCode) return [];
      const all = stickersOfTeam(ctx.teamCode);
      if (ctx.teamSheet) return splitTeamSheet(all, ctx.teamSheet);
      return all;
    }
    case "coca_cola":
      return ALBUM.filter((s) => s.type === "coca_cola");
    case "fwc":
      return ALBUM.filter((s) => s.type === "fwc");
    case "intro":
      return ALBUM.filter((s) => s.type === "intro");
    case "custom":
      return (ctx.customCodes ?? [])
        .map((c) => ALBUM_BY_CODE[c])
        .filter(Boolean);
    case "auto":
    default:
      return ALBUM;
  }
}

export function describeContext(ctx: ScanContext): string {
  switch (ctx.kind) {
    case "team": {
      const team = TEAMS.find((t) => t.code === ctx.teamCode);
      if (!team) return "Equipo desconocido";
      const base = `${team.flag} ${team.name}`;
      if (ctx.teamSheet === 1)
        return `${base} · hoja 1 (escudo + 9 jugadores · ${ctx.teamCode}1–${ctx.teamCode}10)`;
      if (ctx.teamSheet === 2)
        return `${base} · hoja 2 (foto grupal + 9 jugadores · ${ctx.teamCode}11–${ctx.teamCode}20)`;
      return base;
    }
    case "coca_cola":
      return "Sección: Coca-Cola (CC1–CC14)";
    case "fwc":
      return "Sección: FIFA World Cup (FWC1–FWC19)";
    case "intro":
      return "Portada (00)";
    case "custom":
      return ctx.customLabel
        ? `Hoja custom: ${ctx.customLabel}`
        : "Hoja custom";
    case "auto":
    default:
      return "Auto-detectar (toda página)";
  }
}

/** Helpers para parseo / validación de códigos */
const TEAM_CODES = new Set(TEAMS.map((t) => t.code));

export function parseStickerCode(input: string): {
  code: string;
  team?: string;
  teamNumber?: number;
} | null {
  const cleaned = input.trim().toUpperCase();
  if (!cleaned) return null;
  if (cleaned === "00") return { code: "00" };
  const fwc = cleaned.match(/^FWC(\d{1,2})$/);
  if (fwc) {
    const n = Number(fwc[1]);
    if (n >= 1 && n <= 19) return { code: `FWC${n}` };
  }
  const cc = cleaned.match(/^CC(\d{1,2})$/);
  if (cc) {
    const n = Number(cc[1]);
    if (n >= 1 && n <= 14) return { code: `CC${n}` };
  }
  const team = cleaned.match(/^([A-Z]{2,3})(\d{1,2})$/);
  if (team) {
    const t = team[1];
    const n = Number(team[2]);
    if (TEAM_CODES.has(t) && n >= 1 && n <= 20) {
      return { code: `${t}${n}`, team: t, teamNumber: n };
    }
  }
  return null;
}

export function isValidCode(code: string): boolean {
  return !!ALBUM_BY_CODE[code];
}
