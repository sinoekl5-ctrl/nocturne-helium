# Nocturne: architecture notes (Task 1 audit)

Audit date: 26 Nov 2026. Method: read files on GitHub only. Nothing was built or run.
Items marked **Not verified** need a real check before anyone relies on them.

## 1. What this repository is

- **Base browser:** Helium, a privacy browser that started from ungoogled-chromium.
- **Engine:** Chromium 158.0.8127.88 (see `chromium_version.txt`). No engine change in v1.
- **Important:** this repo is **patches plus tooling, not the browser source**. About 376 patch files in `patches/` are applied to a Chromium download at build time. The order is set by `patches/series`.
- **Languages:** patches change C++ (window, tabs), and TypeScript/HTML/CSS (web-based pages such as New Tab and Settings). Tooling is Python and shell (`utils/`, `devutils/`).
- **License:** GPL-3.0 (`LICENSE`). Patches imported from other projects keep their own licenses (`LICENSE.ungoogled_chromium`, BSD-3). Nocturne stays GPL-3.0 with source published.
- **Build and run:** packaging lives in separate repos: `imputnet/helium-windows`, `helium-linux`, `helium-macos`. Helium says macOS and Linux are its main development platforms. **Not verified:** the exact Windows steps, and the disk space, memory and hours needed. A full Chromium build is very large and slow, so plan for a cloud or CI machine. Ask the owner before starting any build.

## 2. Where the UI lives

Paths are inside Chromium, changed through patches in `patches/helium/ui/`.

| Area | Chromium path | Patch to read |
|---|---|---|
| Window layout, vertical tab strip | `chrome/browser/ui/views/frame/` | `layout/vertical.patch`, `layout/core.patch` |
| Tabs, pinned tabs | `chrome/browser/ui/views/tabs/`, `chrome/browser/ui/tabs/` | `tabs.patch`, `pins-ui.patch` |
| Side panel | `chrome/browser/ui/views/side_panel/` | `side-panel.patch` |
| Colors | `ui/color/`, `chrome/browser/ui/color/` | `helium-color-mixers.patch`, `helium-color-scheme.patch`, `frame-background.patch` |
| New tab page | `chrome/browser/resources/new_tab_page/` | `clean-new-tab-page.patch`, `always-use-better-ntp.patch` |
| Settings (Appearance) | `chrome/browser/resources/settings/appearance_page/` | `layout/settings.patch` |
| Split view | `chrome/browser/ui/views/frame/multi_contents_view.cc` | `split-view.patch` |

## 3. What already exists (found by file names; not read in full)

- **Vertical tabs:** `layout/vertical.patch` (40 files) and `pins-ui.patch`. A layout state controller, `helium_layout_state_controller`, is added by `layout/core.patch`.
- Other layouts: compact, horizontal, and a "zen" mode (`layout/zen-mode*.patch`). A Layout settings page exists.
- Split view, side panel, tab hibernation and tab freezing patches.
- A color system change (color mixers and color scheme patches), the natural place for design tokens.
- **Not found:** time-of-day theming, Spaces with separate cookies/history, or a combined command bar. **Not verified:** whether Chromium profiles can be reused as Spaces.

## 4. Smallest safe way to add each piece

These are proposals, not tested.

- **(a) Design tokens:** add one new patch that defines the Night and Day tokens through the existing color mixers, so views read tokens instead of fixed colors. Do not edit many view files by hand.
- **(b) Left sidebar:** do not build a new tab strip. Enable the existing vertical layout, dock it LEFT by default, restyle it with the tokens, then add the command bar on top. Check how its width, collapse and dock side are stored before changing them.
- **(c) Time-of-day controller:** a small service that picks the phase once a minute (and on wake and focus) and updates the theme colors. Add the `--nocturne-time=HH:MM` switch and an Appearance setting with an off option.

Every new patch must be added to `patches/series`, in the right order.

## 5. Risks

- **Upstream AI policy:** the file `AGENTS.md` says the Helium project does not accept AI-written contributions. Keep all work in this fork. Never open a pull request to `imputnet/*`.
- **Patch fragility:** patches can break when Chromium is updated. Pin one coherent set (Chromium version, Helium commit) and record it in `PROVENANCE.md`.
- **Branding:** `resources/branding/` holds Helium's name, logo and icons. Nocturne needs its own app ID and icons before any release.
- **Do not touch:** `LICENSE`, `LICENSE.ungoogled_chromium`, and hashes in `downloads.ini` and `deps.ini`.
- **CI today:** this repo's checks (`.github/workflows/`) lint the Python tooling and patch files. They do not build the browser. Contrast and token tests still have to be added.
- **Large cost:** each build takes hours, so batch changes and test small.
