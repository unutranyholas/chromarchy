import type { PaletteConfig } from "./types";

export const TEST_CONFIG: PaletteConfig = {
  mode: "light",
  modes: {
    dark: {
      surface: "#111318",
      neutral: "#8b8d98",
      accent: "#3d63dd",
      terminal: {},
    },
    light: {
      surface: "#eff1f5",
      neutral: "#8b8d98",
      accent: "#ffcc00",
      terminal: {},
    },
  },
};
