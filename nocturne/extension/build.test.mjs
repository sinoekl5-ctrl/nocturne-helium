import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { files } from "./build.mjs";
import { toAddress, calculate, cleanUrl, findTabs } from "./command.js";
import { pickSleepers } from "./sleep.js";

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

test("manifests: no access to page contents, and the theme is a pure theme", () => {
  const page = JSON.parse(out["newtab/manifest.json"]);
  assert.deepEqual(page.permissions, ["search", "tabs", "storage", "alarms"]);
  assert.equal(page.host_permissions, undefined);
  new vm.Script(out["newtab/background.js"]);
  for (const id of ["results", "cleaner", "sleep"]) assert.ok(out["newtab/newtab.html"].includes(`id="${id}"`), id);
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
    chrome: { search: { query: (q) => searched.push(q.text) }, storage: { local: { get: async () => ({}), set() {} } } }, setInterval() {}, URLSearchParams,
  });
  for (const value of ["github.com", "dark academia", "  "]) {
    els.command.value = value;
    els.command.on.keydown({ key: "Enter" });
  }
  assert.deepEqual(went, ["https://github.com"]);
  assert.deepEqual(searched, ["dark academia"]);
});

test("calculator does sums and ignores everything else", () => {
  for (const [q, want] of [["2+3*4", 14], ["(2+3)*4", 20], ["0.1+0.2", 0.3], ["-4+10", 6], ["10 % 3", 1], ["7/2", 3.5]])
    assert.equal(calculate(q), want, q);
  for (const q of ["3.14", "2026-11-26", "1/0", "2+", "(2+3", "alert(1)", "chess 1+1", "2**3", "192.168.1.1"])
    assert.equal(calculate(q), null, q);
});

test("URL cleaner removes trackers and nothing else", () => {
  assert.deepEqual(cleanUrl("https://a.com/p?utm_source=x&id=7&fbclid=y#top"), { url: "https://a.com/p?id=7#top", removed: 2 });
  assert.deepEqual(cleanUrl("https://a.com/?gclid=1"), { url: "https://a.com/", removed: 1 });
  for (const u of ["https://a.com/s?q=a+b%20c&ref=home", "https://a.com/#/x?utm_source=1", "https://a.com/p"])
    assert.deepEqual(cleanUrl(u), { url: u, removed: 0 }, u);
});

test("tab finder matches every word in title or address", () => {
  const tabs = [{ title: "Chess openings", url: "https://a.com" }, { title: "Reading", url: "https://chess.com/study" }];
  assert.equal(findTabs(tabs, "chess").length, 2);
  assert.equal(findTabs(tabs, "chess open").length, 1);
  assert.equal(findTabs(tabs, "c").length, 0);
});

test("only idle, unprotected tabs are put to sleep, and never when off", () => {
  const now = 10_000_000, idle = { url: "https://a.com", lastAccessed: now - 31 * 60000 };
  const keep = [{ active: true }, { pinned: true }, { audible: true }, { discarded: true }, { autoDiscardable: false },
    { url: "chrome://settings" }, { lastAccessed: now - 60000 }, { lastAccessed: undefined }].map((x) => ({ ...idle, ...x }));
  assert.deepEqual(pickSleepers([idle, ...keep], now, 30), [idle]);
  assert.deepEqual(pickSleepers([idle], now, 0), []);
});
