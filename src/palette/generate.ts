import Color from "colorjs.io";

import type {
  HexColor,
  OmarchyPaletteColors,
  PaletteConfig,
  PaletteProposal,
  TerminalColorName,
  ThemeMode,
} from "../types";
import { generateRadixColors, radixTerminalColors } from "./generate-radix-colors";
import { normalizeHex, parseConfig } from "./parse";

function contrast(background: HexColor, foreground: HexColor): number {
  return new Color(background).contrast(new Color(foreground), "WCAG21");
}

function worstContrast(backgrounds: readonly HexColor[], foreground: HexColor): number {
  return Math.min(...backgrounds.map((background) => contrast(background, foreground)));
}

const TERMINAL_OUTPUTS = {
  red: ["red", "brightRed"],
  yellow: ["yellow", "brightYellow"],
  green: ["green", "brightGreen"],
  cyan: ["cyan", "brightCyan"],
  blue: ["blue", "brightBlue"],
  magenta: ["magenta", "brightMagenta"],
  orange: ["orange"],
  brown: ["brown"],
} as const satisfies Record<TerminalColorName, readonly string[]>;

function omarchySurfaces(mode: ThemeMode, gray: readonly HexColor[]) {
  const range = new Color(gray[0]!).range(gray[3]!, {
    space: "oklch",
    outputSpace: "srgb",
  });
  const steps = [0, 1 / 3, 2 / 3, 1].map((position, index) =>
    normalizeHex(range(position).toString({ format: "hex" }), `surface.${index + 1}`),
  );

  return mode === "dark"
    ? {
        darker: steps[0]!,
        dark: steps[1]!,
        background: steps[2]!,
        lighter: steps[3]!,
      }
    : {
        lighter: steps[0]!,
        background: steps[1]!,
        dark: steps[2]!,
        darker: steps[3]!,
      };
}

export function generatePalette(input: PaletteConfig): PaletteProposal {
  const config = parseConfig(input);
  const mode = config.mode;
  const seeds = config.modes[mode];
  const radix = generateRadixColors({
    appearance: mode,
    background: seeds.surface,
    gray: seeds.neutral,
    accent: seeds.accent,
  });
  const gray = radix.grayScale;
  const accent = radix.accentScale;
  const surfaces = omarchySurfaces(mode, gray);
  const muted = gray[10];
  const darkForeground = gray[9];
  const lightForeground = gray[11];
  const foreground = gray[11];
  const brightForeground = gray[11];
  const terminal = radixTerminalColors(mode);
  for (const [name, seed] of Object.entries(seeds.terminal) as [TerminalColorName, HexColor][]) {
    const scale = generateRadixColors({
      appearance: mode,
      background: seeds.surface,
      gray: seeds.neutral,
      accent: seed,
    }).accentScale;
    const outputs = TERMINAL_OUTPUTS[name];
    Object.assign(
      terminal,
      outputs.length === 2
        ? { [outputs[0]]: scale[10], [outputs[1]]: scale[11] }
        : { [outputs[0]]: scale[10] },
    );
  }
  const selection = accent[3];
  const accentColor = accent[8];

  const colors: OmarchyPaletteColors = {
    lighter_background: surfaces.lighter,
    background: surfaces.background,
    dark_background: surfaces.dark,
    darker_background: surfaces.darker,
    muted,
    dark_foreground: darkForeground,
    light_foreground: lightForeground,
    foreground,
    bright_foreground: brightForeground,
    accent: accentColor,
    selection,
    red: terminal.red,
    bright_red: terminal.brightRed,
    yellow: terminal.yellow,
    bright_yellow: terminal.brightYellow,
    green: terminal.green,
    bright_green: terminal.brightGreen,
    cyan: terminal.cyan,
    bright_cyan: terminal.brightCyan,
    blue: terminal.blue,
    bright_blue: terminal.brightBlue,
    magenta: terminal.magenta,
    bright_magenta: terminal.brightMagenta,
    orange: terminal.orange,
    brown: terminal.brown,
    ...seeds.overrides,
  };
  const accentContrast = radix.accentContrast;
  const surfaceGroup = [
    colors.lighter_background,
    colors.background,
    colors.dark_background,
    colors.darker_background,
  ] as const;
  const text = [
    colors.muted,
    colors.dark_foreground,
    colors.light_foreground,
    colors.foreground,
    colors.bright_foreground,
  ] as const;
  const terminalGroup = [
    colors.red,
    colors.bright_red,
    colors.yellow,
    colors.bright_yellow,
    colors.green,
    colors.bright_green,
    colors.cyan,
    colors.bright_cyan,
    colors.blue,
    colors.bright_blue,
    colors.magenta,
    colors.bright_magenta,
    colors.orange,
    colors.brown,
  ];

  return {
    config,
    mode,
    colors,
    groups: {
      surfaces: surfaceGroup,
      text,
      interaction: [colors.accent, colors.selection],
      terminal: terminalGroup,
    },
    accentContrast,
    checks: {
      mainText: worstContrast(surfaceGroup, colors.foreground),
      mutedText: worstContrast(surfaceGroup, colors.muted),
      selectionText: contrast(colors.selection, colors.bright_foreground),
      accentText: contrast(colors.accent, accentContrast),
      terminalMinimum: Math.min(
        ...terminalGroup.map((color) => contrast(colors.background, color)),
      ),
    },
  };
}
