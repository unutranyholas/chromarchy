#!/usr/bin/python3

import json
import os
import re
import secrets
import shutil
import subprocess
import sys
import time
from pathlib import Path

VERSION = "0.9.0"
MANAGED_SLUG = "chromarchy"
TERMINAL_NAMES = ("red", "yellow", "green", "cyan", "blue", "magenta", "orange", "brown")
COLOR_NAMES = (
    "accent",
    "selection",
    "muted",
    "background",
    "dark_background",
    "darker_background",
    "lighter_background",
    "foreground",
    "dark_foreground",
    "light_foreground",
    "bright_foreground",
    "red",
    "yellow",
    "orange",
    "green",
    "cyan",
    "blue",
    "magenta",
    "brown",
    "bright_red",
    "bright_yellow",
    "bright_green",
    "bright_cyan",
    "bright_blue",
    "bright_magenta",
)
COLOR_LINE = re.compile(
    r'^(\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*=\s*)"([^"]*)"(\s*(?:#.*)?)$'
)
HEX = re.compile(r"^#(?:[0-9a-f]{3}|[0-9a-f]{6})$", re.IGNORECASE)
SLUG = re.compile(r"^[a-z0-9][a-z0-9-]*$")


def object_value(value, label):
    if not isinstance(value, dict):
        raise TypeError(f"{label} must be an object")
    return value


def strict(value, keys, label):
    unknown = next((key for key in value if key not in keys), None)
    if unknown:
        raise TypeError(f"{label}.{unknown} is not allowed")


def color(value, label):
    if not isinstance(value, str):
        raise TypeError(f"{label} must be a color string")
    if not HEX.fullmatch(value):
        raise TypeError(f"{label} must be a valid opaque color")
    digits = value[1:]
    if len(digits) == 3:
        digits = "".join(character * 2 for character in digits)
    return f"#{digits.lower()}"


def color_record(value, keys, label, require_all=False):
    value = object_value(value, label)
    strict(value, keys, label)
    if require_all:
        missing = next((key for key in keys if key not in value), None)
        if missing:
            raise TypeError(f"{label}.{missing} is required")
    return {key: color(item, f"{label}.{key}") for key, item in value.items()}


def parse_seeds(value, label):
    value = object_value(value, label)
    strict(value, ("surface", "neutral", "accent", "terminal", "overrides"), label)
    result = {
        "surface": color(value.get("surface"), f"{label}.surface"),
        "neutral": color(value.get("neutral"), f"{label}.neutral"),
        "accent": color(value.get("accent"), f"{label}.accent"),
        "terminal": color_record(value.get("terminal"), TERMINAL_NAMES, f"{label}.terminal"),
    }
    if "overrides" in value:
        result["overrides"] = color_record(
            value["overrides"], COLOR_NAMES, f"{label}.overrides"
        )
    return result


def parse_config(value):
    value = object_value(value, "config")
    strict(value, ("mode", "modes"), "config")
    mode = value.get("mode")
    if mode not in ("dark", "light"):
        raise TypeError('config.mode must be "dark" or "light"')
    modes = object_value(value.get("modes"), "config.modes")
    strict(modes, ("dark", "light"), "config.modes")
    return {
        "mode": mode,
        "modes": {
            "dark": parse_seeds(modes.get("dark"), "config.modes.dark"),
            "light": parse_seeds(modes.get("light"), "config.modes.light"),
        },
    }


def parse_recipe(value, require_all=False):
    value = object_value(value, "recipe")
    strict(value, ("version", "config", "colors"), "recipe")
    if value.get("version") != 1:
        raise TypeError("recipe.version must be version 1")
    return {
        "version": 1,
        "config": parse_config(value.get("config")),
        "colors": color_record(
            value.get("colors"), COLOR_NAMES, "recipe.colors", require_all=require_all
        ),
    }


