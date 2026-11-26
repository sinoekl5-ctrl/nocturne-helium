# Nocturne status (2026-11-26)

What runs today is an extension and a theme on an installed Helium. No Nocturne browser has been built.
"Done when" is from the brief's build order. A merged pull request does not mean a task is done.

| # | Task | State |
|---|------|-------|
| 1 | Audit | Notes merged. Build instructions not verified. |
| 2 | Tokens and theme | Tokens, contrast tests, start page. Browser UI does not use the tokens (frame theme is static Night). |
| 3 | Left sidebar | Not started in Nocturne. Helium's own vertical tabs are the base. Needs patches and a build. |
| 4 | Time of day | Phases, blend, Appearance setting, tests. Missing: screenshots, real Spaces rules, frame following time. |
| 5 | Start page | Works as a new tab extension (owner tried it). |
| 6 | Spaces | Not started. Separate cookies and history per Space need engine work or a design decision. |
| 7 | Command bar, URL cleaner, sleeping | Extension version: sums, tab finder, cleaner for typed addresses, sleeping. Missing: quick actions, cleaning clicked links. |
| 8 | Split view, Peek, importers, Insights | Not started. |

Blocker for 3, 6 and parts of 8: a Chromium build. The owner's machine (Windows 10, 8 GB) and zero budget
make that unlikely locally; free CI has not been tried.
