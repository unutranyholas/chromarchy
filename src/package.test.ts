import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { generatePalette } from "./palette/generate";
import { TEST_CONFIG } from "./test-fixtures";

function run(command: string, args: readonly string[], options: object = {}) {
  return spawnSync(command, args, { encoding: "utf8", ...options });
}

function waitFor(file: string, timeout = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = setInterval(() => {
      if (fs.existsSync(file)) {
        clearInterval(timer);
        resolve();
      } else if (Date.now() - started > timeout) {
        clearInterval(timer);
        reject(new Error(`Timed out waiting for ${file}`));
      }
    }, 20);
  });
}

describe("plugin package", () => {
  it("runs the clean release payload and deterministically rebuilds its bundle", async () => {
    const root = path.resolve(import.meta.dirname, "..");
    const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "chromarchy-package-"));
    const copy = path.join(temporary, "checkout");
    const bundle = path.join(root, "plugin/dist/palette-engine.mjs");
    const committedBundle = fs.readFileSync(bundle);
    const committedBundleMode = fs.statSync(bundle).mode;
    const packageVersion = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"))
      .version as string;

    try {
      const listed = run(
        "git",
        [
          "ls-files",
          "--cached",
          "--others",
          "--exclude-standard",
          "--",
          "plugin",
          "manifest.json",
          "README.md",
          "LICENSE",
          "preview.png",
        ],
        { cwd: root },
      );
      expect(listed.status).toBe(0);
      const files = listed.stdout
        .trim()
        .split("\n")
        .filter((file) => file && fs.existsSync(path.join(root, file)));
      expect(files).toContain("manifest.json");
      expect(files).toContain("plugin/dist/palette-engine.mjs");
      for (const file of files) {
        const source = path.join(root, file);
        const target = path.join(copy, file);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(source, target);
        fs.chmodSync(target, fs.statSync(source).mode);
      }

      const required = [
        "manifest.json",
        "README.md",
        "LICENSE",
        "preview.png",
        "plugin/bin/chromarchy",
        "plugin/chromarchy.py",
        "plugin/PaletteWorker.mjs",
        "plugin/dist/palette-engine.mjs",
        "plugin/Chromarchy.qml",
        "plugin/Ui/qmldir",
        "plugin/Ui/JsonProcess.qml",
        "plugin/Ui/PalettePreview.qml",
        "plugin/Ui/shaders/oklch.frag",
        "plugin/Ui/shaders/oklch.frag.qsb",
        "plugin/THIRD_PARTY_NOTICES.md",
      ];
      for (const file of required) expect(fs.existsSync(path.join(copy, file))).toBe(true);
      expect(fs.readFileSync(path.join(copy, "LICENSE"), "utf8")).toBe(
        fs.readFileSync(path.join(root, "LICENSE"), "utf8"),
      );
      expect(fs.statSync(path.join(copy, "plugin/bin/chromarchy")).mode & 0o111).not.toBe(0);
      expect(fs.readdirSync(path.join(copy, "plugin/dist"))).toEqual(["palette-engine.mjs"]);
      const paletteQml = fs.readFileSync(path.join(copy, "plugin/Chromarchy.qml"), "utf8");
      expect(paletteQml).toContain("property var draftConfig");
      expect(paletteQml).toContain("commitSeedEditors()");
      expect(paletteQml).toContain("WorkerScript {");
      expect(paletteQml).toContain('source: "PaletteWorker.mjs"');
      expect(paletteQml).toContain("root.undoAvailable = state.undoAvailable === true");
      expect(paletteQml).toContain('mutator.start([root.helper, "undo"], id)');
      expect(paletteQml).not.toContain('command: [root.helper, "worker"]');
      expect(paletteQml).not.toMatch(
        /darkSurfaceSeed|lightSurfaceSeed|darkTerminalSeeds|lightTerminalSeeds|modeSeedsInitialized/,
      );
      expect(fs.readFileSync(path.join(copy, "plugin/Ui/JsonProcess.qml"), "utf8")).toContain(
        "!root.stdoutFinished || !root.stderrFinished",
      );
      const validation = run("omarchy", ["plugin", "validate", copy]);
      expect(validation.status, validation.stderr || validation.stdout).toBe(0);

      const workerSmoke = path.join(copy, "plugin/WorkerSmoke.qml");
      fs.copyFileSync(path.join(root, "tests/WorkerSmoke.qml"), workerSmoke);
      const workerResult = run("timeout", ["10", "quickshell", "-p", workerSmoke]);
      expect(workerResult.status, workerResult.stderr || workerResult.stdout).toBe(0);
      fs.rmSync(workerSmoke);

      const wrapper = path.join(copy, "plugin/bin/chromarchy");
      expect(fs.readFileSync(wrapper, "utf8")).not.toContain("node");
      const version = run(wrapper, ["--version"], { cwd: copy });
      expect(version.status, version.stderr).toBe(0);
      expect(version.stdout).toBe(`${packageVersion}\n`);
      expect(JSON.parse(fs.readFileSync(path.join(copy, "manifest.json"), "utf8")).version).toBe(
        packageVersion,
      );
      expect(JSON.parse(run(wrapper, ["--smoke"], { cwd: copy }).stdout).ok).toBe(true);
      const recipe = {
        version: 1,
        config: TEST_CONFIG,
        colors: generatePalette(TEST_CONFIG).colors,
      };
      expect(run(wrapper, ["apply", "--recipe-json", "{}"], { cwd: copy }).status).toBe(1);

      const home = path.join(temporary, "home");
      const omarchy = path.join(temporary, "omarchy");
      const bin = path.join(temporary, "bin");
      const themeName = path.join(home, ".local/state/omarchy/current/theme.name");
      const stock = path.join(omarchy, "themes/test-theme/colors.toml");
      const fake = path.join(bin, "omarchy");
      fs.mkdirSync(path.dirname(themeName), { recursive: true });
      fs.mkdirSync(path.dirname(stock), { recursive: true });
      fs.mkdirSync(bin, { recursive: true });
      fs.writeFileSync(themeName, "test-theme\n");
      fs.writeFileSync(
        stock,
        'mode = "dark"\nbackground = "#111318"\nforeground = "#ffffff"\naccent = "#3d63dd"\nmuted = "#8b8d98"\n',
      );
      fs.writeFileSync(
        fake,
        `#!/bin/sh
set -eu
printf '%s\\n' "$3" > "$HOME/.local/state/omarchy/current/theme.name"
if [ -n "\${HOLD_FILE:-}" ] && [ "$3" = chromarchy ] && [ ! -e "$HOLD_FILE.once" ]; then
  : > "$HOLD_FILE.once"
  : > "$HOLD_FILE.entered"
  while [ ! -e "$HOLD_FILE.release" ]; do sleep 0.05; done
fi
`,
        { mode: 0o755 },
      );
      const env = {
        ...process.env,
        HOME: home,
        OMARCHY_PATH: omarchy,
        PATH: `${bin}:${process.env.PATH ?? ""}`,
      };
      const opened = run(wrapper, ["open"], { cwd: copy, env });
      expect(opened.status).toBe(0);
      expect(JSON.parse(opened.stdout).slug).toBe("test-theme");
      expect(fs.existsSync(path.join(home, ".config/omarchy/themes/chromarchy"))).toBe(false);
      expect(
        run(wrapper, ["apply", "--recipe-json", JSON.stringify(recipe)], {
          cwd: copy,
          env,
        }).status,
      ).toBe(0);
      expect(JSON.parse(run(wrapper, ["undo-status"], { cwd: copy, env }).stdout).available).toBe(
        true,
      );
      expect(run(wrapper, ["undo"], { cwd: copy, env }).status).toBe(0);

      const hold = path.join(temporary, "hold");
      const concurrentEnv = { ...env, HOLD_FILE: hold };
      const first = spawn(wrapper, ["apply", "--recipe-json", JSON.stringify(recipe)], {
        cwd: copy,
        env: concurrentEnv,
        stdio: ["ignore", "pipe", "pipe"],
      });
      const firstOutput = { stdout: "", stderr: "" };
      first.stdout.on("data", (chunk) => (firstOutput.stdout += String(chunk)));
      first.stderr.on("data", (chunk) => (firstOutput.stderr += String(chunk)));
      await waitFor(`${hold}.entered`);
      const recipeFile = path.join(home, ".local/state/omarchy/chromarchy/recipes/chromarchy.json");
      const undo = path.join(home, ".local/state/omarchy/chromarchy/undo.json");
      const before = {
        theme: fs.readFileSync(themeName, "utf8"),
        recipe: fs.existsSync(recipeFile) ? fs.readFileSync(recipeFile, "utf8") : null,
        undo: fs.existsSync(undo) ? fs.readFileSync(undo, "utf8") : null,
      };
      const second = run(wrapper, ["apply", "--recipe-json", JSON.stringify(recipe)], {
        cwd: copy,
        env: concurrentEnv,
      });
      expect(second.status).toBe(1);
      expect(second.stderr).toContain("already running");
      expect({
        theme: fs.readFileSync(themeName, "utf8"),
        recipe: fs.existsSync(recipeFile) ? fs.readFileSync(recipeFile, "utf8") : null,
        undo: fs.existsSync(undo) ? fs.readFileSync(undo, "utf8") : null,
      }).toEqual(before);
      fs.writeFileSync(`${hold}.release`, "");
      const firstStatus = await new Promise<number | null>((resolve) => first.on("close", resolve));
      expect(firstStatus, firstOutput.stderr).toBe(0);

      const pythonTests = run("/usr/bin/python3", ["-m", "unittest", "tests/test_chromarchy.py"], {
        cwd: root,
      });
      expect(pythonTests.status, pythonTests.stderr || pythonTests.stdout).toBe(0);

      const packed = run("pnpm", ["exec", "vp", "pack"], { cwd: root });
      expect(packed.status, packed.stderr).toBe(0);
      expect(fs.readFileSync(bundle)).toEqual(committedBundle);
    } finally {
      fs.writeFileSync(bundle, committedBundle);
      fs.chmodSync(bundle, committedBundleMode);
      fs.rmSync(temporary, { recursive: true, force: true });
    }
  }, 30000);
});
