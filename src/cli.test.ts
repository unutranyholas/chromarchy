import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { TEST_CONFIG } from "./test-fixtures";
import { main, smokeColor, VERSION } from "./cli";

function invoke(args: readonly string[]): { code: number; stdout: string; stderr: string } {
  let stdout = "";
  let stderr = "";
  const stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
    stdout += String(chunk);
    return true;
  });
  const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
    stderr += String(chunk);
    return true;
  });
  try {
    return { code: main(args), stdout, stderr };
  } finally {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  }
}

describe("Chromarchy CLI", () => {
  it("supports version, smoke, usage, and unknown-command contracts", () => {
    expect(VERSION).toBe("0.8.0");
    expect(smokeColor()).toMatch(/^#[0-9a-f]{6}$/);
    expect(invoke(["--version"])).toEqual({ code: 0, stdout: "0.8.0\n", stderr: "" });
    expect(JSON.parse(invoke(["--smoke"]).stdout)).toEqual({
      ok: true,
      hex: expect.stringMatching(/^#[0-9a-f]{6}$/),
    });
    expect(invoke([]).code).toBe(2);
    expect(invoke(["unknown"]).stderr).toContain("Usage: chromarchy");
  });

  it("generates from canonical input and rejects invalid input", () => {
    const canonical = invoke(["generate", "--config-json", JSON.stringify(TEST_CONFIG)]);
    expect(canonical.code).toBe(0);
    expect(JSON.parse(canonical.stdout).config).toEqual(TEST_CONFIG);

    const invalid = invoke([
      "generate",
      "--config-json",
      JSON.stringify({ mode: "dark", modes: { dark: TEST_CONFIG.modes.dark } }),
    ]);
    expect(invalid.code).toBe(1);
    expect(invalid.stderr).toContain("config.modes.light");
  });

  it("dispatches isolated open, apply, undo-status, and undo", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "chromarchy-cli-"));
    const home = path.join(root, "home");
    const omarchy = path.join(root, "omarchy");
    const themeName = path.join(home, ".local/state/omarchy/current/theme.name");
    const stock = path.join(omarchy, "themes/test-theme/colors.toml");
    const bin = path.join(root, "bin");
    fs.mkdirSync(path.dirname(themeName), { recursive: true });
    fs.mkdirSync(path.dirname(stock), { recursive: true });
    fs.mkdirSync(bin, { recursive: true });
    fs.writeFileSync(themeName, "test-theme\n");
    fs.writeFileSync(
      stock,
      'mode = "dark"\nbackground = "#111318"\nforeground = "#ffffff"\naccent = "#3d63dd"\nmuted = "#8b8d98"\n',
    );
    fs.writeFileSync(
      path.join(bin, "omarchy"),
      '#!/bin/sh\nprintf "%s\\n" "$3" > "$HOME/.local/state/omarchy/current/theme.name"\n',
      { mode: 0o755 },
    );
    const previous = { ...process.env };
    process.env.HOME = home;
    process.env.OMARCHY_PATH = omarchy;
    process.env.PATH = `${bin}:${previous.PATH ?? ""}`;
    try {
      const opened = invoke(["open"]);
      expect(opened.code).toBe(0);
      expect(JSON.parse(opened.stdout).slug).toBe("test-theme");
      expect(fs.existsSync(path.join(home, ".config/omarchy/themes/chromarchy"))).toBe(false);

      const applied = invoke(["apply", "--config-json", JSON.stringify(TEST_CONFIG)]);
      expect(applied.code).toBe(0);
      expect(JSON.parse(applied.stdout).slug).toBe("chromarchy");
      expect(JSON.parse(invoke(["undo-status"]).stdout).available).toBe(true);
      expect(invoke(["undo"]).code).toBe(0);
      expect(JSON.parse(invoke(["undo-status"]).stdout).available).toBe(false);
    } finally {
      process.env = previous;
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
