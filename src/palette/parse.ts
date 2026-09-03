import Color from "../color/color";

import type {
  HexColor,
  OmarchyPaletteColors,
  PaletteConfig,
  PaletteSeeds,
  TerminalColorName,
} from "../types";

const TERMINAL_COLOR_NAMES = [
  "red",
  "yellow",
  "green",
  "cyan",
  "blue",
  "magenta",
  "orange",
  "brown",
] as const satisfies readonly TerminalColorName[];

const PALETTE_COLOR_NAMES = [
  "accent",
  "selection",
  "muted",
  "background",
  "dark_background",
  "darker_background",
  "lighter_background",
  "foreground",
  "dark_foreground",
  "light_foreground",
  "bright_foreground",
  "red",
  "yellow",
  "orange",
  "green",
  "cyan",
  "blue",
  "magenta",
  "brown",
  "bright_red",
  "bright_yellow",
  "bright_green",
  "bright_cyan",
  "bright_blue",
  "bright_magenta",
] as const satisfies readonly (keyof OmarchyPaletteColors)[];

export function normalizeHex(value: unknown, label: string): HexColor {
  if (typeof value !== "string") throw new TypeError(`${label} must be a color string`);
  try {
    const color = new Color(value).to("srgb");
    const serialized = color.toString({ format: "hex" });
    if (!/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(serialized)) {
      throw new Error("color must be opaque");
    }
    if (serialized.length === 4) {
      return `#${serialized[1]}${serialized[1]}${serialized[2]}${serialized[2]}${serialized[3]}${serialized[3]}`.toLowerCase() as HexColor;
    }
    return serialized.slice(0, 7).toLowerCase() as HexColor;
  } catch (error) {
    throw new TypeError(`${label} is not a valid color`, { cause: error });
  }
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function strict(value: Record<string, unknown>, keys: readonly string[], label: string): void {
  const unknown = Object.keys(value).find((key) => !keys.includes(key));
  if (unknown) throw new TypeError(`${label}.${unknown} is not allowed`);
}

function colorRecord(
  value: unknown,
  keys: readonly string[],
  label: string,
): Record<string, HexColor> {
  const input = record(value, label);
  strict(input, keys, label);
  return Object.entries(input).reduce<Record<string, HexColor>>((colors, [key, color]) => {
    colors[key] = normalizeHex(color, `${label}.${key}`);
    return colors;
  }, {});
}

function seeds(value: unknown, label: string): PaletteSeeds {
  const input = record(value, label);
  strict(input, ["surface", "neutral", "accent", "terminal", "overrides"], label);
  return {
    surface: normalizeHex(input.surface, `${label}.surface`),
    neutral: normalizeHex(input.neutral, `${label}.neutral`),
    accent: normalizeHex(input.accent, `${label}.accent`),
    terminal: colorRecord(input.terminal, TERMINAL_COLOR_NAMES, `${label}.terminal`),
    ...(input.overrides === undefined
      ? {}
      : { overrides: colorRecord(input.overrides, PALETTE_COLOR_NAMES, `${label}.overrides`) }),
  };
}

export function parseConfig(input: unknown): PaletteConfig {
  const config = record(input, "config");
  strict(config, ["mode", "modes"], "config");
  if (config.mode !== "dark" && config.mode !== "light") {
    throw new TypeError('config.mode must be "dark" or "light"');
  }
  const modes = record(config.modes, "config.modes");
  strict(modes, ["dark", "light"], "config.modes");
  return {
    mode: config.mode,
    modes: {
      dark: seeds(modes.dark, "config.modes.dark"),
      light: seeds(modes.light, "config.modes.light"),
    },
  };
}

export function parseRecipe(input: unknown): {
  version: 1;
  config: PaletteConfig;
  colors: Record<string, HexColor>;
} {
  const recipe = record(input, "recipe");
  strict(recipe, ["version", "config", "colors"], "recipe");
  if (recipe.version !== 1) throw new TypeError("recipe.version must be version 1");
  return {
    version: 1,
    config: parseConfig(recipe.config),
    colors: colorRecord(recipe.colors, PALETTE_COLOR_NAMES, "recipe.colors"),
  };
}

export function parseConfigJson(input: string): PaletteConfig {
  try {
    return parseConfig(JSON.parse(input));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new TypeError(`Invalid config JSON: ${error.message}`, { cause: error });
    }
    throw error;
  }
}
