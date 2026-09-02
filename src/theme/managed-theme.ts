import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

import type { ThemeState } from "../types";
import { runThemeSet } from "./command";
import { withMutationLock } from "./mutation-lock";
import { managedThemeSlug, resolveThemePaths, type RuntimeOptions } from "./paths";
import { currentThemeContext, getThemeState } from "./state";

function copyThemeLayer(source: string, target: string): void {
  if (!fs.existsSync(source)) return;
  fs.cpSync(source, target, {
    recursive: true,
    force: true,
    filter: (entry) => path.basename(entry) !== ".git",
  });
}

export function openManagedThemeUnlocked(options: RuntimeOptions = {}): ThemeState {
  const paths = resolveThemePaths(options);
  const slug = managedThemeSlug(options);
  const target = path.join(paths.userThemes, slug);
  const current = currentThemeContext(options);

  if (!fs.existsSync(target)) {
    const temporary = path.join(
      paths.userThemes,
      `.${slug}.${process.pid}.${randomBytes(6).toString("hex")}`,
    );
    fs.mkdirSync(paths.userThemes, { recursive: true });
    try {
      copyThemeLayer(path.join(paths.stockThemes, current.slug), temporary);
      copyThemeLayer(path.join(paths.userThemes, current.slug), temporary);
      if (!fs.existsSync(path.join(temporary, "colors.toml"))) {
        throw new Error(`Current theme '${current.slug}' cannot be copied: colors.toml is missing`);
      }
      fs.renameSync(temporary, target);
      runThemeSet(slug, options);
    } finally {
      fs.rmSync(temporary, { recursive: true, force: true });
    }
  } else if (current.slug !== slug) {
    runThemeSet(slug, options);
  }

  const state = getThemeState(options);
  if (state.slug !== slug) {
    throw new Error(`Theme activation returned '${state.slug}' instead of '${slug}'`);
  }
  return state;
}

export function openManagedTheme(options: RuntimeOptions = {}): ThemeState {
  return withMutationLock(() => openManagedThemeUnlocked(options), options);
}
