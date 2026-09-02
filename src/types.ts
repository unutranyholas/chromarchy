export type ThemeMode = "dark" | "light";
export type HexColor = `#${string}`;
export type TerminalColorName =
  | "red"
  | "yellow"
  | "green"
  | "cyan"
  | "blue"
  | "magenta"
  | "orange"
  | "brown";

export interface PaletteSeeds {
  surface: HexColor;
  neutral: HexColor;
  accent: HexColor;
  terminal: Partial<Record<TerminalColorName, HexColor>>;
  overrides?: Partial<OmarchyPaletteColors>;
}

export interface PaletteConfig {
  mode: ThemeMode;
  modes: Record<ThemeMode, PaletteSeeds>;
}

interface PaletteChecks {
  mainText: number;
  mutedText: number;
  selectionText: number;
  accentText: number;
  terminalMinimum: number;
}

interface PaletteGroups {
  surfaces: readonly [HexColor, HexColor, HexColor, HexColor];
  text: readonly [HexColor, HexColor, HexColor, HexColor, HexColor];
  interaction: readonly [HexColor, HexColor];
  terminal: readonly HexColor[];
}

export interface PaletteProposal {
  config: PaletteConfig;
  mode: ThemeMode;
  colors: OmarchyPaletteColors;
  groups: PaletteGroups;
  checks: PaletteChecks;
  accentContrast: HexColor;
}

export interface ThemeState {
  slug: string;
  name: string;
  mode: ThemeMode;
  source: string;
  target: string;
  colors: Record<string, HexColor>;
  config: PaletteConfig;
  undoAvailable: boolean;
}

export interface MutationResult {
  ok: true;
  slug: string;
  target: string;
  updated: string[];
  state: ThemeState;
}

export interface OmarchyPaletteColors {
  accent: HexColor;
  selection: HexColor;
  muted: HexColor;
  background: HexColor;
  dark_background: HexColor;
  darker_background: HexColor;
  lighter_background: HexColor;
  foreground: HexColor;
  dark_foreground: HexColor;
  light_foreground: HexColor;
  bright_foreground: HexColor;
  red: HexColor;
  yellow: HexColor;
  orange: HexColor;
  green: HexColor;
  cyan: HexColor;
  blue: HexColor;
  magenta: HexColor;
  brown: HexColor;
  bright_red: HexColor;
  bright_yellow: HexColor;
  bright_green: HexColor;
  bright_cyan: HexColor;
  bright_blue: HexColor;
  bright_magenta: HexColor;
}
