"""Contrast and token tests for Nocturne (brief page 4).

Rules from the brief:
  * body text: contrast 4.5:1 or better
  * icons and outlines: 3:1 or better
  * a pair that fails is decoration only

Hairlines (token "line") are decoration by design and are not enforced here:
they measure about 1.2:1 to 1.6:1 against the surfaces. Everything that carries
meaning (text, links, accent) is enforced for every phase and every mood.

Run:  python -m unittest discover -s nocturne/tests -v
"""
import json
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
TOKENS = json.loads((ROOT / "tokens" / "tokens.json").read_text())

TEXT_MIN = 4.5
UI_MIN = 3.0

# (foreground token, background token, kind). kind is "text" or "ui".
PAIRS = [
    ("text", "bg", "text"), ("text", "surface", "text"), ("text", "raised", "text"),
    ("text-2", "bg", "text"), ("text-2", "surface", "text"), ("text-2", "raised", "text"),
    ("info", "bg", "text"), ("info", "surface", "text"), ("info", "raised", "text"),
    ("accent", "bg", "ui"), ("accent", "surface", "ui"), ("accent", "raised", "ui"),
]
# Night themes only: danger text.
NIGHT_ONLY_PAIRS = [
    ("danger-text", "surface", "text"), ("danger-text", "raised", "text"),
]


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def luminance(h):
    def ch(c):
        c /= 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (ch(c) for c in hex_to_rgb(h))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    la, lb = luminance(a), luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def resolve(phase=None, theme=None, mood=None):
    """Token set for a phase, or for a base theme plus a mood."""
    if phase:
        spec = TOKENS["phases"][phase]
        out = dict(TOKENS["themes"][spec["theme"]])
        out.update(spec["override"])
        return out
    out = dict(TOKENS["themes"][theme])
    if mood:
        out.update(TOKENS["moods"][mood])
    return out


def all_sets():
    for p in TOKENS["phases"]:
        yield "phase:" + p, resolve(phase=p), TOKENS["phases"][p]["theme"]
    for m in TOKENS["moods"]:
        yield "mood:" + m + "@night", resolve(theme="night", mood=m), "night"


class TokenShape(unittest.TestCase):
    def test_all_colors_are_valid_hex(self):
        for name, ts, _ in all_sets():
            for k, v in ts.items():
                if isinstance(v, str):
                    self.assertRegex(v, r"^#[0-9A-Fa-f]{6}$", f"{name}.{k}")

    def test_day_and_night_have_same_core_tokens(self):
        core = {"bg", "surface", "raised", "line", "text", "text-2", "accent", "info"}
        for t in ("night", "day"):
            self.assertTrue(core <= set(TOKENS["themes"][t]), t)

    def test_five_phases_exist(self):
        self.assertEqual(set(TOKENS["phases"]),
                         {"deep-night", "dawn", "day", "dusk", "night"})


class Contrast(unittest.TestCase):
    def test_enforced_pairs(self):
        failures = []
        for name, ts, theme in all_sets():
            pairs = list(PAIRS) + (NIGHT_ONLY_PAIRS if theme == "night" else [])
            for fg, bg, kind in pairs:
                need = TEXT_MIN if kind == "text" else UI_MIN
                got = contrast(ts[fg], ts[bg])
                if got < need:
                    failures.append(f"{name}: {fg} on {bg} = {got:.2f}:1, needs {need}:1")
        self.assertEqual(failures, [], "\n" + "\n".join(failures))


if __name__ == "__main__":
    unittest.main()
