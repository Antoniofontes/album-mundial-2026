import { TEAMS } from "./teams";

export type StickerType =
  | "team_logo" // escudo de selección
  | "team_photo" // foto grupal del equipo
  | "player" // jugador
  | "coca_cola" // exclusivos Coca-Cola
  | "special"; // misceláneos / portada / mascotas / pelota / etc. (8)

export type Sticker = {
  /** número oficial Panini (1..980) */
  number: number;
  /** código único interno */
  code: string;
  /** tipo */
  type: StickerType;
  /** equipo asociado (si aplica) */
  team?: string;
  /** nombre / etiqueta */
  name: string;
  /** posición o rol opcional */
  role?: string;
  /** si la figurita es brillante/foil/premium */
  premium?: boolean;
};

const COCA_COLA_PLAYERS = [
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

/**
 * Estructura confirmada (Panini Mundial 2026):
 * - 48 equipos × 20 cromos = 960
 *     · escudo (1) + foto grupal (1) + 18 jugadores
 *     · 2 hojas físicas por equipo
 * - 12 Coca-Cola
 * - 8 cromos especiales (portada / 00 / mascotas / pelota / sedes / etc.)
 *   → Estos los modelamos genéricos. La disposición real por hoja se
 *     define mediante "hojas custom" en Supabase (album_pages.kind='custom').
 *
 * Total: 980.
 */
export function buildAlbum(): Sticker[] {
  const stickers: Sticker[] = [];
  let n = 1;

  // 1 -> 960: 48 equipos × 20
  for (const team of TEAMS) {
    stickers.push({
      number: n++,
      code: `${team.code}-LOGO`,
      type: "team_logo",
      team: team.code,
      name: `Escudo ${team.name}`,
      premium: true,
    });
    stickers.push({
      number: n++,
      code: `${team.code}-PHOTO`,
      type: "team_photo",
      team: team.code,
      name: `Foto grupal ${team.name}`,
    });
    const squad = KNOWN_SQUADS[team.code];
    for (let i = 0; i < 18; i++) {
      const playerName = squad?.[i] ?? `${team.name} - Jugador ${i + 1}`;
      stickers.push({
        number: n++,
        code: `${team.code}-P${i + 1}`,
        type: "player",
        team: team.code,
        name: playerName,
        role: ROLES_18[i],
        premium: i === 17,
      });
    }
  }

  // 961 -> 972: 12 Coca-Cola
  for (const cc of COCA_COLA_PLAYERS) {
    stickers.push({
      number: n++,
      code: `CC-${n}`,
      type: "coca_cola",
      team: cc.team,
      name: cc.name,
      role: "Edición Coca-Cola",
      premium: true,
    });
  }

  // 973 -> 980: 8 especiales (portada/intro/copa/pelota/etc.)
  // Sin nombre específico — el usuario los ubicará en hojas custom.
  while (n <= 980) {
    stickers.push({
      number: n,
      code: `SP-${n}`,
      type: "special",
      name: `Especial #${n - 972}`,
      premium: true,
    });
    n++;
  }

  return stickers;
}

export const ALBUM: Sticker[] = buildAlbum();

export const ALBUM_BY_NUMBER: Record<number, Sticker> = Object.fromEntries(
  ALBUM.map((s) => [s.number, s]),
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

export type ScanContextKind = "team" | "coca_cola" | "special" | "custom" | "auto";

export type ScanContext = {
  kind: ScanContextKind;
  teamCode?: string;
  /** 1 = hoja izquierda (escudo + foto grupal + 9 jugadores), 2 = hoja derecha (9 jugadores) */
  teamSheet?: 1 | 2;
  /** id de fila album_pages si kind === "custom" */
  customId?: string;
  /** lista de números de la hoja custom (server-side la rellena) */
  customNumbers?: number[];
  /** etiqueta humana de la hoja custom */
  customLabel?: string;
};

/**
 * Distribución por hoja de la página de equipo (20 cromos):
 * - Hoja 1: escudo + foto grupal + 9 jugadores (11 cromos)
 * - Hoja 2: 9 jugadores
 */
export function splitTeamSheet(stickers: Sticker[], sheet: 1 | 2): Sticker[] {
  if (stickers.length === 0) return stickers;
  if (sheet === 1) return stickers.slice(0, 11);
  return stickers.slice(11);
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
    case "special":
      return ALBUM.filter((s) => s.type === "special");
    case "custom":
      return (ctx.customNumbers ?? [])
        .map((n) => ALBUM_BY_NUMBER[n])
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
        return `${base} · hoja 1 (escudo + foto grupal + 1ª mitad)`;
      if (ctx.teamSheet === 2) return `${base} · hoja 2 (2ª mitad)`;
      return base;
    }
    case "coca_cola":
      return "Sección: Especiales Coca-Cola (12)";
    case "special":
      return "Sección: Especiales / Portada / Misceláneos (8)";
    case "custom":
      return ctx.customLabel
        ? `Hoja custom: ${ctx.customLabel}`
        : "Hoja custom";
    case "auto":
    default:
      return "Auto-detectar (toda página)";
  }
}
