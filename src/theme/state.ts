import fs from "node:fs";
import path from "node:path";

import { generatePalette } from "../palette/generate";
import { defaultSeeds, normalizeHex, parseRecipe } from "../palette/parse";
import {
  type HexColor,
  type OmarchyPaletteColors,
  type PaletteConfig,
  type PaletteSeeds,
  type ThemeMode,
  type ThemeState,
} from "../types";
import { resolveThemePaths, type RuntimeOptions, validateSlug } from "./paths";
import { parseTheme } from "./render";

const TERMINAL_SEED_NAMES = [
  "red",
  "yellow",
  "green",
  "cyan",
  "blue",
  "magenta",
  "orange",
  "brown",
] as const;

export interface ThemeContext {
  slug: string;
  source: string;
  target: string;
  sourceText: string;
}

export function currentThemeContext(options: RuntimeOptions = {}): ThemeContext {
  const paths = resolveThemePaths(options);
  if (!fs.existsSync(paths.currentThemeName)) throw new Error("No current Omarchy theme");
  const slug = validateSlug(fs.readFileSync(paths.currentThemeName, "utf8"));
  const target = path.join(paths.userThemes, slug, "colors.toml");
  const stock = path.join(paths.stockThemes, slug, "colors.toml");
  const source = fs.existsSync(target) ? target : stock;
  if (!fs.existsSync(source)) throw new Error(`Theme '${slug}' has no colors.toml`);
  return {
    slug,
    source,
    target,
    sourceText: fs.readFileSync(source, "utf8"),
  };
}

function inferredConfig(mode: ThemeMode, colors: Record<string, HexColor>): PaletteConfig {
  const surface = colors.lighter_background ?? colors.background;
  const accent = colors.accent;
  if (!surface || !accent) throw new Error("Theme is missing background or accent");
  const terminal = Object.fromEntries(
    TERMINAL_SEED_NAMES.flatMap((name) => (colors[name] ? [[name, colors[name]]] : [])),
  ) as PaletteSeeds["terminal"];
  return {
    mode,
    modes: {
      dark:
        mode === "dark"
          ? {
              surface,
              neutral: colors.muted ?? colors.dark_foreground ?? colors.foreground ?? "#8b8d98",
              accent,
              terminal,
            }
          : defaultSeeds("dark"),
      light:
        mode === "light"
          ? {
              surface,
              neutral: colors.muted ?? colors.dark_foreground ?? colors.foreground ?? "#8b8d98",
              accent,
              terminal,
            }
          : defaultSeeds("light"),
    },
  };
}

function paletteMatches(
  current: Record<string, HexColor>,
  generated: OmarchyPaletteColors | Record<string, HexColor>,
): boolean {
  return Object.entries(generated).every(([key, value]) => current[key] === value);
}

function configPath(slug: string, options: RuntimeOptions): string {
  return path.join(resolveThemePaths(options).recipes, `${slug}.json`);
}

function readSavedConfig(
  slug: string,
  mode: ThemeMode,
  colors: Record<string, HexColor>,
  options: RuntimeOptions,
): PaletteConfig | undefined {
  const file = configPath(slug, options);
  if (!fs.existsSync(file)) return undefined;
  try {
    const recipe = parseRecipe(JSON.parse(fs.readFileSync(file, "utf8")));
    const requiredKeys = Object.keys(generatePalette(recipe.config).colors);
    return recipe.config.mode === mode &&
      requiredKeys.every((key) => recipe.colors[key] !== undefined) &&
      paletteMatches(colors, recipe.colors)
      ? recipe.config
      : undefined;
  } catch {
    return undefined;
  }
}

export function getThemeState(options: RuntimeOptions = {}): ThemeState {
  const context = currentThemeContext(options);
  const parsed = parseTheme(context.sourceText);
  const colors = Object.fromEntries(
    Object.entries(parsed.colors).map(([key, value]) => [key, normalizeHex(value, key)]),
  ) as Record<string, HexColor>;
  const config =
    readSavedConfig(context.slug, parsed.mode, colors, options) ??
    inferredConfig(parsed.mode, colors);

  return {
    slug: context.slug,
    name: context.slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
    mode: parsed.mode,
    source: context.source,
    target: context.target,
    colors,
    config,
    undoAvailable: undoStatus(options).available,
  };
}

export function undoStatus(options: RuntimeOptions = {}): {
  available: boolean;
  slug?: string;
} {
  const paths = resolveThemePaths(options);
  if (!fs.existsSync(paths.undo)) return { available: false };
  try {
    const snapshot = JSON.parse(fs.readFileSync(paths.undo, "utf8")) as {
      version?: unknown;
      slug?: unknown;
    };
    if (snapshot.version !== 1) return { available: false };
    const current = currentThemeContext(options);
    const slug = typeof snapshot.slug === "string" ? validateSlug(snapshot.slug) : "";
    return { available: slug === current.slug, slug };
  } catch {
    return { available: false };
  }
}

export function savedRecipePath(slug: string, options: RuntimeOptions = {}): string {
  return configPath(validateSlug(slug), options);
}
