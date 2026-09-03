import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  test: {
    globals: true,
    include: ["src/**/*.test.ts"],
  },
  pack: {
    entry: ["src/palette-engine.mts"],
    format: ["esm"],
    platform: "neutral",
    target: "es2015",
    fixedExtension: true,
    outDir: "plugin/dist",
    clean: true,
    sourcemap: false,
    dts: false,
    deps: {
      alwaysBundle: ["@radix-ui/colors", "bezier-easing"],
      onlyBundle: ["@radix-ui/colors", "bezier-easing"],
    },
  },
});
