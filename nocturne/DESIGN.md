# Nocturne design decisions (owner, 2026-11-28)

These answers override the older brief where they differ. Scope now: the theme and look first.

## Feeling
- Painterly but calm. Open, uncluttered screen.
- Owner references (private moodboard, never bundled or traced): matte dark still lifes (wool, leather, paper,
  coffee), dim soft-focus portraits, two muted oil paintings (grey-green haze; warm brown with a soft brush drag).
- Reading of them: charcoal, ash grey, coffee brown, dull cream. No saturated colour. Softness belongs in
  backgrounds and glow; text stays sharp. Each mood takes more warmth or more grey to suit its character.
  (This last choice was left to the agent.)

## Choices
| Topic | Decision |
|---|---|
| Moods | Change colour, texture, light, shapes and transitions. No continuous animation. The user is free to choose, or leaves it on auto. |
| Day | The user chooses: light paper, dark, or a quieter middle. |
| Switching | Manual and by time. A manual mood wins, also 00:00-05:00. Vigil applies at night only on auto. (Agent decision, delegated. A Private Space stays Vigil.) |
| Sidebar | Left. Icon rail that expands on mouse hover. |
| Address | Thin top bar, plus a centred floating search on Ctrl+L. |
| Zen screenshot | Take the idea of soft pinned tiles above tabs and a large floating suggestion list. No Zen code. (Agent decision.) |
| Corners | Round and soft. |
| Warm light | Thin line with a gentle glow. |
| Motion | Very little. The owner's PC has 8 GB RAM. |
| Icons | Elegant, thin, rounded ends. (Agent decision.) |
| Type | As in the brief. Interface in English. |
| Start page | Search, greeting and quiet line, clock, pinned sites; each can be switched in Settings. |
| Pages after the main window and start page | Settings, first run. |
| Logo | Last. |
| Process | Build directly, no separate prototype. Batch browser changes into few builds. |

## What the code review found (patches read only; nothing built or run)
| Wish | In Helium's patches | Work left |
|---|---|---|
| Left sidebar, expands on hover | Vertical layout and pref `vertical_tabs.expand_on_hover` exist | Defaults, sizes, restyle |
| Rounded page corners | Pref `helium.browser.rounded_frame`, on by default | Radius and colours |
| Browser colours | `helium-color-scheme.patch` and `helium-color-mixers.patch` define them | A Nocturne patch applied after them. First step is static |
| Moods and time inside the browser frame | Not found in the files reviewed | New code |
| Floating search on Ctrl+L | Not found in the files reviewed | Check Chromium source first |

The Windows build takes patches from the `helium-chromium` submodule, which points to imputnet/helium.
Nocturne patches must be wired into that build. The only full successful build took about 21 hours.
