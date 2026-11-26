# Nocturne on an installed Helium

This is not a Nocturne browser. It dresses an installed Helium, with no Chromium build.

1. Open `chrome://extensions` and turn on Developer mode.
2. Press "Load unpacked" and choose the `newtab` folder.
3. Press "Load unpacked" again and choose the `theme` folder.
4. Open a new tab. If the browser asks about the changed new tab page, keep the change.
5. For tabs on the side, right-click the tab strip and choose the vertical tabs option.

You choose the mood and theme on the first new tab. Later, use Settings on the start page.

Build the folders with `node nocturne/extension/build.mjs`.

Command bar: simple sums, finding an open tab, and removing tracking parameters (Off / Suggest / Auto, default Suggest).
Auto applies only to addresses typed or pasted into the Nocturne command bar, not to links clicked in pages.
Sleeping idle tabs is off by default. A sleeping tab reloads when opened, so unsaved text in it can be lost.
Permissions: `tabs` (titles and addresses, to find and sleep tabs), `search`, `storage`, `alarms`. No code here sends them anywhere.

Limits: the theme is static Night; only the start page follows the time. Not yet tried inside Helium.
