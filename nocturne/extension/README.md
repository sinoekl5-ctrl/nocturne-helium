# Nocturne on an installed Helium

This is not a Nocturne browser. It dresses an installed Helium, with no Chromium build.

1. Open `chrome://extensions` and turn on Developer mode.
2. Press "Load unpacked" and choose the `newtab` folder.
3. Press "Load unpacked" again and choose the `theme` folder.
4. Open a new tab. If the browser asks about the changed new tab page, keep the change.
5. For tabs on the side, right-click the tab strip and choose the vertical tabs option.

You choose the mood and theme on the first new tab. Later, use Settings on the start page.

Build the folders with `node nocturne/extension/build.mjs`.

Limits: the theme is static Night; only the start page follows the time. Not yet tried inside Helium.
