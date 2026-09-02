import Color from "colorjs.io";
import * as v from "valibot";

import type {
  HexColor,
  OmarchyPaletteColors,
  PaletteConfig,
  PaletteSeeds,
  TerminalColorName,
  ThemeMode,
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

const HexColorSchema = v.pipe(
  v.string("must be a color string"),
  v.rawTransform(({ dataset, addIssue, NEVER }) => {
    try {
      return normalizeHex(dataset.value, "color");
    } catch {
      addIssue({ message: "must be a valid opaque color" });
      return NEVER;
    }
  }),
);

const SeedsSchema = v.strictObject({
  surface: HexColorSchema,
  neutral: HexColorSchema,
  accent: HexColorSchema,
  terminal: v.record(v.picklist(TERMINAL_COLOR_NAMES), HexColorSchema),
  overrides: v.optional(v.record(v.picklist(PALETTE_COLOR_NAMES), HexColorSchema)),
});

const ConfigSchema = v.strictObject({
  mode: v.picklist(["dark", "light"] satisfies ThemeMode[], 'must be "dark" or "light"'),
  modes: v.strictObject({
    dark: SeedsSchema,
    light: SeedsSchema,
  }),
});

const RecipeSchema = v.strictObject({
  version: v.literal(1, "must be version 1"),
  config: ConfigSchema,
  colors: v.record(v.string(), HexColorSchema),
});

function validationError(
  label: string,
  issues: readonly {
    message: string;
    path?: readonly { key: unknown }[] | undefined;
  }[],
): TypeError {
  const issue = issues[0];
  const path = issue?.path?.map(({ key }) => String(key)).join(".");
  return new TypeError(`${path ? `${label}.${path}` : label} ${issue?.message ?? "is invalid"}`);
}

const DEFAULT_SEEDS: Record<ThemeMode, PaletteSeeds> = {
  dark: {
    surface: "#111318",
    neutral: "#8b8d98",
    accent: "#3d63dd",
    terminal: {},
  },
  light: {
    surface: "#f9fafb",
    neutral: "#8b8d98",
    accent: "#3d63dd",
    terminal: {},
  },
};

export function defaultSeeds(mode: ThemeMode): PaletteSeeds {
  return { ...DEFAULT_SEEDS[mode], terminal: {} };
}

export function parseConfig(input: unknown): PaletteConfig {
  const result = v.safeParse(ConfigSchema, input);
  if (!result.success) throw validationError("config", result.issues);
  return result.output as PaletteConfig;
}

export function parseRecipe(input: unknown): {
  version: 1;
  config: PaletteConfig;
  colors: Record<string, HexColor>;
} {
  const result = v.safeParse(RecipeSchema, input);
  if (!result.success) throw validationError("recipe", result.issues);
  return result.output as {
    version: 1;
    config: PaletteConfig;
    colors: Record<string, HexColor>;
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
