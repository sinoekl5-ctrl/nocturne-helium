// Nocturne time-of-day phases. Plain JavaScript, no dependencies, no browser APIs.
// Rules come from Nocturne_Agent_Brief v1.1, page 5.

export const DEFAULT_STARTS = { "deep-night": 0, dawn: 300, day: 480, dusk: 1020, night: 1200 };
export const PHASE_ORDER = ["deep-night", "dawn", "day", "dusk", "night"];
export const BLEND_MINUTES = 30;
const DAY = 1440;

// "05:00" or "--nocturne-time=05:00" -> minutes since midnight, or null if invalid.
export function parseTime(text) {
  const m = /^(?:--nocturne-time=)?(\d{1,2}):(\d{2})$/.exec(String(text).trim());
  if (!m) return null;
  const h = Number(m[1]), min = Number(m[2]);
  return h < 24 && min < 60 ? h * 60 + min : null;
}

export function minutesOf(date) {
  return date.getHours() * 60 + date.getMinutes();
}

// starts = minute where each phase begins. deep-night always begins at 00:00.
function normalise(starts) {
  const s = { ...DEFAULT_STARTS, ...starts, "deep-night": 0 };
  let last = -1;
  for (const p of PHASE_ORDER) {
    if (!(s[p] > last)) throw new Error("phase starts must increase: " + p);
    last = s[p];
  }
  if (last >= DAY) throw new Error("phase starts must be before 24:00");
  return s;
}

export function phaseAt(minutes, starts) {
  const s = normalise(starts);
  const m = ((minutes % DAY) + DAY) % DAY;
  let current = "deep-night";
  for (const p of PHASE_ORDER) if (m >= s[p]) current = p;
  return current;
}

// ---------- OKLab colour mixing ----------
const toLin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const fromLin = (x) => {
  const v = x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, v)) * 255);
};

export function hexToOklab(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = toLin((n >> 16) & 255), g = toLin((n >> 8) & 255), b = toLin(n & 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function oklabToHex([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map(fromLin);
  return "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();
}

export function mixHex(a, b, t) {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const x = hexToOklab(a), y = hexToOklab(b);
  return oklabToHex(x.map((v, i) => v + (y[i] - v) * t));
}

const isHex = (v) => typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);

function mixValue(a, b, t) {
  if (a === undefined) return b;
  if (b === undefined) return a;
  if (isHex(a) && isHex(b)) return mixHex(a.toUpperCase(), b.toUpperCase(), t);
  if (typeof a === "number" && typeof b === "number") return a + (b - a) * t;
  return t < 0.5 ? a : b;
}

// ---------- Readability guard ----------
// Blending a dark room into a light one passes through mid-grey, where text and background would meet.
// Any foreground that falls under its minimum is pushed toward black or white, only as far as needed.
const luminance = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * toLin((n >> 16) & 255) + 0.7152 * toLin((n >> 8) & 255) + 0.0722 * toLin(n & 255);
};
export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
export const MIN_CONTRAST = { text: 4.5, "text-2": 4.5, info: 4.5, accent: 3 };
const BACKGROUNDS = ["bg", "surface", "raised"];

export function keepReadable(vars) {
  const out = { ...vars };
  const worst = (fg) => Math.min(...BACKGROUNDS.map((k) => contrast(fg, out[k])));
  const pole = worst("#000000") >= worst("#FFFFFF") ? "#000000" : "#FFFFFF";
  // At mid-grey even pure black or white can fall short, so nudge those backgrounds away from it.
  const away = pole === "#000000" ? "#FFFFFF" : "#000000";
  for (const key of BACKGROUNDS) {
    const start = out[key];
    for (let i = 1; i <= 100 && contrast(pole, out[key]) < MIN_CONTRAST.text + 0.05; i++) out[key] = mixHex(start, away, i / 100);
  }
  for (const [key, min] of Object.entries(MIN_CONTRAST)) {
    const start = out[key];
    for (let i = 1; i <= 100 && worst(out[key]) < min; i++) out[key] = mixHex(start, pole, i / 100);
  }
  return out;
}

// ---------- Tokens for one phase ----------
// A Space's mood keeps its own colours and grain by day and by night, while the phase sets the base
// brightness (brief page 5). Deep night is always Vigil, so no mood applies there.
export function phaseTokens(tokens, phase, mood) {
  const p = tokens.phases[phase];
  const out = { ...tokens.themes[p.theme], ...p.override };
  if (phase !== "deep-night" && tokens.moods[mood]) Object.assign(out, tokens.moods[mood][p.theme]);
  return out;
}

// Everything the UI needs for a given minute of the day.
// Inside the last 30 minutes before a boundary, every token is blended to the next phase.
export function resolve(tokens, minutes, starts, mood) {
  const s = normalise(starts);
  const m = ((minutes % DAY) + DAY) % DAY;
  const phase = phaseAt(m, s);
  const next = PHASE_ORDER[(PHASE_ORDER.indexOf(phase) + 1) % PHASE_ORDER.length];
  const nextStart = next === "deep-night" ? DAY : s[next];
  const left = nextStart - m; // minutes until the next boundary
  const from = phaseTokens(tokens, phase, mood);
  if (left > BLEND_MINUTES) return { phase, theme: tokens.phases[phase].theme, blend: 0, vars: from };
  const to = phaseTokens(tokens, next, mood);
  const t = 1 - left / BLEND_MINUTES;
  const vars = {};
  for (const k of new Set([...Object.keys(from), ...Object.keys(to)])) vars[k] = mixValue(from[k], to[k], t);
  return { phase, theme: tokens.phases[phase].theme, blend: t, vars: keepReadable(vars) };
}

export function toCss(vars) {
  return Object.entries(vars).map(([k, v]) => `--${k}:${v};`).join("");
}

// ---------- Appearance setting (brief page 5) ----------
export const MODES = ["auto", "system", "night", "day", "custom"];
export const MIN_PHASE_MINUTES = BLEND_MINUTES;

// Custom hours must be in order, and every phase must be long enough to hold its own blend.
export function validStarts(starts) {
  const edges = [0, ...PHASE_ORDER.slice(1).map((p) => starts?.[p]), DAY];
  return edges.every((v, i) => Number.isInteger(v) && (i === 0 || v - edges[i - 1] >= MIN_PHASE_MINUTES));
}

// Whatever was saved, return settings that are safe to use.
export function cleanSettings(raw) {
  const mode = MODES.includes(raw?.mode) ? raw.mode : "auto";
  const starts = validStarts(raw?.starts) ? { ...raw.starts } : { ...DEFAULT_STARTS };
  return { mode, starts };
}

export function resolveAppearance(tokens, minutes, settings, mood, systemDark) {
  const { mode, starts } = cleanSettings(settings);
  const fixed = mode === "system" ? (systemDark ? "night" : "day") : mode === "night" || mode === "day" ? mode : null;
  if (fixed) return { phase: fixed, theme: tokens.phases[fixed].theme, blend: 0, vars: phaseTokens(tokens, fixed, mood) };
  return resolve(tokens, minutes, mode === "custom" ? starts : undefined, mood);
}
