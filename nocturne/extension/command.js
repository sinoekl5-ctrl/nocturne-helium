// Command bar: Enter opens an address, anything else goes to the browser's default search engine.
export function toAddress(text) {
  const t = text.trim();
  if (/^https?:\/\/\S+$/i.test(t)) return t;
  if (/^localhost(:\d+)?(\/\S*)?$/i.test(t)) return "http://" + t;
  if (/^[^\s\/?#@:]+\.[a-z]{2,}(:\d+)?([\/?#]\S*)?$/i.test(t)) return "https://" + t;
  return null;
}

// ---------- Calculator ----------
// A small parser, never eval. Returns null for anything that is not plainly a sum.
export function calculate(text) {
  const src = text.replace(/\s+/g, "");
  if (src.length > 100 || !/^[\d.+\-*/%()]+$/.test(src) || !/\d[+\-*/%]|\)[+\-*/%]/.test(src)) return null;
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(src)) return null; // a date, not a subtraction
  const tokens = src.match(/\d+(\.\d+)?|\.\d+|\S/g);
  let i = 0;
  const factor = () => {
    const t = tokens[i++];
    if (t === "-") return -factor();
    if (t === "+") return factor();
    if (t === "(") { const v = sum(); return tokens[i++] === ")" ? v : NaN; }
    return /^[\d.]+$/.test(t || "") ? Number(t) : NaN;
  };
  const product = () => {
    let v = factor();
    while (["*", "/", "%"].includes(tokens[i])) {
      const op = tokens[i++], n = factor();
      v = op === "*" ? v * n : op === "/" ? v / n : v % n;
    }
    return v;
  };
  const sum = () => {
    let v = product();
    while (["+", "-"].includes(tokens[i])) { const op = tokens[i++], n = product(); v = op === "+" ? v + n : v - n; }
    return v;
  };
  const result = sum();
  return i === tokens.length && Number.isFinite(result) ? Number(result.toPrecision(12)) : null;
}

// ---------- URL cleaner ----------
const TRACKER = /^(utm_[a-z_]+|fbclid|gclid|dclid|gbraid|wbraid|msclkid|twclid|yclid|mc_cid|mc_eid|igshid|mkt_tok|_hsenc|_hsmi)$/i;
export const CLEANER_MODES = ["off", "suggest", "auto"];

// Removes known tracking parameters and leaves every other character of the address as it was.
export function cleanUrl(address) {
  const [, base, query, hash = ""] = /^([^?#]*)(?:\?([^#]*))?(#.*)?$/s.exec(address);
  if (query === undefined) return { url: address, removed: 0 };
  const parts = query.split("&");
  const kept = parts.filter((p) => !TRACKER.test(p.split("=")[0]));
  const removed = parts.length - kept.length;
  if (!removed) return { url: address, removed: 0 };
  return { url: base + (kept.length ? "?" + kept.join("&") : "") + hash, removed };
}

// ---------- Tab finder ----------
export function findTabs(tabs, text, limit = 5) {
  const words = text.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length || text.trim().length < 2) return [];
  return tabs.filter((t) => words.every((w) => ((t.title || "") + " " + (t.url || "")).toLowerCase().includes(w))).slice(0, limit);
}