def paths():
    home_raw = os.environ.get("HOME", "")
    if not home_raw:
        raise RuntimeError("HOME is not set to a usable directory")
    home = Path(home_raw).resolve()
    if home == home.parent:
        raise RuntimeError("HOME is not set to a usable directory")
    omarchy = Path(os.environ.get("OMARCHY_PATH", "/usr/share/omarchy")).resolve()
    state = home / ".local/state/omarchy/chromarchy"
    return {
        "home": home,
        "omarchy": omarchy,
        "theme_name": home / ".local/state/omarchy/current/theme.name",
        "stock_themes": omarchy / "themes",
        "user_themes": home / ".config/omarchy/themes",
        "state": state,
        "lock": state / "mutation.lock",
        "undo": state / "undo.json",
        "recipes": state / "recipes",
    }


def validate_slug(value):
    slug = value.strip()
    if not SLUG.fullmatch(slug):
        raise RuntimeError(f"Invalid current theme slug '{slug}'")
    return slug


def current_context():
    locations = paths()
    if not locations["theme_name"].exists():
        raise RuntimeError("No current Omarchy theme")
    slug = validate_slug(locations["theme_name"].read_text())
    target = locations["user_themes"] / slug / "colors.toml"
    stock = locations["stock_themes"] / slug / "colors.toml"
    source = target if target.exists() else stock
    if not source.exists():
        raise RuntimeError(f"Theme '{slug}' has no colors.toml")
    return {
        "slug": slug,
        "source": source,
        "target": target,
        "source_text": source.read_text(),
    }


def parse_theme(source):
    mode = None
    colors = {}
    for line in source.splitlines():
        match = COLOR_LINE.fullmatch(line)
        if not match:
            continue
        key, raw = match.group(2), match.group(4)
        if key == "mode":
            if raw in ("dark", "light"):
                mode = raw
        elif re.fullmatch(r"#[0-9a-f]{6}", raw, re.IGNORECASE):
            colors[key] = color(raw, key)
    if not mode:
        raise RuntimeError("colors.toml has no valid mode key")
    if not all(key in colors for key in ("background", "foreground", "accent")):
        raise RuntimeError("colors.toml is missing background, foreground, or accent")
    return mode, colors


def default_seeds(mode):
    return {
        "surface": "#111318" if mode == "dark" else "#f9fafb",
        "neutral": "#8b8d98",
        "accent": "#3d63dd",
        "terminal": {},
    }


def inferred_config(mode, colors):
    surface = colors.get("lighter_background", colors.get("background"))
    accent = colors.get("accent")
    if not surface or not accent:
        raise RuntimeError("Theme is missing background or accent")
    terminal = {name: colors[name] for name in TERMINAL_NAMES if name in colors}
    active = {
        "surface": surface,
        "neutral": colors.get(
            "muted", colors.get("dark_foreground", colors.get("foreground", "#8b8d98"))
        ),
        "accent": accent,
        "terminal": terminal,
    }
    return {
        "mode": mode,
        "modes": {
            "dark": active if mode == "dark" else default_seeds("dark"),
            "light": active if mode == "light" else default_seeds("light"),
        },
    }


def undo_status():
    locations = paths()
    if not locations["undo"].exists():
        return {"available": False}
    try:
        snapshot = json.loads(locations["undo"].read_text())
        if snapshot.get("version") != 1:
            return {"available": False}
        slug = validate_slug(snapshot.get("slug", ""))
        current = current_context()["slug"]
        return {"available": slug == current, "slug": slug}
    except (OSError, ValueError, TypeError, RuntimeError):
        return {"available": False}


def saved_recipe(slug):
    return paths()["recipes"] / f"{validate_slug(slug)}.json"


def get_state():
    context = current_context()
    mode, colors = parse_theme(context["source_text"])
    config = None
    recipe_file = saved_recipe(context["slug"])
    if recipe_file.exists():
        try:
            recipe = parse_recipe(json.loads(recipe_file.read_text()))
            if (
                recipe["config"]["mode"] == mode
                and all(name in recipe["colors"] for name in COLOR_NAMES)
                and all(colors.get(key) == value for key, value in recipe["colors"].items())
            ):
                config = recipe["config"]
        except (OSError, ValueError, TypeError):
            pass
    return {
        "slug": context["slug"],
        "name": " ".join(word.capitalize() for word in context["slug"].split("-")),
        "mode": mode,
        "source": str(context["source"]),
        "target": str(context["target"]),
        "colors": colors,
        "config": config or inferred_config(mode, colors),
        "undoAvailable": undo_status()["available"],
    }


