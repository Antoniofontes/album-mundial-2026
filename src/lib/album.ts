import { TEAMS } from "./teams";

export type StickerType =
  | "intro" // 1-12 introducción/trofeo/mascota/póster
  | "team_logo" // escudo de selección
  | "player" // jugador
  | "stadium" // sede / estadio
  | "coca_cola" // exclusivos Coca-Cola
  | "legend" // leyendas del Mundial
  | "special"; // brillantes/foil de cierre

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

const STADIUMS_2026 = [
  "MetLife Stadium (Nueva York/NJ)",
  "SoFi Stadium (Los Ángeles)",
  "AT&T Stadium (Dallas)",
  "Mercedes-Benz Stadium (Atlanta)",
  "NRG Stadium (Houston)",
  "Hard Rock Stadium (Miami)",
  "Lincoln Financial Field (Filadelfia)",
  "Levi's Stadium (Bay Area)",
  "Lumen Field (Seattle)",
  "Gillette Stadium (Boston)",
  "Arrowhead Stadium (Kansas City)",
  "Estadio Akron (Guadalajara)",
  "Estadio Azteca (Ciudad de México)",
  "Estadio BBVA (Monterrey)",
  "BMO Field (Toronto)",
  "BC Place (Vancouver)",
];

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

const LEGENDS = [
  { name: "Pelé", team: "BRA", role: "Leyenda 1958/62/70" },
  { name: "Diego Maradona", team: "ARG", role: "Leyenda 1986" },
  { name: "Lionel Messi", team: "ARG", role: "Leyenda 2022" },
  { name: "Cristiano Ronaldo", team: "POR", role: "Leyenda" },
  { name: "Zinedine Zidane", team: "FRA", role: "Leyenda 1998" },
  { name: "Ronaldo Nazário", team: "BRA", role: "Leyenda 2002" },
  { name: "Franz Beckenbauer", team: "GER", role: "Leyenda 1974" },
  { name: "Bobby Moore", team: "ENG", role: "Leyenda 1966" },
];

const INTRO = [
  "Trofeo FIFA",
  "Mascota oficial - Maple",
  "Mascota oficial - Zayu",
  "Mascota oficial - Clutch",
  "Logo oficial Mundial 2026",
  "Póster oficial",
  "Pelota oficial",
  "Sedes - mapa",
  "FIFA Fan Festival",
  "Calendario partidos",
  "Historia 1930-1990",
  "Historia 1994-2022",
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
 * El sistema permite editar estos nombres en runtime; sólo son default.
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
  let n = 1;

  // 1-12: intro
  for (const title of INTRO) {
    stickers.push({
      number: n,
      code: `INTRO-${n}`,
      type: "intro",
      name: title,
      premium: n <= 2,
    });
    n++;
  }

  // 13 -> 924: 48 equipos × 19 (escudo + 18 jugadores)
  for (const team of TEAMS) {
    stickers.push({
      number: n,
      code: `${team.code}-LOGO`,
      type: "team_logo",
      team: team.code,
      name: `Escudo ${team.name}`,
      premium: true,
    });
    n++;

    const squad = KNOWN_SQUADS[team.code];
    for (let i = 0; i < 18; i++) {
      const playerName = squad?.[i] ?? `${team.name} - Jugador ${i + 1}`;
      stickers.push({
        number: n,
        code: `${team.code}-${i + 1}`,
        type: "player",
        team: team.code,
        name: playerName,
        role: ROLES_18[i],
        premium: i === 17,
      });
      n++;
    }
  }

  // estadios (16)
  for (const stadium of STADIUMS_2026) {
    stickers.push({
      number: n,
      code: `ST-${n}`,
      type: "stadium",
      name: stadium,
    });
    n++;
  }

  // Coca-Cola (12)
  for (const cc of COCA_COLA_PLAYERS) {
    stickers.push({
      number: n,
      code: `CC-${n}`,
      type: "coca_cola",
      team: cc.team,
      name: cc.name,
      role: "Edición Coca-Cola",
      premium: true,
    });
    n++;
  }

  // leyendas (8)
  for (const lg of LEGENDS) {
    stickers.push({
      number: n,
      code: `LEG-${n}`,
      type: "legend",
      team: lg.team,
      name: lg.name,
      role: lg.role,
      premium: true,
    });
    n++;
  }

  // 20 specials/foil de cierre
  while (n <= 980) {
    stickers.push({
      number: n,
      code: `SP-${n}`,
      type: "special",
      name: `Especial Brillante #${n}`,
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
  return ALBUM.filter((s) => s.team === teamCode);
}

export function totalStickers(): number {
  return ALBUM.length;
}

export type ScanContextKind =
  | "team"
  | "intro"
  | "stadium"
  | "coca_cola"
  | "legend"
  | "special"
  | "auto";

export type ScanContext = {
  kind: ScanContextKind;
  teamCode?: string;
};

/**
 * Devuelve la lista de figuritas que pueden aparecer en la página
 * indicada por el contexto (lo que el usuario marca antes de subir
 * la foto). Si es "auto" (no sabemos), devuelve todo el álbum.
 */
export function stickersForContext(ctx: ScanContext): Sticker[] {
  switch (ctx.kind) {
    case "team":
      return ctx.teamCode ? stickersOfTeam(ctx.teamCode) : [];
    case "intro":
      return ALBUM.filter((s) => s.type === "intro");
    case "stadium":
      return ALBUM.filter((s) => s.type === "stadium");
    case "coca_cola":
      return ALBUM.filter((s) => s.type === "coca_cola");
    case "legend":
      return ALBUM.filter((s) => s.type === "legend");
    case "special":
      return ALBUM.filter((s) => s.type === "special");
    case "auto":
    default:
      return ALBUM;
  }
}

export function describeContext(ctx: ScanContext): string {
  switch (ctx.kind) {
    case "team": {
      const team = TEAMS.find((t) => t.code === ctx.teamCode);
      return team ? `Equipo: ${team.flag} ${team.name}` : "Equipo desconocido";
    }
    case "intro":
      return "Sección: Introducción / FIFA / Mascotas";
    case "stadium":
      return "Sección: Estadios / Sedes 2026";
    case "coca_cola":
      return "Sección: Especiales Coca-Cola";
    case "legend":
      return "Sección: Leyendas del Mundial";
    case "special":
      return "Sección: Brillantes / Foil finales";
    case "auto":
    default:
      return "Auto-detectar (toda página)";
  }
}
