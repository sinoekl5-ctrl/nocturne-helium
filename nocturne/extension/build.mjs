// Builds two loadable folders for an already installed Helium. No Chromium build needed.
// Run: node nocturne/extension/build.mjs
//   dist/newtab  -> the Nocturne start page on every new tab
//   dist/theme   -> static Night colours for the browser frame (a Chromium theme cannot follow the time)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { build as buildPage } from "../startpage/build.mjs";

const here = new URL("./", import.meta.url);
const read = (p) => readFileSync(new URL(p, here), "utf8");

export function files() {
  const page = buildPage();
  const script = page.match(/<script>([\s\S]*?)<\/script>/)[1];
    const plain = (p) => read(p).replace(/^export /gm, "");
  const sleep = plain("./sleep.js");
  // Extension pages may not run inline scripts, so the script moves to its own file.
  const controls = `<div class="hours">
      <label>Tracking in addresses typed here <select class="field" id="cleaner">
        <option value="off">Off</option><option value="suggest">Suggest</option><option value="auto">Auto</option>
      </select></label>
      <label>Sleep idle tabs <select class="field" id="sleep">
        <option value="0">Off</option><option value="30">After 30 minutes</option><option value="60">After 1 hour</option><option value="120">After 2 hours</option>
      </select></label>
    </div>
    `;
  const html = page
    .replace(/<script>[\s\S]*?<\/script>/, () => '<script src="newtab.js"></script>')
    .replace('<p id="settings-note"', () => controls + '<p id="settings-note"')
    .replace('<p class="quiet">Nothing here yet.</p>', () => '<div class="results" id="results" aria-live="polite"></div>');
  const T = JSON.parse(read("../tokens/tokens.json")).themes.night;
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const colors = {
    frame: T.bg, frame_inactive: T.bg, toolbar: T.surface, tab_text: T.text,
    tab_background_text: T["text-2"], bookmark_text: T.text, toolbar_button_icon: T.text,
    omnibox_background: T.raised, omnibox_text: T.text, ntp_background: T.bg, ntp_text: T.text,
  };
  return {
    "newtab/manifest.json": JSON.stringify({
      manifest_version: 3, name: "Nocturne start page", version: "0.2.0",
      description: "A quiet start page that follows the time of day.",
      permissions: ["search", "tabs", "storage", "alarms"],
      background: { service_worker: "background.js" }, chrome_url_overrides: { newtab: "newtab.html" },
      options_ui: { page: "settings.html", open_in_tab: true },
    }, null, 2),
    "newtab/newtab.html": html,
    "newtab/settings.html": html.replace("<html ", '<html data-start-view="settings" '),
    "newtab/newtab.js": script + plain("./command.js") + plain("./page.js"),
    "newtab/background.js": sleep + plain("./background.js"),
    "theme/manifest.json": JSON.stringify({
      manifest_version: 3, name: "Nocturne Night", version: "0.1.0",
      theme: { colors: Object.fromEntries(Object.entries(colors).map(([k, v]) => [k, rgb(v)])) },
    }, null, 2),
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  for (const [name, body] of Object.entries(files())) {
    const out = new URL("./dist/" + name, here);
    mkdirSync(new URL("./", out), { recursive: true });
    writeFileSync(out, body);
  }
  console.log("wrote nocturne/extension/dist");
}