def atomic_write(file, content):
    file.parent.mkdir(parents=True, exist_ok=True)
    mode = file.stat().st_mode & 0o777 if file.exists() else 0o644
    temporary = file.parent / f".{file.name}.{os.getpid()}.{secrets.token_hex(6)}"
    descriptor = None
    try:
        descriptor = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL, mode)
        with os.fdopen(descriptor, "w") as stream:
            descriptor = None
            stream.write(content)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, file)
        directory = os.open(file.parent, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(directory)
        finally:
            os.close(directory)
    finally:
        if descriptor is not None:
            os.close(descriptor)
        temporary.unlink(missing_ok=True)


def snapshot(file):
    return {"existed": file.exists(), **({"content": file.read_text()} if file.exists() else {})}


def restore(file, saved):
    if saved["existed"]:
        atomic_write(file, saved.get("content", ""))
    else:
        file.unlink(missing_ok=True)
        try:
            file.parent.rmdir()
        except OSError:
            pass


def attempt_all(actions):
    failures = []
    for action in actions:
        try:
            action()
        except Exception as error:
            failures.append(error)
    return failures


class MutationLock:
    def __enter__(self):
        locations = paths()
        locations["state"].mkdir(parents=True, exist_ok=True)
        self.lock = locations["lock"]
        self.token = secrets.token_hex(16)
        try:
            self.lock.mkdir()
        except FileExistsError as error:
            owner = self.read_owner()
            raise RuntimeError(
                f"Chromarchy mutation is already running or left a lock '{self.lock}' "
                f"(pid {owner['pid']}); remove it manually only after confirming no "
                "Chromarchy command is running"
            ) from error
        try:
            atomic_write(
                self.lock / "owner.json",
                json.dumps({"pid": os.getpid(), "token": self.token}) + "\n",
            )
        except Exception:
            shutil.rmtree(self.lock, ignore_errors=True)
            raise
        return self

    def read_owner(self):
        try:
            owner = json.loads((self.lock / "owner.json").read_text())
            if (
                not isinstance(owner.get("pid"), int)
                or owner["pid"] <= 0
                or not isinstance(owner.get("token"), str)
                or not owner["token"]
            ):
                raise ValueError
            return owner
        except (OSError, ValueError, TypeError) as error:
            raise RuntimeError(
                f"Chromarchy mutation lock '{self.lock}' has malformed ownership data; "
                "remove it manually only after confirming no Chromarchy command is running"
            ) from error

    def __exit__(self, _kind, _value, _traceback):
        try:
            if self.read_owner()["token"] == self.token:
                shutil.rmtree(self.lock)
        except (OSError, RuntimeError):
            pass


def run_theme_set(slug):
    try:
        result = subprocess.run(
            ["omarchy", "theme", "set", slug],
            text=True,
            capture_output=True,
            timeout=30,
            check=False,
        )
    except subprocess.TimeoutExpired as error:
        raise RuntimeError("omarchy theme set timed out") from error
    if result.returncode:
        raise RuntimeError(
            result.stderr.strip()
            or result.stdout.strip()
            or f"omarchy theme set exited {result.returncode}"
        )


def copy_theme_layer(source, target):
    if source.exists():
        shutil.copytree(
            source,
            target,
            dirs_exist_ok=True,
            ignore=shutil.ignore_patterns(".git"),
        )


def open_managed_unlocked():
    locations = paths()
    target = locations["user_themes"] / MANAGED_SLUG
    current = current_context()
    if not target.exists():
        temporary = locations["user_themes"] / (
            f".{MANAGED_SLUG}.{os.getpid()}.{secrets.token_hex(6)}"
        )
        locations["user_themes"].mkdir(parents=True, exist_ok=True)
        try:
            copy_theme_layer(locations["stock_themes"] / current["slug"], temporary)
            copy_theme_layer(locations["user_themes"] / current["slug"], temporary)
            if not (temporary / "colors.toml").exists():
                raise RuntimeError(
                    f"Current theme '{current['slug']}' cannot be copied: colors.toml is missing"
                )
            temporary.rename(target)
            run_theme_set(MANAGED_SLUG)
        finally:
            shutil.rmtree(temporary, ignore_errors=True)
    elif current["slug"] != MANAGED_SLUG:
        run_theme_set(MANAGED_SLUG)
    state = get_state()
    if state["slug"] != MANAGED_SLUG:
        raise RuntimeError(
            f"Theme activation returned '{state['slug']}' instead of '{MANAGED_SLUG}'"
        )
    return state


def render_palette(source, mode, colors):
    mode_updated = False
    remaining = dict(colors)
    updated = []
    lines = []
    for line in source.splitlines():
        match = COLOR_LINE.fullmatch(line)
        if not match:
            lines.append(line)
            continue
        indent, key, separator, _, suffix = match.groups()
        if key == "mode":
            mode_updated = True
            lines.append(f'{indent}{key}{separator}"{mode}"{suffix}')
            continue
        value = remaining.get(key)
        if not value or key.startswith("hyprland_"):
            lines.append(line)
            continue
        remaining.pop(key)
        updated.append(key)
        lines.append(f'{indent}{key}{separator}"{value}"{suffix}')
    if not mode_updated:
        raise RuntimeError("colors.toml has no mode key")
    missing = [(key, value) for key, value in remaining.items() if not key.startswith("hyprland_")]
    if missing:
        while lines and not lines[-1]:
            lines.pop()
        lines.extend(("", "# Added by Chromarchy"))
        for key, value in missing:
            lines.append(f'{key} = "{value}"')
            updated.append(key)
    return "\n".join(lines) + "\n", updated


def apply_unlocked(recipe):
    context = current_context()
    if context["slug"] != MANAGED_SLUG:
        raise RuntimeError(
            f"Chromarchy only writes theme '{MANAGED_SLUG}', current theme is '{context['slug']}'"
        )
    locations = paths()
    recipe_file = saved_recipe(context["slug"])
    saved = {
        "version": 1,
        "slug": context["slug"],
        "target": snapshot(context["target"]),
        "recipe": snapshot(recipe_file),
        "createdAt": int(time.time() * 1000),
    }
    previous_undo = snapshot(locations["undo"])
    rendered, updated = render_palette(
        context["source_text"], recipe["config"]["mode"], recipe["colors"]
    )
    try:
        atomic_write(locations["undo"], json.dumps(saved, separators=(",", ":")) + "\n")
        atomic_write(context["target"], rendered)
        atomic_write(recipe_file, json.dumps(recipe, indent=2) + "\n")
        run_theme_set(context["slug"])
    except Exception as error:
        failures = [
            error,
            *attempt_all(
                (
                    lambda: restore(context["target"], saved["target"]),
                    lambda: restore(recipe_file, saved["recipe"]),
                    lambda: restore(locations["undo"], previous_undo),
                    lambda: run_theme_set(context["slug"]),
                )
            ),
        ]
        if len(failures) > 1:
            raise ExceptionGroup("Palette apply failed and recovery was incomplete", failures)
        raise
    return {
        "ok": True,
        "slug": context["slug"],
        "target": str(context["target"]),
        "updated": updated,
        "state": get_state(),
    }


def apply_managed(recipe):
    with MutationLock():
        previous = current_context()
        target = paths()["user_themes"] / MANAGED_SLUG
        existed = target.exists()
        try:
            open_managed_unlocked()
            return apply_unlocked(recipe)
        except Exception as error:
            failures = [error]
            restored = False
            try:
                if current_context()["slug"] != previous["slug"]:
                    run_theme_set(previous["slug"])
                actual = current_context()["slug"]
                if actual != previous["slug"]:
                    raise RuntimeError(
                        f"Theme restoration returned '{actual}' instead of '{previous['slug']}'"
                    )
                restored = True
            except Exception as restoration_error:
                failures.append(restoration_error)
            if not existed and restored:
                try:
                    shutil.rmtree(target)
                except Exception as cleanup_error:
                    failures.append(cleanup_error)
            if len(failures) > 1:
                raise ExceptionGroup("Palette apply failed and recovery was incomplete", failures)
            raise


def parse_undo(raw):
    value = object_value(json.loads(raw), "undo")
    if (
        value.get("version") != 1
        or not isinstance(value.get("slug"), str)
        or not isinstance(value.get("target"), dict)
        or not isinstance(value["target"].get("existed"), bool)
        or (value["target"]["existed"] and not isinstance(value["target"].get("content"), str))
        or not isinstance(value.get("recipe"), dict)
        or not isinstance(value["recipe"].get("existed"), bool)
        or (value["recipe"]["existed"] and not isinstance(value["recipe"].get("content"), str))
    ):
        raise RuntimeError("Undo snapshot is invalid")
    value["slug"] = validate_slug(value["slug"])
    return value


def undo():
    with MutationLock():
        locations = paths()
        if not undo_status()["available"]:
            raise RuntimeError("Nothing to undo for the current theme")
        saved = parse_undo(locations["undo"].read_text())
        context = current_context()
        if saved["slug"] != context["slug"]:
            raise RuntimeError(
                f"Undo belongs to theme '{saved['slug']}', current theme is '{context['slug']}'"
            )
        recipe_file = saved_recipe(context["slug"])
        before_target = snapshot(context["target"])
        before_recipe = snapshot(recipe_file)
        try:
            restore(context["target"], saved["target"])
            restore(recipe_file, saved["recipe"])
            run_theme_set(context["slug"])
        except Exception as error:
            failures = [
                error,
                *attempt_all(
                    (
                        lambda: restore(context["target"], before_target),
                        lambda: restore(recipe_file, before_recipe),
                        lambda: run_theme_set(context["slug"]),
                    )
                ),
            ]
            if len(failures) > 1:
                raise ExceptionGroup("Undo failed and recovery was incomplete", failures)
            raise
        locations["undo"].unlink(missing_ok=True)
        return {
            "ok": True,
            "slug": context["slug"],
            "target": str(context["target"]),
            "updated": [],
            "state": get_state(),
        }


def argument(args, name):
    try:
        value = args[args.index(name) + 1]
    except (ValueError, IndexError) as error:
        raise TypeError(f"{args[0]} requires {name} <json>") from error
    if len(value.encode()) > 262_144:
        raise TypeError(f"{name} exceeds 256 KiB")
    return value


def main(args):
    if "--version" in args:
        print(VERSION)
        return 0
    if "--smoke" in args:
        print(json.dumps({"ok": True}))
        return 0
    if args[:1] == ["open"]:
        print(json.dumps(get_state(), separators=(",", ":")))
        return 0
    if args[:1] == ["apply"]:
        recipe = parse_recipe(json.loads(argument(args, "--recipe-json")), require_all=True)
        print(json.dumps(apply_managed(recipe), separators=(",", ":")))
        return 0
    if args[:1] == ["undo"]:
        print(json.dumps(undo(), separators=(",", ":")))
        return 0
    if args[:1] == ["undo-status"]:
        print(json.dumps(undo_status(), separators=(",", ":")))
        return 0
    print(
        "Usage: chromarchy [--version|--smoke]|open|"
        "apply --recipe-json <json>|undo|undo-status",
        file=sys.stderr,
    )
    return 2


if __name__ == "__main__":
    try:
        raise SystemExit(main(sys.argv[1:]))
    except Exception as error:
        print(f"chromarchy: {error}", file=sys.stderr)
        raise SystemExit(1) from error
