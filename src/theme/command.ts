import { spawnSync } from "node:child_process";

import type { RuntimeOptions } from "./paths";

export function runThemeSet(slug: string, options: RuntimeOptions): void {
  if (options.runThemeSet) {
    options.runThemeSet(slug);
    return;
  }
  const result = spawnSync("omarchy", ["theme", "set", slug], {
    encoding: "utf8",
    env: options.env ?? process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      result.stderr.trim() || result.stdout.trim() || `omarchy theme set exited ${result.status}`,
    );
  }
}
