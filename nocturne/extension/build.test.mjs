import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { files } from "./build.mjs";
import { toAddress } from "./command.js";

const out = files();

test("addresses open directly, everything else is searched", () => {
  assert.equal(toAddress("github.com/imputnet"), "https://github.com/imputnet");
  assert.equal(toAddress(" https://example.org/a?b=1 "), "https://example.org/a?b=1");
  assert.equal(toAddress("localhost:3000"), "http://localhost:3000");
  for (const q of ["chess openings", "nocturne", "3.14", "what is node.js", "javascript:alert(1)", "me@mail.com"])
    assert.equal(toAddress(q), null, q);
});

test("the new tab page has no inline script and its script compiles", () => {
  assert.deepEqual(out["newtab/newtab.html"].match(/<script[^>]*>[\s\S]*?<\/script>/g), ['<script src="newtab.js"></script>']);
  new vm.Script(out["newtab/newtab.js"]);
});

test("manifests: only the search permission, and the theme is a pure theme", () => {
  const page = JSON.parse(out["newtab/manifest.json"]);
  assert.deepEqual(page.permissions, ["search"]);
  assert.equal(page.chrome_url_overrides.newtab, "newtab.html");
  assert.equal(page.options_ui.page, "settings.html");
  assert.match(out["newtab/settings.html"], /<html data-start-view="settings" /);
  const theme = JSON.parse(out["theme/manifest.json"]);
  assert.deepEqual(Object.keys(theme), ["manifest_version", "name", "version", "theme"]);
  assert.deepEqual(theme.theme.colors.frame, [14, 13, 12]);
});

test("Enter in the command bar searches or navigates", () => {
  const els = {}, went = [], searched = [];
  const el = () => ({ style: { setProperty() {} }, dataset: {}, value: "", classList: { add() {}, remove() {} },
    setAttribute() {}, addEventListener(type, fn) { (this.on ||= {})[type] = fn; } });
  vm.runInNewContext(out["newtab/newtab.js"], {
    document: { documentElement: el(), getElementById: (id) => (els[id] ||= el()), querySelectorAll: () => [], addEventListener() {} },
    window: { addEventListener() {} }, location: { search: "", assign: (u) => went.push(u) },
    chrome: { search: { query: (q) => searched.push(q.text) } }, setInterval() {}, URLSearchParams,
  });
  for (const value of ["github.com", "dark academia", "  "]) {
    els.command.value = value;
    els.command.on.keydown({ key: "Enter" });
  }
  assert.deepEqual(went, ["https://github.com"]);
  assert.deepEqual(searched, ["dark academia"]);
});
