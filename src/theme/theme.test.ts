import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { generatePalette } from "../palette/generate";
import { TEST_CONFIG } from "../test-fixtures";
import type { PaletteConfig } from "../types";
import { applyManagedPalette, applyPalette, undoPalette } from "./apply";
import { openManagedTheme } from "./managed-theme";
import { withMutationLock } from "./mutation-lock";
import { resolveThemePaths, type RuntimeOptions } from "./paths";
import { parseTheme, renderPalette } from "./render";
import { getThemeState, undoStatus } from "./state";

const BASE_COLORS = `mode = "dark"

accent = "#7c6af2"
selection = "#302a50"
muted = "#777777"
background = "#111318"
dark_background = "#0d0f13"
darker_background = "#090a0d"
lighter_background = "#1c1f26"
foreground = "#d8dae0"
dark_foreground = "#777b86"
light_foreground = "#e1e3e8"
bright_foreground = "#f0f1f4"
red = "#d05a5a"
yellow = "#b69124"
orange = "#c87831"
green = "#62a85d"
cyan = "#3aa3a3"
blue = "#6688cc"
magenta = "#b56abd"
brown = "#9a7350"
bright_red = "#ee7777"
bright_yellow = "#d3ad3c"
bright_green = "#7bc376"
bright_cyan = "#55bebe"
bright_blue = "#83a5e7"
bright_magenta = "#cf86d7"
hyprland_active_border = "rgba(7c6af2ff)"
`;

interface Sandbox {
  root: string;
  home: string;
  omarchyPath: string;
  stock: string;
  user: string;
  options: RuntimeOptions;
  calls: string[];
}

