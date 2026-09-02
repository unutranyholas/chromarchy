import type { HexColor, OmarchyPaletteColors, ThemeMode } from "../types";
import { normalizeHex } from "../palette/parse";

const COLOR_LINE = /^(\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*=\s*)"([^"]*)"(\s*(?:#.*)?)$/;

export interface ParsedTheme {
  mode: ThemeMode;
  colors: Record<string, HexColor>;
}

export function parseTheme(source: string): ParsedTheme {
  const colors: Record<string, HexColor> = {};
  let mode: ThemeMode | undefined;

  for (const line of source.split(/\r?\n/)) {
    const match = COLOR_LINE.exec(line);
    if (!match) continue;
    const key = match[2];
    const rawValue = match[4];
    if (!key || !rawValue) continue;
    if (key === "mode") {
      if (rawValue === "dark" || rawValue === "light") mode = rawValue;
      continue;
    }
    if (/^#[\da-f]{6}$/i.test(rawValue)) colors[key] = normalizeHex(rawValue, key);
  }

  if (!mode) throw new Error("colors.toml has no valid mode key");
  if (!colors.background || !colors.foreground || !colors.accent) {
    throw new Error("colors.toml is missing background, foreground, or accent");
  }
  return { mode, colors };
}

export function renderPalette(
  source: string,
  mode: ThemeMode,
  colors: OmarchyPaletteColors,
): { text: string; updated: string[] } {
  let modeUpdated = false;
  const remaining = new Map<string, HexColor>(
    Object.entries(colors).map(([key, value]) => [key, normalizeHex(value, key)]),
  );
  const updated: string[] = [];

  const lines = source.split(/\r?\n/).map((line) => {
    const match = COLOR_LINE.exec(line);
    if (!match) return line;
    const indent = match[1] ?? "";
    const key = match[2];
    const separator = match[3] ?? " = ";
    const suffix = match[5] ?? "";
    if (!key) return line;
    if (key === "mode") {
      modeUpdated = true;
      return `${indent}${key}${separator}"${mode}"${suffix}`;
    }
    const value = remaining.get(key);
    if (!value || key.startsWith("hyprland_")) return line;
    remaining.delete(key);
    updated.push(key);
    return `${indent}${key}${separator}"${value}"${suffix}`;
  });

  if (!modeUpdated) throw new Error("colors.toml has no mode key");

  const missing = [...remaining.entries()].filter(([key]) => !key.startsWith("hyprland_"));
  if (missing.length > 0) {
    while (lines.length > 0 && lines.at(-1) === "") lines.pop();
    lines.push("", "# Added by Chromarchy");
    for (const [key, value] of missing) {
      lines.push(`${key} = "${value}"`);
      updated.push(key);
    }
  }

  return {
    text: `${lines.join("\n")}\n`,
    updated,
  };
}
