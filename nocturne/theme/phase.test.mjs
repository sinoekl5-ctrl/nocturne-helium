import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { phaseAt, parseTime, resolve, phaseTokens, hexToOklab, oklabToHex, mixHex, toCss, contrast, MIN_CONTRAST } from "./phase.mjs";

const tokens = JSON.parse(readFileSync(new URL("../tokens/tokens.json", import.meta.url), "utf8"));
const at = (hhmm) => parseTime(hhmm);

test("phase function at every boundary", () => {
  const cases = [
    ["00:00", "deep-night"], ["04:59", "deep-night"], ["05:00", "dawn"], ["07:59", "dawn"],
    ["08:00", "day"], ["16:59", "day"], ["17:00", "dusk"], ["19:59", "dusk"],
    ["20:00", "night"], ["23:59", "night"],
  ];
  for (const [t, want] of cases) assert.equal(phaseAt(at(t)), want, t);
});

test("--nocturne-time parsing", () => {
  assert.equal(parseTime("--nocturne-time=07:30"), 450);
  assert.equal(parseTime("5:00"), 300);
  assert.equal(parseTime("24:00"), null);
  assert.equal(parseTime("12:60"), null);
  assert.equal(parseTime("noon"), null);
});

test("custom hours move the boundaries", () => {
  const starts = { dawn: 360, day: 540, dusk: 1080, night: 1260 };
  assert.equal(phaseAt(at("05:59"), starts), "deep-night");
  assert.equal(phaseAt(at("06:00"), starts), "dawn");
  assert.equal(phaseAt(at("20:59"), starts), "dusk");
  assert.throws(() => phaseAt(0, { dawn: 900, day: 480 }));
});

test("OKLab round trip keeps every palette colour", () => {
  for (const hex of Object.values(tokens.palette)) assert.equal(oklabToHex(hexToOklab(hex)), hex.toUpperCase());
});

test("mixing is exact at the ends and in between at the middle", () => {
  assert.equal(mixHex("#0E0D0C", "#EFE9DC", 0), "#0E0D0C");
  assert.equal(mixHex("#0E0D0C", "#EFE9DC", 1), "#EFE9DC");
  const mid = hexToOklab(mixHex("#0E0D0C", "#EFE9DC", 0.5))[0];
  assert.ok(mid > hexToOklab("#0E0D0C")[0] && mid < hexToOklab("#EFE9DC")[0]);
});

test("no blending until 30 minutes before a boundary", () => {
  assert.equal(resolve(tokens, at("04:29")).blend, 0);
  assert.deepEqual(resolve(tokens, at("04:29")).vars, phaseTokens(tokens, "deep-night"));
  assert.deepEqual(resolve(tokens, at("12:00")).vars, phaseTokens(tokens, "day"));
});

test("blend starts at the old phase and lands exactly on the new one", () => {
  assert.deepEqual(resolve(tokens, at("04:30")).vars, phaseTokens(tokens, "deep-night"));
  const mid = resolve(tokens, at("04:45"));
  assert.equal(mid.phase, "deep-night");
  assert.ok(mid.blend > 0.4 && mid.blend < 0.6);
  assert.notEqual(mid.vars.bg, phaseTokens(tokens, "deep-night").bg);
  assert.notEqual(mid.vars.bg, phaseTokens(tokens, "dawn").bg);
  assert.deepEqual(resolve(tokens, at("05:00")).vars, phaseTokens(tokens, "dawn"));
});

test("blend works across midnight and for every boundary", () => {
  assert.equal(resolve(tokens, at("23:30")).phase, "night");
  assert.equal(resolve(tokens, at("23:30")).blend, 0);
  assert.ok(resolve(tokens, at("23:45")).blend > 0);
  assert.deepEqual(resolve(tokens, at("00:00")).vars, phaseTokens(tokens, "deep-night"));
  for (const t of ["07:59", "16:59", "19:59", "04:59"]) assert.ok(resolve(tokens, at(t)).blend > 0.9, t);
});

test("the last minute before a boundary is almost the next phase", () => {
  const before = resolve(tokens, at("07:59")).vars.bg;
  const after = phaseTokens(tokens, "day").bg;
  const a = hexToOklab(before), b = hexToOklab(after);
  assert.ok(Math.abs(a[0] - b[0]) < 0.02);
});

test("Private-space rule: deep night never has glow or grain", () => {
  const v = resolve(tokens, at("03:00")).vars;
  assert.equal(v.glow, 0);
  assert.equal(v.grain, 0);
});

test("css output", () => {
  assert.match(toCss(resolve(tokens, at("12:00")).vars), /--bg:#EFE9DC;/);
});

test("every mood visibly changes the room by day and by night", () => {
  for (const t of ["06:00", "12:00", "18:00", "21:00"]) {
    const rooms = Object.keys(tokens.moods).map((m) => resolve(tokens, at(t), undefined, m).vars);
    for (const k of ["bg", "surface", "accent"]) assert.equal(new Set(rooms.map((r) => r[k])).size, rooms.length, `${t} ${k}`);
  }
});

test("deep night stays Vigil whatever the mood", () => {
  for (const m of Object.keys(tokens.moods))
    assert.deepEqual(resolve(tokens, at("03:00"), undefined, m).vars, phaseTokens(tokens, "deep-night"), m);
});

test("text and accent stay readable every minute of the day, in every mood", () => {
  const bad = [];
  for (const mood of [undefined, ...Object.keys(tokens.moods)])
    for (let m = 0; m < 1440; m++) {
      const v = resolve(tokens, m, undefined, mood).vars;
      for (const [fg, min] of Object.entries(MIN_CONTRAST))
        for (const bg of ["bg", "surface", "raised"])
          if (contrast(v[fg], v[bg]) < min) bad.push(`${mood} ${m} ${fg}/${bg}`);
    }
  assert.deepEqual(bad.slice(0, 10), [], `${bad.length} failing pairs`);
});