function sandbox(): Sandbox {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "chromarchy-"));
  const home = path.join(root, "home");
  const omarchyPath = path.join(root, "omarchy");
  const stock = path.join(omarchyPath, "themes/test-theme/colors.toml");
  const user = path.join(home, ".config/omarchy/themes/test-theme/colors.toml");
  const themeName = path.join(home, ".local/state/omarchy/current/theme.name");
  fs.mkdirSync(path.dirname(stock), { recursive: true });
  fs.mkdirSync(path.dirname(themeName), { recursive: true });
  fs.writeFileSync(stock, BASE_COLORS);
  fs.writeFileSync(path.join(path.dirname(stock), "preview.png"), "preview");
  fs.writeFileSync(themeName, "test-theme\n");
  const calls: string[] = [];
  return {
    root,
    home,
    omarchyPath,
    stock,
    user,
    calls,
    options: {
      home,
      omarchyPath,
      targetSlug: "test-theme",
      now: () => 123,
      runThemeSet: (slug) => calls.push(slug),
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("theme rendering", () => {
  it("replaces known keys, preserves comments and never touches hyprland values", () => {
    const proposal = generatePalette(TEST_CONFIG);
    const rendered = renderPalette(BASE_COLORS, "light", proposal.colors);
    expect(rendered.text).toContain('mode = "light"');
    expect(rendered.text).toContain(`accent = "${proposal.colors.accent}"`);
    expect(rendered.text).toContain('hyprland_active_border = "rgba(7c6af2ff)"');
    expect(parseTheme(rendered.text).colors.background).toBe(proposal.colors.background);
  });

  it("adds schema colors missing from an older theme", () => {
    const proposal = generatePalette(TEST_CONFIG);
    const rendered = renderPalette(BASE_COLORS.replace(/^brown.*\n/m, ""), "dark", proposal.colors);
    expect(rendered.text).toContain("# Added by Chromarchy");
    expect(rendered.text).toContain(`brown = "${proposal.colors.brown}"`);
  });
});

describe("theme state and mutations", () => {
  it("reads stock, then gives a user overlay priority", () => {
    const box = sandbox();
    try {
      expect(getThemeState(box.options).source).toBe(box.stock);
      fs.mkdirSync(path.dirname(box.user), { recursive: true });
      fs.writeFileSync(box.user, BASE_COLORS.replace("#7c6af2", "#123456"));
      const state = getThemeState(box.options);
      expect(state.source).toBe(box.user);
      expect(state.colors.accent).toBe("#123456");
    } finally {
      fs.rmSync(box.root, { recursive: true, force: true });
    }
  });

  it("applies to a user overlay and undoes a newly created overlay", () => {
    const box = sandbox();
    try {
      const result = applyPalette(TEST_CONFIG, box.options);
      expect(result.ok).toBe(true);
      expect(fs.existsSync(box.user)).toBe(true);
      expect(parseTheme(fs.readFileSync(box.user, "utf8")).colors).toEqual(
        generatePalette(TEST_CONFIG).colors,
      );
      expect(fs.readFileSync(box.stock, "utf8")).toBe(BASE_COLORS);
      expect(undoStatus(box.options).available).toBe(true);
      expect(box.calls).toEqual(["test-theme"]);

      undoPalette(box.options);
      expect(fs.existsSync(box.user)).toBe(false);
      expect(undoStatus(box.options).available).toBe(false);
      expect(box.calls).toEqual(["test-theme", "test-theme"]);
    } finally {
      fs.rmSync(box.root, { recursive: true, force: true });
    }
  });

  it("writes a versioned recipe with both appearance seed sets", () => {
    const box = sandbox();
    try {
      const config: PaletteConfig = {
        ...TEST_CONFIG,
        modes: {
          dark: {
            surface: "#111318",
            neutral: "#777b86",
            accent: "#7c6af2",
            terminal: { red: "#d13415" },
          },
          light: {
            surface: "#f9fafb",
            neutral: "#8b8d98",
            accent: "#ffcc00",
            terminal: { blue: "#3e63dd" },
          },
        },
      };

      applyPalette(config, box.options);
      const recipeFile = path.join(
        box.home,
        ".local/state/omarchy/chromarchy/recipes/test-theme.json",
      );
      const recipe = JSON.parse(fs.readFileSync(recipeFile, "utf8")) as {
        version: number;
        config: PaletteConfig;
      };

      expect(recipe.version).toBe(1);
      expect(recipe.config.modes).toEqual(config.modes);
      expect(getThemeState(box.options).config.modes).toEqual(config.modes);
    } finally {
      fs.rmSync(box.root, { recursive: true, force: true });
    }
  });

  it("infers terminal seeds from an unmanaged theme", () => {
    const box = sandbox();
    try {
      expect(getThemeState(box.options).config.modes.dark.terminal).toEqual({
        red: "#d05a5a",
        yellow: "#b69124",
        green: "#62a85d",
        cyan: "#3aa3a3",
        blue: "#6688cc",
        magenta: "#b56abd",
        orange: "#c87831",
        brown: "#9a7350",
      });
    } finally {
      fs.rmSync(box.root, { recursive: true, force: true });
    }
  });

  it("keeps versioned authored seeds when the generator output changes", () => {
    const box = sandbox();
    try {
      applyPalette(TEST_CONFIG, box.options);
      const recipeFile = path.join(
        box.home,
        ".local/state/omarchy/chromarchy/recipes/test-theme.json",
      );
      const recipe = JSON.parse(fs.readFileSync(recipeFile, "utf8")) as {
        version: number;
        config: PaletteConfig;
        colors: Record<string, string>;
      };
      recipe.config.modes.light.accent = "#4477ff";
      fs.writeFileSync(recipeFile, `${JSON.stringify(recipe)}\n`);

      expect(getThemeState(box.options).config.modes.light.accent).toBe("#4477ff");
    } finally {
      fs.rmSync(box.root, { recursive: true, force: true });
    }
  });

  it("infers seeds after the generated theme is edited externally", () => {
    const box = sandbox();
    try {
      applyPalette(TEST_CONFIG, box.options);
      const edited = fs
        .readFileSync(box.user, "utf8")
        .replace(/^accent = ".*"$/m, 'accent = "#123456"');
      fs.writeFileSync(box.user, edited);

      expect(getThemeState(box.options).config.modes.light.accent).toBe("#123456");
    } finally {
      fs.rmSync(box.root, { recursive: true, force: true });
    }
  });

  it("restores an existing overlay and its saved recipe", () => {
    const box = sandbox();
    try {
      fs.mkdirSync(path.dirname(box.user), { recursive: true });
      const original = BASE_COLORS.replace("#7c6af2", "#123456");
      fs.writeFileSync(box.user, original);
      const recipeFile = path.join(
        box.home,
        ".local/state/omarchy/chromarchy/recipes/test-theme.json",
      );
      fs.mkdirSync(path.dirname(recipeFile), { recursive: true });
      fs.writeFileSync(recipeFile, '{"old":true}\n');

      const changed: PaletteConfig = {
        ...TEST_CONFIG,
        modes: {
          ...TEST_CONFIG.modes,
          light: { ...TEST_CONFIG.modes.light, accent: "#ffcc00" },
        },
      };
      applyPalette(changed, box.options);
      undoPalette(box.options);
      expect(fs.readFileSync(box.user, "utf8")).toBe(original);
      expect(fs.readFileSync(recipeFile, "utf8")).toBe('{"old":true}\n');
    } finally {
      fs.rmSync(box.root, { recursive: true, force: true });
    }
  });

  it("rolls back target, recipe, and previous undo after an atomic recipe write fails", () => {
    const box = sandbox();
    try {
      fs.mkdirSync(path.dirname(box.user), { recursive: true });
      fs.writeFileSync(box.user, BASE_COLORS);
      const paths = resolveThemePaths(box.options);
      const recipe = path.join(paths.recipes, "test-theme.json");
      fs.mkdirSync(path.dirname(recipe), { recursive: true });
      fs.writeFileSync(recipe, '{"previous":true}\n');
      fs.mkdirSync(path.dirname(paths.undo), { recursive: true });
      fs.writeFileSync(paths.undo, '{"olderUndo":true}\n');
      const rename = fs.renameSync.bind(fs);
      let injected = false;
      vi.spyOn(fs, "renameSync").mockImplementation((source, target) => {
        if (!injected && target === recipe) {
          injected = true;
          throw new Error("injected recipe rename failure");
        }
        rename(source, target);
      });

      expect(() => applyPalette(TEST_CONFIG, box.options)).toThrow(
        "injected recipe rename failure",
      );
      expect(fs.readFileSync(box.user, "utf8")).toBe(BASE_COLORS);
      expect(fs.readFileSync(recipe, "utf8")).toBe('{"previous":true}\n');
      expect(fs.readFileSync(paths.undo, "utf8")).toBe('{"olderUndo":true}\n');
      expect(fs.existsSync(paths.mutationLock)).toBe(false);
    } finally {
      fs.rmSync(box.root, { recursive: true, force: true });
    }
  });

  it("rolls back target, recipe, and previous undo when theme application fails", () => {
    const box = sandbox();
    try {
      fs.mkdirSync(path.dirname(box.user), { recursive: true });
      fs.writeFileSync(box.user, BASE_COLORS);
      const undoFile = path.join(box.home, ".local/state/omarchy/chromarchy/undo.json");
      fs.mkdirSync(path.dirname(undoFile), { recursive: true });
      fs.writeFileSync(undoFile, '{"previous":true}\n');
      box.options.runThemeSet = () => {
        throw new Error("fake theme failure");
      };

      expect(() => applyPalette(TEST_CONFIG, box.options)).toThrow("fake theme failure");
      expect(fs.readFileSync(box.user, "utf8")).toBe(BASE_COLORS);
      expect(fs.readFileSync(undoFile, "utf8")).toBe('{"previous":true}\n');
    } finally {
      fs.rmSync(box.root, { recursive: true, force: true });
    }
  });

  it("rolls back a failed undo and retains its snapshot and lock discipline", () => {
    const box = sandbox();
    try {
      applyPalette(TEST_CONFIG, box.options);
      const paths = resolveThemePaths(box.options);
      const recipe = path.join(paths.recipes, "test-theme.json");
      const beforeTarget = fs.readFileSync(box.user, "utf8");
      const beforeRecipe = fs.readFileSync(recipe, "utf8");
      const beforeUndo = fs.readFileSync(paths.undo, "utf8");
      box.options.runThemeSet = () => {
        expect(fs.existsSync(paths.mutationLock)).toBe(true);
        throw new Error("undo activation failed");
      };

      expect(() => undoPalette(box.options)).toThrow("undo activation failed");
      expect(fs.readFileSync(box.user, "utf8")).toBe(beforeTarget);
      expect(fs.readFileSync(recipe, "utf8")).toBe(beforeRecipe);
      expect(fs.readFileSync(paths.undo, "utf8")).toBe(beforeUndo);
      expect(fs.existsSync(paths.mutationLock)).toBe(false);
    } finally {
      fs.rmSync(box.root, { recursive: true, force: true });
    }
  });

  it("refuses undo after the current theme changes", () => {
    const box = sandbox();
    try {
      applyPalette(TEST_CONFIG, box.options);
      fs.writeFileSync(
        path.join(box.home, ".local/state/omarchy/current/theme.name"),
        "other-theme\n",
      );
      expect(undoStatus(box.options).available).toBe(false);
      expect(() => undoPalette(box.options)).toThrow("Nothing to undo");
    } finally {
      fs.rmSync(box.root, { recursive: true, force: true });
    }
  });

  it("refuses an undo snapshot with missing file content", () => {
    const box = sandbox();
    try {
      fs.mkdirSync(path.dirname(box.user), { recursive: true });
      fs.writeFileSync(box.user, BASE_COLORS);
      const undo = resolveThemePaths(box.options).undo;
      fs.mkdirSync(path.dirname(undo), { recursive: true });
      fs.writeFileSync(
        undo,
        JSON.stringify({
          version: 1,
          slug: "test-theme",
          target: { existed: true },
          recipe: { existed: false },
          createdAt: 123,
        }),
      );

      expect(() => undoPalette(box.options)).toThrow("Undo snapshot is invalid");
      expect(fs.readFileSync(box.user, "utf8")).toBe(BASE_COLORS);
    } finally {
      fs.rmSync(box.root, { recursive: true, force: true });
    }
  });

  it("can delegate to a fake omarchy executable through PATH", () => {
    const box = sandbox();
    try {
      const bin = path.join(box.root, "bin");
      const executable = path.join(bin, "omarchy");
      const calls = path.join(box.root, "omarchy.calls");
      fs.mkdirSync(bin, { recursive: true });
      fs.writeFileSync(executable, '#!/bin/sh\nprintf "%s\\n" "$*" >> "$CALLS_FILE"\n', {
        mode: 0o755,
      });
      const options: RuntimeOptions = {
        home: box.home,
        omarchyPath: box.omarchyPath,
        targetSlug: "test-theme",
        env: {
          ...process.env,
          HOME: box.home,
          OMARCHY_PATH: box.omarchyPath,
          PATH: `${bin}:${process.env.PATH ?? ""}`,
          CALLS_FILE: calls,
        },
      };

      applyPalette(TEST_CONFIG, options);
      expect(fs.readFileSync(calls, "utf8")).toBe("theme set test-theme\n");
    } finally {
      fs.rmSync(box.root, { recursive: true, force: true });
    }
  });
});

describe("managed Chromarchy theme", () => {
  it("reads the current theme without creating or activating a managed copy", () => {
    const box = sandbox();
    try {
      const state = getThemeState(box.options);
      expect(state.slug).toBe("test-theme");
      expect(box.calls).toEqual([]);
      expect(fs.existsSync(path.join(box.home, ".config/omarchy/themes/chromarchy"))).toBe(false);
      expect(fs.existsSync(resolveThemePaths(box.options).chromarchyState)).toBe(false);
    } finally {
      fs.rmSync(box.root, { recursive: true, force: true });
    }
  });

  it("creates and activates the managed copy only during explicit apply", () => {
    const box = sandbox();
    try {
      const themeName = path.join(box.home, ".local/state/omarchy/current/theme.name");
      const options: RuntimeOptions = {
        home: box.home,
        omarchyPath: box.omarchyPath,
        targetSlug: "chromarchy",
        runThemeSet: (slug) => {
          box.calls.push(slug);
          fs.writeFileSync(themeName, `${slug}\n`);
        },
      };

      const result = applyManagedPalette(TEST_CONFIG, options);
      expect(result.slug).toBe("chromarchy");
      expect(box.calls).toEqual(["chromarchy", "chromarchy"]);
    } finally {
      fs.rmSync(box.root, { recursive: true, force: true });
    }
  });

  it("copies the current theme once and activates the copy", () => {
    const box = sandbox();
    try {
      const themeName = path.join(box.home, ".local/state/omarchy/current/theme.name");
      const options: RuntimeOptions = {
        home: box.home,
        omarchyPath: box.omarchyPath,
        targetSlug: "chromarchy",
        runThemeSet: (slug) => {
          box.calls.push(slug);
          fs.writeFileSync(themeName, `${slug}\n`);
        },
      };

      const state = openManagedTheme(options);
      const target = path.join(box.home, ".config/omarchy/themes/chromarchy");
      expect(state.slug).toBe("chromarchy");
      expect(state.name).toBe("Chromarchy");
      expect(fs.readFileSync(path.join(target, "colors.toml"), "utf8")).toBe(BASE_COLORS);
      expect(fs.readFileSync(path.join(target, "preview.png"), "utf8")).toBe("preview");
      expect(box.calls).toEqual(["chromarchy"]);
    } finally {
      fs.rmSync(box.root, { recursive: true, force: true });
    }
  });

  it("reactivates an existing copy without overwriting it", () => {
    const box = sandbox();
    try {
      const themeName = path.join(box.home, ".local/state/omarchy/current/theme.name");
      const target = path.join(box.home, ".config/omarchy/themes/chromarchy");
      fs.mkdirSync(target, { recursive: true });
      const customized = BASE_COLORS.replace("#7c6af2", "#ffcc00");
      fs.writeFileSync(path.join(target, "colors.toml"), customized);
      const options: RuntimeOptions = {
        home: box.home,
        omarchyPath: box.omarchyPath,
        targetSlug: "chromarchy",
        runThemeSet: (slug) => {
          box.calls.push(slug);
          fs.writeFileSync(themeName, `${slug}\n`);
        },
      };

      openManagedTheme(options);
      expect(fs.readFileSync(path.join(target, "colors.toml"), "utf8")).toBe(customized);
      expect(box.calls).toEqual(["chromarchy"]);
    } finally {
      fs.rmSync(box.root, { recursive: true, force: true });
    }
  });

  it("restores the previous theme before cleaning up a partially activated new copy", () => {
    const box = sandbox();
    try {
      const themeName = path.join(box.home, ".local/state/omarchy/current/theme.name");
      const managed = path.join(box.home, ".config/omarchy/themes/chromarchy");
      const options: RuntimeOptions = {
        home: box.home,
        omarchyPath: box.omarchyPath,
        runThemeSet: (slug) => {
          fs.writeFileSync(themeName, `${slug}\n`);
          if (slug === "chromarchy") throw new Error("activation failed after selection");
        },
      };

      expect(() => applyManagedPalette(TEST_CONFIG, options)).toThrow(
        "activation failed after selection",
      );
      expect(fs.readFileSync(themeName, "utf8")).toBe("test-theme\n");
      expect(fs.existsSync(managed)).toBe(false);
      expect(fs.existsSync(resolveThemePaths(options).mutationLock)).toBe(false);
    } finally {
      fs.rmSync(box.root, { recursive: true, force: true });
    }
  });

  it("retains a possibly active new copy when previous-theme restoration fails", () => {
    const box = sandbox();
    try {
      const themeName = path.join(box.home, ".local/state/omarchy/current/theme.name");
      const managed = path.join(box.home, ".config/omarchy/themes/chromarchy");
      const options: RuntimeOptions = {
        home: box.home,
        omarchyPath: box.omarchyPath,
        runThemeSet: (slug) => {
          if (slug === "chromarchy") fs.writeFileSync(themeName, `${slug}\n`);
          throw new Error(`cannot activate ${slug}`);
        },
      };

      expect(() => applyManagedPalette(TEST_CONFIG, options)).toThrow(AggregateError);
      expect(fs.readFileSync(themeName, "utf8")).toBe("chromarchy\n");
      expect(fs.existsSync(managed)).toBe(true);
      expect(fs.existsSync(resolveThemePaths(options).mutationLock)).toBe(false);
    } finally {
      fs.rmSync(box.root, { recursive: true, force: true });
    }
  });

  it("retains a new copy when restoration reports success but selects the wrong theme", () => {
    const box = sandbox();
    try {
      const themeName = path.join(box.home, ".local/state/omarchy/current/theme.name");
      const managed = path.join(box.home, ".config/omarchy/themes/chromarchy");
      const options: RuntimeOptions = {
        home: box.home,
        omarchyPath: box.omarchyPath,
        runThemeSet: (slug) => {
          if (slug === "chromarchy") {
            fs.writeFileSync(themeName, `${slug}\n`);
            throw new Error("activation failed");
          }
          // Simulate a command that exits successfully without restoring theme.name.
        },
      };

      expect(() => applyManagedPalette(TEST_CONFIG, options)).toThrow(AggregateError);
      expect(fs.readFileSync(themeName, "utf8")).toBe("chromarchy\n");
      expect(fs.existsSync(managed)).toBe(true);
    } finally {
      fs.rmSync(box.root, { recursive: true, force: true });
    }
  });

  it("never deletes an existing managed copy after activation failure", () => {
    const box = sandbox();
    try {
      const themeName = path.join(box.home, ".local/state/omarchy/current/theme.name");
      const managed = path.join(box.home, ".config/omarchy/themes/chromarchy");
      fs.mkdirSync(managed, { recursive: true });
      fs.writeFileSync(path.join(managed, "colors.toml"), BASE_COLORS);
      const options: RuntimeOptions = {
        home: box.home,
        omarchyPath: box.omarchyPath,
        runThemeSet: (slug) => {
          fs.writeFileSync(themeName, `${slug}\n`);
          if (slug === "chromarchy") throw new Error("existing activation failed");
        },
      };

      expect(() => applyManagedPalette(TEST_CONFIG, options)).toThrow("existing activation failed");
      expect(fs.existsSync(path.join(managed, "colors.toml"))).toBe(true);
    } finally {
      fs.rmSync(box.root, { recursive: true, force: true });
    }
  });
});

describe("mutation lock", () => {
  function writeLock(box: Sandbox, owner: unknown): string {
    const lock = resolveThemePaths(box.options).mutationLock;
    fs.mkdirSync(lock, { recursive: true });
    fs.writeFileSync(path.join(lock, "owner.json"), `${JSON.stringify(owner)}\n`);
    return lock;
  }

  it("rejects a live lock before changing files and fails closed on malformed ownership", () => {
    const box = sandbox();
    try {
      const lock = writeLock(box, { pid: process.pid, token: "live" });

      expect(() => applyPalette(TEST_CONFIG, box.options)).toThrow("already running");
      expect(fs.existsSync(box.user)).toBe(false);
      expect(fs.existsSync(resolveThemePaths(box.options).undo)).toBe(false);
      fs.rmSync(lock, { recursive: true });
      writeLock(box, { broken: true });
      expect(() => applyPalette(TEST_CONFIG, box.options)).toThrow(lock);
      expect(fs.existsSync(box.user)).toBe(false);
    } finally {
      fs.rmSync(box.root, { recursive: true, force: true });
    }
  });

  it("fails closed on a stale lock until it is removed manually", () => {
    const box = sandbox();
    try {
      const lock = writeLock(box, { pid: 2147483647, token: "stale" });
      expect(() => applyPalette(TEST_CONFIG, box.options)).toThrow("left a lock");
      expect(fs.existsSync(box.user)).toBe(false);
      fs.rmSync(lock, { recursive: true });
      expect(applyPalette(TEST_CONFIG, box.options).ok).toBe(true);
      expect(fs.existsSync(lock)).toBe(false);
    } finally {
      fs.rmSync(box.root, { recursive: true, force: true });
    }
  });

  it("does not release a lock whose ownership token changed", () => {
    const box = sandbox();
    try {
      const lock = resolveThemePaths(box.options).mutationLock;
      withMutationLock(() => {
        const ownerFile = path.join(lock, "owner.json");
        const owner = JSON.parse(fs.readFileSync(ownerFile, "utf8")) as Record<string, unknown>;
        fs.writeFileSync(ownerFile, `${JSON.stringify({ ...owner, token: "replacement" })}\n`);
      }, box.options);
      expect(fs.existsSync(lock)).toBe(true);
      fs.rmSync(lock, { recursive: true });
    } finally {
      fs.rmSync(box.root, { recursive: true, force: true });
    }
  });

  it("holds the lock through activation and rollback and releases it after failure", () => {
    const box = sandbox();
    try {
      const lock = resolveThemePaths(box.options).mutationLock;
      const observations: boolean[] = [];
      box.options.runThemeSet = () => {
        observations.push(fs.existsSync(lock));
        throw new Error("activation failure");
      };
      expect(() => applyPalette(TEST_CONFIG, box.options)).toThrow("activation failure");
      expect(observations).toEqual([true, true]);
      expect(fs.existsSync(lock)).toBe(false);
      expect(fs.existsSync(box.user)).toBe(false);
    } finally {
      fs.rmSync(box.root, { recursive: true, force: true });
    }
  });
});
