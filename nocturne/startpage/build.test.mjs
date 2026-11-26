import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { build } from "./build.mjs";

const html = build();
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const style = html.match(/<style>([\s\S]*?)<\/style>/)[1];

test("the script compiles and nothing is left unreplaced", () => {
  new vm.Script(script);
  assert.ok(!html.includes("__TOKENS__") && !html.includes("__PHASE__"));
});

test("brief rules in the CSS: matte, no glass, no heavy shadows, reduced motion honoured", () => {
  assert.ok(!/backdrop-filter/.test(style));
  assert.ok(!/box-shadow:[^;]*\d+px/.test(style));
  assert.ok(/prefers-reduced-motion/.test(style));
  assert.ok(/forced-colors/.test(style));
  assert.ok(/outline:2px solid var\(--accent\)/.test(style));
});

test("voice: no exclamation marks in visible text or greetings", () => {
  const visible = html.replace("<!doctype html>", "").replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "");
  assert.ok(!visible.includes("!"));
  assert.ok(!script.match(/const GREETING = \{[\s\S]*?\};/)[0].includes("!"));
});

function run(search, store = {}) {
  const attrs = {}, vars = {}, els = {};
  const el = (extra = {}) => ({
    style: { setProperty: (k, v) => { vars[k] = v; } }, dataset: {}, value: "", textContent: "", offsetWidth: 0,
    classList: { add() {}, remove() {} }, setAttribute(k, v) { this[k] = v; },
    addEventListener(type, fn) { (this.on ||= {})[type] = fn; }, ...extra,
  });
  const dots = ["atelier", "gambit", "vigil", "drift", "ember"].map((m) => el({ dataset: { mood: m } }));
  const document = {
    documentElement: el({ setAttribute: (k, v) => { attrs[k] = v; } }),
    getElementById: (id) => (els[id] ||= el()),
    querySelectorAll: () => dots,
    addEventListener() {},
  };
  const localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; } };
  const ctx = { localStorage, document, window: { addEventListener() {}, matchMedia: () => ({ matches: false }) }, location: { search },
    setInterval() {}, URLSearchParams, Date, String, Math, Object, Number, Set, Error, RegExp, JSON };
  vm.runInNewContext(script, ctx);
  return { attrs, vars, els, dots };
}

test("page reads --nocturne-time and applies the phase", () => {
  let r = run("?nocturne-time=03:00");
  assert.equal(r.attrs["data-phase"], "deep-night");
  assert.equal(r.vars["--glow"], 0);
  assert.equal(r.els.greeting.textContent, "Quiet hours.");
  r = run("?nocturne-time=12:00");
  assert.equal(r.attrs["data-theme"], "day");
  assert.equal(r.vars["--bg"], "#EFE9DC");
  r = run("?nocturne-time=21:00");
  assert.equal(r.attrs["data-phase"], "night");
  assert.equal(r.vars["--accent"], "#C98A2B");
  assert.match(r.els.phase.textContent, /Night · 21:00/);
});

test("pressing a mood dot repaints the page, and pressing it again undoes it", () => {
  for (const time of ["12:00", "21:00"]) {
    const r = run("?nocturne-time=" + time);
    const before = r.vars["--bg"];
    const drift = r.dots.find((d) => d.dataset.mood === "drift");
    drift.on.click();
    assert.notEqual(r.vars["--bg"], before, time);
    assert.equal(drift["aria-pressed"], "true");
    assert.equal(r.els["mood-note"].textContent, "Mood: Drift.");
    drift.on.click();
    assert.equal(r.vars["--bg"], before, time);
    assert.equal(drift["aria-pressed"], "false");
  }
});

test("the time field shows the real clock on auto, also after leaving a preview", () => {
  const r = run("?nocturne-time=14:00");
  assert.equal(r.els.time.value, "14:00");
  assert.match(r.els.phase.textContent, /14:00 · preview$/);
  const before = new Date();
  r.els.auto.on.click();
  const clock = (d) => String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  assert.ok([clock(before), clock(new Date())].includes(r.els.time.value), r.els.time.value);
  assert.match(r.els.phase.textContent, /· auto$/);
});

test("appearance setting is saved and comes back on the next new tab", () => {
  const store = {};
  const first = run("?nocturne-time=12:00", store);
  first.els.mode.on.change({ target: { value: "night" } });
  assert.equal(first.attrs["data-theme"], "night");
  const next = run("?nocturne-time=12:00", store);
  assert.equal(next.els.mode.value, "night");
  assert.equal(next.attrs["data-theme"], "night");
});

test("custom hours are saved only when valid", () => {
  const store = {};
  const r = run("?nocturne-time=14:00", store);
  r.els.mode.on.change({ target: { value: "custom" } });
  r.els["start-dusk"].value = "13:00";
  r.els["start-dusk"].on.change();
  assert.equal(r.attrs["data-phase"], "dusk");
  const saved = store["nocturne-appearance"];
  r.els["start-dusk"].value = "07:00";
  r.els["start-dusk"].on.change();
  assert.equal(store["nocturne-appearance"], saved);
  assert.match(r.els["settings-note"].textContent, /^Not saved/);
  assert.equal(run("?nocturne-time=14:00", store).attrs["data-phase"], "dusk");
});

test("broken saved settings fall back to auto", () => {
  const r = run("?nocturne-time=12:00", { "nocturne-appearance": "{oops" });
  assert.equal(r.els.mode.value, "auto");
  assert.equal(r.attrs["data-phase"], "day");
});

test("choices show on the first run only, then live in Settings", () => {
  const store = {};
  const first = run("", store);
  assert.equal(first.attrs["data-view"], "welcome");
  first.els.save.on.click();
  assert.equal(first.attrs["data-view"], "start");
  const next = run("", store);
  assert.equal(next.attrs["data-view"], "start");
  next.els["open-settings"].on.click();
  assert.equal(next.attrs["data-view"], "settings");
});

test("Done drops a preview time and goes back to the real clock", () => {
  const r = run("?nocturne-time=03:00");
  r.els.save.on.click();
  assert.match(r.els.phase.textContent, /· auto$/);
});

test("without storage the page still works", () => {
  const broken = new Proxy({}, { get() { throw new Error("blocked"); } });
  const r = run("", broken);
  assert.equal(r.attrs["data-view"], "welcome");
  r.els.save.on.click();
  assert.equal(r.attrs["data-view"], "start");
});
