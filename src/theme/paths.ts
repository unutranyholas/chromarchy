import path from "node:path";

export interface ThemePaths {
  home: string;
  omarchyPath: string;
  currentDir: string;
  currentThemeName: string;
  stockThemes: string;
  userThemes: string;
  chromarchyState: string;
  mutationLock: string;
  undo: string;
  recipes: string;
}

export interface RuntimeOptions {
  env?: NodeJS.ProcessEnv;
  home?: string;
  omarchyPath?: string;
  now?: () => number;
  runThemeSet?: (slug: string) => void;
  targetSlug?: string;
}

export function resolveThemePaths(options: RuntimeOptions = {}): ThemePaths {
  const env = options.env ?? process.env;
  const home = path.resolve(options.home ?? env.HOME ?? "");
  if (!home || home === path.parse(home).root) {
    throw new Error("HOME is not set to a usable directory");
  }

  const omarchyPath = path.resolve(options.omarchyPath ?? env.OMARCHY_PATH ?? "/usr/share/omarchy");
  const currentDir = path.join(home, ".local/state/omarchy/current");
  const chromarchyState = path.join(home, ".local/state/omarchy/chromarchy");

  return {
    home,
    omarchyPath,
    currentDir,
    currentThemeName: path.join(currentDir, "theme.name"),
    stockThemes: path.join(omarchyPath, "themes"),
    userThemes: path.join(home, ".config/omarchy/themes"),
    chromarchyState,
    mutationLock: path.join(chromarchyState, "mutation.lock"),
    undo: path.join(chromarchyState, "undo.json"),
    recipes: path.join(chromarchyState, "recipes"),
  };
}

export function validateSlug(value: string): string {
  const slug = value.trim();
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    throw new Error(`Invalid current theme slug '${slug}'`);
  }
  return slug;
}

export function managedThemeSlug(options: RuntimeOptions = {}): string {
  return validateSlug(options.targetSlug ?? "chromarchy");
}
