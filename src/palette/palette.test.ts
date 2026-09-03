import Color from "colorjs.io";

import { TEST_CONFIG } from "../test-fixtures";
import { generatePalette } from "./generate";
import { generateRadixColors, radixStockScale, radixTerminalColors } from "./generate-radix-colors";

const lightSeeds = TEST_CONFIG.modes.light;
const darkConfig = {
  ...TEST_CONFIG,
  mode: "dark",
  modes: {
    ...TEST_CONFIG.modes,
    dark: { ...TEST_CONFIG.modes.dark, surface: "#17191f" },
  },
} as const;

function lightConfig(patch: Partial<(typeof TEST_CONFIG.modes)["light"]>) {
  return {
    ...TEST_CONFIG,
    modes: {
      ...TEST_CONFIG.modes,
      light: { ...lightSeeds, ...patch },
    },
  };
}
const hex = /^#[0-9a-f]{6}$/;

function lightness(colors: readonly string[]): number[] {
  return colors.map((color) => new Color(color).to("oklch").coords[0] ?? 0);
}

describe("strict Radix palette generation", () => {
  it("matches the released 0.8 palette", () => {
    expect(generatePalette(TEST_CONFIG)).toMatchObject({
      colors: {
        lighter_background: "#ededee",
        background: "#e5e5e7",
        dark_background: "#dddee1",
        darker_background: "#d5d6da",
        muted: "#505159",
        dark_foreground: "#6c6e78",
        light_foreground: "#1e1f24",
        foreground: "#1e1f24",
        bright_foreground: "#1e1f24",
        accent: "#efba00",
        selection: "#f8d982",
        red: "#ce2c31",
        bright_red: "#641723",
        yellow: "#a06e00",
        bright_yellow: "#473b1f",
        green: "#00824d",
        bright_green: "#193b2d",
        cyan: "#007ca3",
        bright_cyan: "#0d3c48",
        blue: "#0072de",
        bright_blue: "#113264",
        magenta: "#953ea3",
        bright_magenta: "#53195d",
        orange: "#d14e00",
        brown: "#815e46",
      },
      accentContrast: "#292109",
    });
  });

  it("generates 12-step gray and accent scales", () => {
    const radix = generateRadixColors({
      appearance: "light",
      background: lightSeeds.surface,
      gray: lightSeeds.neutral,
      accent: lightSeeds.accent,
    });

    expect(radix.grayScale).toHaveLength(12);
    expect(radix.accentScale).toHaveLength(12);
  });

  it("uses the explicitly selected mode", () => {
    expect(generatePalette(TEST_CONFIG).mode).toBe("light");
    expect(generatePalette(darkConfig).mode).toBe("dark");
    expect(generatePalette({ ...TEST_CONFIG, mode: "dark" }).mode).toBe("dark");
  });

  it("generates only from the selected mode record", () => {
    const changedInactive = {
      ...TEST_CONFIG,
      modes: {
        ...TEST_CONFIG.modes,
        dark: { ...TEST_CONFIG.modes.dark, accent: "#ff0000" as const },
      },
    };
    expect(generatePalette(changedInactive).colors).toEqual(generatePalette(TEST_CONFIG).colors);
    expect(generatePalette(lightConfig({ accent: "#4477ff" })).colors).not.toEqual(
      generatePalette(TEST_CONFIG).colors,
    );
  });

  it("interpolates four light surfaces across the Radix gray background region", () => {
    const palette = generatePalette(TEST_CONFIG);
    const radix = generateRadixColors({
      appearance: "light",
      background: lightSeeds.surface,
      gray: lightSeeds.neutral,
      accent: lightSeeds.accent,
    });

    expect(palette.colors.lighter_background).toBe(radix.grayScale[0]);
    expect(palette.colors.darker_background).toBe(radix.grayScale[3]);
    expect(new Set(palette.groups.surfaces)).toHaveLength(4);
    expect(lightness(palette.groups.surfaces)).toEqual(
      lightness(palette.groups.surfaces).sort((left, right) => right - left),
    );
    expect(palette.groups.surfaces).toEqual([
      palette.colors.lighter_background,
      palette.colors.background,
      palette.colors.dark_background,
      palette.colors.darker_background,
    ]);
  });

  it("interpolates four dark surfaces across the Radix gray background region", () => {
    const palette = generatePalette(darkConfig);
    const radix = generateRadixColors({
      appearance: "dark",
      background: darkConfig.modes.dark.surface,
      gray: darkConfig.modes.dark.neutral,
      accent: darkConfig.modes.dark.accent,
    });

    expect(palette.colors.darker_background).toBe(radix.grayScale[0]);
    expect(palette.colors.lighter_background).toBe(radix.grayScale[3]);
    expect(new Set(palette.groups.surfaces)).toHaveLength(4);
    expect(lightness(palette.groups.surfaces)).toEqual(
      lightness(palette.groups.surfaces).sort((left, right) => right - left),
    );
    expect(palette.groups.surfaces).toEqual([
      palette.colors.lighter_background,
      palette.colors.background,
      palette.colors.dark_background,
      palette.colors.darker_background,
    ]);
  });

  it("maps text tokens to gray steps 10, 11, and 12 with intentional duplicates", () => {
    const palette = generatePalette(TEST_CONFIG);
    const radix = generateRadixColors({
      appearance: "light",
      background: lightSeeds.surface,
      gray: lightSeeds.neutral,
      accent: lightSeeds.accent,
    });

    expect(palette.colors.dark_foreground).toBe(radix.grayScale[9]);
    expect(palette.colors.muted).toBe(radix.grayScale[10]);
    expect(palette.colors.foreground).toBe(radix.grayScale[11]);
    expect(palette.colors.light_foreground).toBe(radix.grayScale[11]);
    expect(palette.colors.bright_foreground).toBe(radix.grayScale[11]);
    expect(palette.groups.text).toEqual([
      radix.grayScale[10],
      radix.grayScale[9],
      radix.grayScale[11],
      radix.grayScale[11],
      radix.grayScale[11],
    ]);
  });

  it("maps accent and selection to accent steps 9 and 4", () => {
    const palette = generatePalette(TEST_CONFIG);
    const radix = generateRadixColors({
      appearance: "light",
      background: lightSeeds.surface,
      gray: lightSeeds.neutral,
      accent: lightSeeds.accent,
    });

    expect(palette.colors.accent).toBe(radix.accentScale[8]);
    expect(palette.colors.selection).toBe(radix.accentScale[3]);
    expect(palette.groups.interaction).toEqual([radix.accentScale[8], radix.accentScale[3]]);
  });

  it("selects stock Radix P3 terminal exports for light and dark mode", () => {
    const light = radixTerminalColors("light");
    const dark = radixTerminalColors("dark");

    expect(light.red).toBe(radixStockScale("red", "light")[10]);
    expect(light.brightRed).toBe(radixStockScale("red", "light")[11]);
    expect(light.magenta).toBe(radixStockScale("plum", "light")[10]);
    expect(dark.red).toBe(radixStockScale("red", "dark")[10]);
    expect(dark.brightRed).toBe(radixStockScale("red", "dark")[11]);
    expect(dark.red).not.toBe(light.red);
  });

  it("generates terminal overrides from Radix accent steps 11 and 12", () => {
    const terminal = { red: "#d13415", orange: "#f76b15" } as const;
    const config = lightConfig({ terminal });
    const palette = generatePalette(config);
    const red = generateRadixColors({
      appearance: config.mode,
      background: config.modes.light.surface,
      gray: config.modes.light.neutral,
      accent: terminal.red,
    });
    const orange = generateRadixColors({
      appearance: config.mode,
      background: config.modes.light.surface,
      gray: config.modes.light.neutral,
      accent: terminal.orange,
    });

    expect(palette.colors.red).toBe(red.accentScale[10]);
    expect(palette.colors.bright_red).toBe(red.accentScale[11]);
    expect(palette.colors.orange).toBe(orange.accentScale[10]);
  });

  it("propagates neutral edits through the Radix gray scale", () => {
    const cooler = generateRadixColors({
      appearance: "light",
      background: lightSeeds.surface,
      gray: "#8b8d98",
      accent: lightSeeds.accent,
    });
    const warmer = generateRadixColors({
      appearance: "light",
      background: lightSeeds.surface,
      gray: "#93877d",
      accent: lightSeeds.accent,
    });

    expect(cooler.grayScale).not.toEqual(warmer.grayScale);
    expect(generatePalette(lightConfig({ neutral: "#93877d" })).groups.text).not.toEqual(
      generatePalette(TEST_CONFIG).groups.text,
    );
  });

  it("propagates accent edits through the Radix accent scale", () => {
    const yellow = generateRadixColors({
      appearance: "light",
      background: lightSeeds.surface,
      gray: lightSeeds.neutral,
      accent: "#ffcc00",
    });
    const blue = generateRadixColors({
      appearance: "light",
      background: lightSeeds.surface,
      gray: lightSeeds.neutral,
      accent: "#4477ff",
    });

    expect(yellow.accentScale).not.toEqual(blue.accentScale);
    expect(generatePalette(lightConfig({ accent: "#4477ff" })).colors.accent).toBe(
      blue.accentScale[8],
    );
  });

  it("uses the tinted gray scale for pure black and white accents", () => {
    const white = generateRadixColors({
      appearance: "light",
      background: lightSeeds.surface,
      gray: lightSeeds.neutral,
      accent: "#ffffff",
    });
    const black = generateRadixColors({
      appearance: "dark",
      background: darkConfig.modes.dark.surface,
      gray: darkConfig.modes.dark.neutral,
      accent: "#000000",
    });

    expect(white.accentScale.slice(0, 8)).toEqual(white.grayScale.slice(0, 8));
    expect(black.accentScale.slice(0, 8)).toEqual(black.grayScale.slice(0, 8));
  });

  it("normalizes all Omarchy output tokens to six-digit lowercase hex", () => {
    const palette = generatePalette(TEST_CONFIG);
    expect(Object.values(palette.colors).every((value) => hex.test(value))).toBe(true);
    expect(palette.accentContrast).toMatch(hex);
  });

  it("reports accessibility without rejecting authored seeds", () => {
    const palette = generatePalette(lightConfig({ accent: "#eeeeee" }));
    expect(palette.checks.accentText).toBeGreaterThan(1);
    expect(palette.checks.terminalMinimum).toBeGreaterThan(1);
  });

  it("checks every base, bright, orange, and brown terminal color", () => {
    const generated = generatePalette(TEST_CONFIG);
    const overridden = generatePalette(
      lightConfig({ overrides: { bright_red: generated.colors.background } }),
    );
    expect(overridden.checks.terminalMinimum).toBeCloseTo(1);
  });

  it("applies authored token overrides after generation", () => {
    const generated = generatePalette(TEST_CONFIG);
    const overridden = generatePalette(
      lightConfig({ overrides: { accent: "#000000", foreground: "#abcdef" } }),
    );

    expect(overridden.colors.accent).toBe("#000000");
    expect(overridden.colors.foreground).toBe("#abcdef");
    expect(overridden.groups.text[3]).toBe("#abcdef");
    expect(overridden.colors).toEqual({
      ...generated.colors,
      accent: "#000000",
      foreground: "#abcdef",
    });
    expect(overridden.accentContrast).toBe(generated.accentContrast);
  });
});
