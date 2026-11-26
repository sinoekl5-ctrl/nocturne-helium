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
  const command = read("./command.js").replace(/^export /gm, "");
  const wiring = `
$command: {
  const field = document.getElementById("command");
  field.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || e.isComposing || !field.value.trim()) return;
    const address = toAddress(field.value);
    if (address) location.assign(address);
    else chrome.search.query({ text: field.value.trim(), disposition: "CURRENT_TAB" });
  });
}
`;
  // Extension pages may not run inline scripts, so the script moves to its own file.
  const html = page.replace(/<script>[\s\S]*?<\/script>/, () => '<script src="newtab.js"></script>');
  const T = JSON.parse(read("../tokens/tokens.json")).themes.night;
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const colors = {
    frame: T.bg, frame_inactive: T.bg, toolbar: T.surface, tab_text: T.text,
    tab_background_text: T["text-2"], bookmark_text: T.text, toolbar_button_icon: T.text,
    omnibox_background: T.raised, omnibox_text: T.text, ntp_background: T.bg, ntp_text: T.text,
  };
  return {
    "newtab/manifest.json": JSON.stringify({
      manifest_version: 3, name: "Nocturne start page", version: "0.1.0",
      description: "A quiet start page that follows the time of day.",
      permissions: ["search"], chrome_url_overrides: { newtab: "newtab.html" },
    }, null, 2),
    "newtab/newtab.html": html,
    "newtab/newtab.js": script + command + wiring,
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
