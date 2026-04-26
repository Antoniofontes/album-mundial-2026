/**
 * 48 selecciones clasificadas al Mundial 2026 (USA / CAN / MEX).
 * Datos: FIFA + sorteo del 5 de diciembre de 2025.
 */
export type Team = {
  code: string; // ISO-3 estilizado (3 letras)
  name: string; // nombre en español
  group: string; // A..L
  flag: string; // emoji bandera
  confederation: "CONMEBOL" | "UEFA" | "AFC" | "CAF" | "CONCACAF" | "OFC";
};

export const TEAMS: Team[] = [
  // Grupo A
  { code: "MEX", name: "México", group: "A", flag: "🇲🇽", confederation: "CONCACAF" },
  { code: "RSA", name: "Sudáfrica", group: "A", flag: "🇿🇦", confederation: "CAF" },
  { code: "KOR", name: "Corea del Sur", group: "A", flag: "🇰🇷", confederation: "AFC" },
  { code: "CZE", name: "República Checa", group: "A", flag: "🇨🇿", confederation: "UEFA" },
  // Grupo B
  { code: "CAN", name: "Canadá", group: "B", flag: "🇨🇦", confederation: "CONCACAF" },
  { code: "BIH", name: "Bosnia y Herzegovina", group: "B", flag: "🇧🇦", confederation: "UEFA" },
  { code: "QAT", name: "Catar", group: "B", flag: "🇶🇦", confederation: "AFC" },
  { code: "SUI", name: "Suiza", group: "B", flag: "🇨🇭", confederation: "UEFA" },
  // Grupo C
  { code: "BRA", name: "Brasil", group: "C", flag: "🇧🇷", confederation: "CONMEBOL" },
  { code: "MAR", name: "Marruecos", group: "C", flag: "🇲🇦", confederation: "CAF" },
  { code: "HAI", name: "Haití", group: "C", flag: "🇭🇹", confederation: "CONCACAF" },
  { code: "SCO", name: "Escocia", group: "C", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", confederation: "UEFA" },
  // Grupo D
  { code: "USA", name: "Estados Unidos", group: "D", flag: "🇺🇸", confederation: "CONCACAF" },
  { code: "PAR", name: "Paraguay", group: "D", flag: "🇵🇾", confederation: "CONMEBOL" },
  { code: "AUS", name: "Australia", group: "D", flag: "🇦🇺", confederation: "AFC" },
  { code: "TUR", name: "Turquía", group: "D", flag: "🇹🇷", confederation: "UEFA" },
  // Grupo E
  { code: "GER", name: "Alemania", group: "E", flag: "🇩🇪", confederation: "UEFA" },
  { code: "CUW", name: "Curazao", group: "E", flag: "🇨🇼", confederation: "CONCACAF" },
  { code: "CIV", name: "Costa de Marfil", group: "E", flag: "🇨🇮", confederation: "CAF" },
  { code: "ECU", name: "Ecuador", group: "E", flag: "🇪🇨", confederation: "CONMEBOL" },
  // Grupo F
  { code: "NED", name: "Países Bajos", group: "F", flag: "🇳🇱", confederation: "UEFA" },
  { code: "JPN", name: "Japón", group: "F", flag: "🇯🇵", confederation: "AFC" },
  { code: "SWE", name: "Suecia", group: "F", flag: "🇸🇪", confederation: "UEFA" },
  { code: "TUN", name: "Túnez", group: "F", flag: "🇹🇳", confederation: "CAF" },
  // Grupo G
  { code: "BEL", name: "Bélgica", group: "G", flag: "🇧🇪", confederation: "UEFA" },
  { code: "EGY", name: "Egipto", group: "G", flag: "🇪🇬", confederation: "CAF" },
  { code: "IRN", name: "Irán", group: "G", flag: "🇮🇷", confederation: "AFC" },
  { code: "NZL", name: "Nueva Zelanda", group: "G", flag: "🇳🇿", confederation: "OFC" },
  // Grupo H
  { code: "ESP", name: "España", group: "H", flag: "🇪🇸", confederation: "UEFA" },
  { code: "CPV", name: "Cabo Verde", group: "H", flag: "🇨🇻", confederation: "CAF" },
  { code: "KSA", name: "Arabia Saudita", group: "H", flag: "🇸🇦", confederation: "AFC" },
  { code: "URU", name: "Uruguay", group: "H", flag: "🇺🇾", confederation: "CONMEBOL" },
  // Grupo I
  { code: "FRA", name: "Francia", group: "I", flag: "🇫🇷", confederation: "UEFA" },
  { code: "SEN", name: "Senegal", group: "I", flag: "🇸🇳", confederation: "CAF" },
  { code: "IRQ", name: "Irak", group: "I", flag: "🇮🇶", confederation: "AFC" },
  { code: "NOR", name: "Noruega", group: "I", flag: "🇳🇴", confederation: "UEFA" },
  // Grupo J
  { code: "ARG", name: "Argentina", group: "J", flag: "🇦🇷", confederation: "CONMEBOL" },
  { code: "ALG", name: "Argelia", group: "J", flag: "🇩🇿", confederation: "CAF" },
  { code: "AUT", name: "Austria", group: "J", flag: "🇦🇹", confederation: "UEFA" },
  { code: "JOR", name: "Jordania", group: "J", flag: "🇯🇴", confederation: "AFC" },
  // Grupo K
  { code: "POR", name: "Portugal", group: "K", flag: "🇵🇹", confederation: "UEFA" },
  { code: "COD", name: "RD del Congo", group: "K", flag: "🇨🇩", confederation: "CAF" },
  { code: "UZB", name: "Uzbekistán", group: "K", flag: "🇺🇿", confederation: "AFC" },
  { code: "COL", name: "Colombia", group: "K", flag: "🇨🇴", confederation: "CONMEBOL" },
  // Grupo L
  { code: "ENG", name: "Inglaterra", group: "L", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", confederation: "UEFA" },
  { code: "CRO", name: "Croacia", group: "L", flag: "🇭🇷", confederation: "UEFA" },
  { code: "GHA", name: "Ghana", group: "L", flag: "🇬🇭", confederation: "CAF" },
  { code: "PAN", name: "Panamá", group: "L", flag: "🇵🇦", confederation: "CONCACAF" },
];

export const TEAM_BY_CODE: Record<string, Team> = Object.fromEntries(
  TEAMS.map((t) => [t.code, t]),
);

export const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const;
export type GroupCode = (typeof GROUPS)[number];

export function teamsByGroup(): Record<GroupCode, Team[]> {
  const out = Object.fromEntries(GROUPS.map((g) => [g, [] as Team[]])) as Record<
    GroupCode,
    Team[]
  >;
  for (const t of TEAMS) out[t.group as GroupCode].push(t);
  return out;
}
