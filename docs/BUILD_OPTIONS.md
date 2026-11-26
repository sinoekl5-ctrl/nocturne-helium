# Build options without paying (Windows 10, 8 GB RAM)

Status: notes for the owner. What is checked and what is not is marked.

## Checked
- Helium's own Windows builds are made on runners sponsored by Depot (stated in the helium-windows README), not on free GitHub runners.
- Helium publishes ready-made Windows releases on GitHub. The newest one found while writing this note is 0.22.0.1 on Chromium 158.0.8127.36.

## Not checked (do not rely on these)
- Whether GitHub's free runners have enough disk, memory and time for a full Chromium build. A full build is very large, so assume no until someone tests it.
- Windows 10 with 8 GB RAM is below what a full Chromium build normally wants.

## What this means
A full build of Nocturne is not realistic for free right now. The work that needs no build is written and tested as plain code instead:
1. Design tokens (`nocturne/tokens/`), with the contrast test.
2. Time-of-day phases and the OKLab blend (`nocturne/theme/`), with boundary tests.
3. Next: a CSS generator for the tokens, the start page, and the settings page, all testable in a normal browser.

When the browser patches are needed, the plan is to test them on a Helium release first, and only build Chromium when a safe, free or sponsored place to do it exists.
