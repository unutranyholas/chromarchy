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
    entry: ["src/chromarchy.ts"],
    format: ["esm"],
    platform: "node",
    target: "node24",
    outDir: "plugin/dist",
    clean: true,
    sourcemap: false,
    dts: false,
    deps: {
      alwaysBundle: ["@radix-ui/colors", "bezier-easing", "colorjs.io", "valibot"],
      onlyBundle: ["@radix-ui/colors", "bezier-easing", "colorjs.io", "valibot"],
    },
  },
});
