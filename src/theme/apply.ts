import fs from "node:fs";
import path from "node:path";

import { generatePalette } from "../palette/generate";
import { parseConfig } from "../palette/parse";
import type { MutationResult, PaletteConfig } from "../types";
import { atomicWrite } from "./atomic-write";
import { runThemeSet } from "./command";
import { openManagedThemeUnlocked } from "./managed-theme";
import { withMutationLock } from "./mutation-lock";
import { managedThemeSlug, resolveThemePaths, type RuntimeOptions, validateSlug } from "./paths";
import { renderPalette } from "./render";
import { currentThemeContext, getThemeState, savedRecipePath, undoStatus } from "./state";

interface FileSnapshot {
  existed: boolean;
  content?: string;
}

interface UndoSnapshot {
  version: 1;
  slug: string;
  target: FileSnapshot;
  recipe: FileSnapshot;
  createdAt: number;
}

function snapshotFile(file: string): FileSnapshot {
  return fs.existsSync(file)
    ? { existed: true, content: fs.readFileSync(file, "utf8") }
    : { existed: false };
}

function restoreFile(file: string, snapshot: FileSnapshot): void {
  if (snapshot.existed) {
    atomicWrite(file, snapshot.content ?? "");
    return;
  }
  fs.rmSync(file, { force: true });
  try {
    fs.rmdirSync(path.dirname(file));
  } catch {
    // The directory still has other state and must remain.
  }
}

function parseUndoSnapshot(raw: string): UndoSnapshot {
  const value = JSON.parse(raw) as Partial<UndoSnapshot>;
  if (
    value.version !== 1 ||
    typeof value.slug !== "string" ||
    !value.target ||
    typeof value.target.existed !== "boolean" ||
    (value.target.existed && typeof value.target.content !== "string") ||
    !value.recipe ||
    typeof value.recipe.existed !== "boolean" ||
    (value.recipe.existed && typeof value.recipe.content !== "string")
  ) {
    throw new Error("Undo snapshot is invalid");
  }
  return {
    version: 1,
    slug: validateSlug(value.slug),
    target: value.target,
    recipe: value.recipe,
    createdAt: typeof value.createdAt === "number" ? value.createdAt : 0,
  };
}

function applyPaletteUnlocked(input: PaletteConfig, options: RuntimeOptions): MutationResult {
  const config = parseConfig(input);
  const proposal = generatePalette(config);
  const context = currentThemeContext(options);
  const managedSlug = managedThemeSlug(options);
  if (context.slug !== managedSlug) {
    throw new Error(
      `Chromarchy only writes theme '${managedSlug}', current theme is '${context.slug}'`,
    );
  }
  const paths = resolveThemePaths(options);
  const configFile = savedRecipePath(context.slug, options);
  const snapshot: UndoSnapshot = {
    version: 1,
    slug: context.slug,
    target: snapshotFile(context.target),
    recipe: snapshotFile(configFile),
    createdAt: (options.now ?? Date.now)(),
  };
  const previousUndo = snapshotFile(paths.undo);
  const rendered = renderPalette(context.sourceText, proposal.mode, proposal.colors);

  atomicWrite(paths.undo, `${JSON.stringify(snapshot)}\n`);
  try {
    atomicWrite(context.target, rendered.text);
    atomicWrite(
      configFile,
      `${JSON.stringify({ version: 1, config, colors: proposal.colors }, null, 2)}\n`,
    );
    runThemeSet(context.slug, options);
  } catch (error) {
    restoreFile(context.target, snapshot.target);
    restoreFile(configFile, snapshot.recipe);
    restoreFile(paths.undo, previousUndo);
    try {
      runThemeSet(context.slug, options);
    } catch {
      // Preserve the original error; disk state has already been restored.
    }
    throw error;
  }

  return {
    ok: true,
    slug: context.slug,
    target: context.target,
    updated: rendered.updated,
    state: getThemeState(options),
  };
}

export function applyPalette(input: PaletteConfig, options: RuntimeOptions = {}): MutationResult {
  return withMutationLock(() => applyPaletteUnlocked(input, options), options);
}

export function applyManagedPalette(
  input: PaletteConfig,
  options: RuntimeOptions = {},
): MutationResult {
  return withMutationLock(() => {
    const previous = currentThemeContext(options);
    const managedSlug = managedThemeSlug(options);
    const managedDirectory = path.join(resolveThemePaths(options).userThemes, managedSlug);
    const managedExisted = fs.existsSync(managedDirectory);

    try {
      openManagedThemeUnlocked(options);
      return applyPaletteUnlocked(input, options);
    } catch (error) {
      const failures: unknown[] = [error];
      let restored = false;
      try {
        if (currentThemeContext(options).slug !== previous.slug) {
          runThemeSet(previous.slug, options);
        }
        const actual = currentThemeContext(options).slug;
        if (actual !== previous.slug) {
          throw new Error(`Theme restoration returned '${actual}' instead of '${previous.slug}'`);
        }
        restored = true;
      } catch (restorationError) {
        failures.push(restorationError);
      }

      if (!managedExisted && restored) {
        try {
          fs.rmSync(managedDirectory, { recursive: true, force: true });
        } catch (cleanupError) {
          failures.push(cleanupError);
        }
      }
      if (failures.length > 1) {
        throw new AggregateError(failures, "Palette apply failed and recovery was incomplete");
      }
      throw error;
    }
  }, options);
}

function undoPaletteUnlocked(options: RuntimeOptions): MutationResult {
  const paths = resolveThemePaths(options);
  if (!undoStatus(options).available) throw new Error("Nothing to undo for the current theme");
  const snapshot = parseUndoSnapshot(fs.readFileSync(paths.undo, "utf8"));
  const context = currentThemeContext(options);
  if (snapshot.slug !== context.slug) {
    throw new Error(`Undo belongs to theme '${snapshot.slug}', current theme is '${context.slug}'`);
  }

  const recipeFile = savedRecipePath(context.slug, options);
  const beforeTarget = snapshotFile(context.target);
  const beforeRecipe = snapshotFile(recipeFile);
  try {
    restoreFile(context.target, snapshot.target);
    restoreFile(recipeFile, snapshot.recipe);
    runThemeSet(context.slug, options);
  } catch (error) {
    restoreFile(context.target, beforeTarget);
    restoreFile(recipeFile, beforeRecipe);
    try {
      runThemeSet(context.slug, options);
    } catch {
      // Preserve the original failure and keep the undo snapshot.
    }
    throw error;
  }

  fs.rmSync(paths.undo, { force: true });
  return {
    ok: true,
    slug: context.slug,
    target: context.target,
    updated: [],
    state: getThemeState(options),
  };
}

export function undoPalette(options: RuntimeOptions = {}): MutationResult {
  return withMutationLock(() => undoPaletteUnlocked(options), options);
}
