import importlib.util
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("chromarchy", ROOT / "plugin/chromarchy.py")
chromarchy = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(chromarchy)

BASE_COLORS = """mode = "dark"
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
"""


class ChromarchyHelperTest(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        root = Path(self.temporary.name)
        self.home = root / "home"
        self.omarchy = root / "omarchy"
        self.theme_name = self.home / ".local/state/omarchy/current/theme.name"
        self.stock = self.omarchy / "themes/test-theme/colors.toml"
        self.theme_name.parent.mkdir(parents=True)
        self.stock.parent.mkdir(parents=True)
        self.theme_name.write_text("test-theme\n")
        self.stock.write_text(BASE_COLORS)
        self.environment = patch.dict(
            os.environ,
            {"HOME": str(self.home), "OMARCHY_PATH": str(self.omarchy)},
            clear=False,
        )
        self.environment.start()

    def tearDown(self):
        self.environment.stop()
        self.temporary.cleanup()

    def recipe(self):
        colors = chromarchy.parse_theme(BASE_COLORS)[1]
        return chromarchy.parse_recipe(
            {
                "version": 1,
                "config": {
                    "mode": "dark",
                    "modes": {
                        "dark": {
                            "surface": "#111318",
                            "neutral": "#8b8d98",
                            "accent": "#3d63dd",
                            "terminal": {},
                        },
                        "light": {
                            "surface": "#f9fafb",
                            "neutral": "#8b8d98",
                            "accent": "#3d63dd",
                            "terminal": {},
                        },
                    },
                },
                "colors": colors,
            },
            require_all=True,
        )

    def test_recipe_validation_is_strict(self):
        value = self.recipe()
        value["config"]["legacy"] = True
        with self.assertRaisesRegex(TypeError, "config.legacy"):
            chromarchy.parse_recipe(value, require_all=True)

    def test_render_preserves_hyprland_values(self):
        recipe = self.recipe()
        recipe["colors"]["accent"] = "#123456"
        rendered, updated = chromarchy.render_palette(
            BASE_COLORS, "light", recipe["colors"]
        )
        self.assertIn('mode = "light"', rendered)
        self.assertIn('accent = "#123456"', rendered)
        self.assertIn('hyprland_active_border = "rgba(7c6af2ff)"', rendered)
        self.assertIn("accent", updated)

    def test_apply_and_undo_restore_the_original_theme(self):
        def activate(slug):
            self.theme_name.write_text(f"{slug}\n")

        with patch.object(chromarchy, "run_theme_set", side_effect=activate):
            result = chromarchy.apply_managed(self.recipe())
            self.assertEqual(result["slug"], "chromarchy")
            self.assertTrue(chromarchy.undo_status()["available"])
            chromarchy.undo()
            self.assertFalse(chromarchy.undo_status()["available"])

    def test_failed_activation_removes_new_managed_theme(self):
        with patch.object(
            chromarchy, "run_theme_set", side_effect=RuntimeError("activation failed")
        ):
            with self.assertRaisesRegex(RuntimeError, "activation failed"):
                chromarchy.apply_managed(self.recipe())
        self.assertFalse((self.home / ".config/omarchy/themes/chromarchy").exists())

    def test_saved_seeds_survive_while_external_color_edits_are_inferred(self):
        def activate(slug):
            self.theme_name.write_text(f"{slug}\n")

        recipe = self.recipe()
        with patch.object(chromarchy, "run_theme_set", side_effect=activate):
            chromarchy.apply_managed(recipe)
        recipe_file = (
            self.home / ".local/state/omarchy/chromarchy/recipes/chromarchy.json"
        )
        saved = json.loads(recipe_file.read_text())
        saved["config"]["modes"]["light"]["accent"] = "#4477ff"
        recipe_file.write_text(json.dumps(saved))
        self.assertEqual(
            chromarchy.get_state()["config"]["modes"]["light"]["accent"], "#4477ff"
        )

        target = self.home / ".config/omarchy/themes/chromarchy/colors.toml"
        target.write_text(
            target.read_text().replace('accent = "#7c6af2"', 'accent = "#123456"')
        )
        self.assertEqual(
            chromarchy.get_state()["config"]["modes"]["dark"]["accent"], "#123456"
        )

    def test_stale_lock_fails_closed(self):
        lock = self.home / ".local/state/omarchy/chromarchy/mutation.lock"
        lock.mkdir(parents=True)
        (lock / "owner.json").write_text(json.dumps({"pid": 4242, "token": "stale"}))
        with self.assertRaisesRegex(RuntimeError, "already running"):
            with chromarchy.MutationLock():
                self.fail("lock must not be acquired")
        self.assertTrue(lock.exists())

    def test_invalid_undo_snapshot_is_rejected_without_touching_theme(self):
        target = self.home / ".config/omarchy/themes/test-theme/colors.toml"
        target.parent.mkdir(parents=True)
        target.write_text(BASE_COLORS)
        undo = self.home / ".local/state/omarchy/chromarchy/undo.json"
        undo.parent.mkdir(parents=True)
        undo.write_text(
            json.dumps(
                {
                    "version": 1,
                    "slug": "test-theme",
                    "target": {"existed": True},
                    "recipe": {"existed": False},
                }
            )
        )
        with self.assertRaisesRegex(RuntimeError, "Undo snapshot is invalid"):
            chromarchy.undo()
        self.assertEqual(target.read_text(), BASE_COLORS)

    def test_apply_attempts_every_recovery_step_after_a_restore_fails(self):
        self.theme_name.write_text("chromarchy\n")
        target = self.home / ".config/omarchy/themes/chromarchy/colors.toml"
        target.parent.mkdir(parents=True)
        target.write_text(BASE_COLORS)
        recipe_file = (
            self.home / ".local/state/omarchy/chromarchy/recipes/chromarchy.json"
        )
        recipe_file.parent.mkdir(parents=True)
        recipe_file.write_text('{"previous":true}\n')
        undo_file = self.home / ".local/state/omarchy/chromarchy/undo.json"
        undo_file.write_text('{"olderUndo":true}\n')

        real_atomic_write = chromarchy.atomic_write
        real_restore = chromarchy.restore
        failed_recipe = False
        restored = []
        activated = []

        def atomic_write(file, content):
            nonlocal failed_recipe
            if file == recipe_file and not failed_recipe:
                failed_recipe = True
                raise RuntimeError("recipe write failed")
            real_atomic_write(file, content)

        def restore(file, saved):
            restored.append(file)
            if file == target:
                raise RuntimeError("target restore failed")
            real_restore(file, saved)

        with (
            patch.object(chromarchy, "atomic_write", side_effect=atomic_write),
            patch.object(chromarchy, "restore", side_effect=restore),
            patch.object(
                chromarchy, "run_theme_set", side_effect=lambda slug: activated.append(slug)
            ),
        ):
            with self.assertRaisesRegex(ExceptionGroup, "recovery was incomplete"):
                chromarchy.apply_unlocked(self.recipe())

        self.assertIn(recipe_file, restored)
        self.assertIn(undo_file, restored)
        self.assertEqual(recipe_file.read_text(), '{"previous":true}\n')
        self.assertEqual(undo_file.read_text(), '{"olderUndo":true}\n')
        self.assertEqual(activated, ["chromarchy"])

    def test_undo_attempts_every_recovery_step_after_a_restore_fails(self):
        def activate(slug):
            self.theme_name.write_text(f"{slug}\n")

        with patch.object(chromarchy, "run_theme_set", side_effect=activate):
            chromarchy.apply_managed(self.recipe())

        target = self.home / ".config/omarchy/themes/chromarchy/colors.toml"
        recipe_file = (
            self.home / ".local/state/omarchy/chromarchy/recipes/chromarchy.json"
        )
        real_restore = chromarchy.restore
        restored = []
        activated = []

        def restore(file, saved):
            restored.append(file)
            if file == target:
                raise RuntimeError("target restore failed")
            real_restore(file, saved)

        with (
            patch.object(chromarchy, "restore", side_effect=restore),
            patch.object(
                chromarchy, "run_theme_set", side_effect=lambda slug: activated.append(slug)
            ),
        ):
            with self.assertRaisesRegex(ExceptionGroup, "recovery was incomplete"):
                chromarchy.undo()

        self.assertIn(recipe_file, restored)
        self.assertEqual(activated, ["chromarchy"])


if __name__ == "__main__":
    unittest.main()
