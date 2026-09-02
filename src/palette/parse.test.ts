import { TEST_CONFIG } from "../test-fixtures";
import { parseConfig, parseConfigJson, parseRecipe } from "./parse";

describe("palette config parsing", () => {
  it("normalizes canonical dark and light records", () => {
    const parsed = parseConfigJson(
      JSON.stringify({
        ...TEST_CONFIG,
        modes: {
          dark: { ...TEST_CONFIG.modes.dark, accent: "#36C" },
          light: { ...TEST_CONFIG.modes.light, accent: "#FC0" },
        },
      }),
    );
    expect(parsed.modes.dark.accent).toBe("#3366cc");
    expect(parsed.modes.light.accent).toBe("#ffcc00");
    expect(parseConfig(parsed)).toEqual(parsed);
  });

  it("rejects partial input", () => {
    expect(() => parseConfig({ mode: "dark", modes: { dark: TEST_CONFIG.modes.dark } })).toThrow(
      "config.modes.light",
    );
  });

  it("rejects a missing or invalid mode", () => {
    const { mode: _, ...input } = TEST_CONFIG;
    expect(() => parseConfigJson(JSON.stringify(input))).toThrow("config.mode");
    expect(() => parseConfigJson(JSON.stringify({ ...TEST_CONFIG, mode: "system" }))).toThrow(
      "config.mode",
    );
  });

  it("rejects invalid colors", () => {
    expect(() =>
      parseConfig({
        ...TEST_CONFIG,
        modes: {
          ...TEST_CONFIG.modes,
          light: { ...TEST_CONFIG.modes.light, surface: "definitely-not-a-color" },
        },
      }),
    ).toThrow("config.modes.light.surface");
  });

  it("rejects colors with transparency", () => {
    expect(() =>
      parseConfig({
        ...TEST_CONFIG,
        modes: {
          ...TEST_CONFIG.modes,
          light: { ...TEST_CONFIG.modes.light, surface: "#11223380" },
        },
      }),
    ).toThrow("config.modes.light.surface");
  });

  it("normalizes optional terminal seeds and token overrides", () => {
    const parsed = parseConfig({
      ...TEST_CONFIG,
      modes: {
        ...TEST_CONFIG.modes,
        light: {
          ...TEST_CONFIG.modes.light,
          terminal: { red: "#D13", brown: "#A70" },
          overrides: { foreground: "#ABC" },
        },
      },
    });
    expect(parsed.modes.light.terminal).toEqual({ red: "#dd1133", brown: "#aa7700" });
    expect(parsed.modes.light.overrides).toEqual({ foreground: "#aabbcc" });
  });

  it("rejects unknown fields", () => {
    expect(() => parseConfig({ ...TEST_CONFIG, legacy: true })).toThrow("config.legacy");
  });

  it("accepts only strict version 1 recipes", () => {
    expect(
      parseRecipe({
        version: 1,
        config: TEST_CONFIG,
        colors: { accent: "#36C" },
      }).colors.accent,
    ).toBe("#3366cc");
    expect(() => parseRecipe({ version: 2, config: TEST_CONFIG, colors: {} })).toThrow(
      "recipe.version",
    );
  });
});
