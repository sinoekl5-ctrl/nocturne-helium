// Builds one self-contained start page: template + tokens + phase code. Run: node nocturne/startpage/build.mjs [out.html]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

export function build() {
  const tokens = JSON.parse(read("../tokens/tokens.json"));
  const phase = read("../theme/phase.mjs").replace(/^export /gm, "");
  return read("./template.html")
    .replace("/*__TOKENS__*/", () => "const TOKENS = " + JSON.stringify(tokens) + ";")
    .replace("/*__PHASE__*/", () => phase);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const out = process.argv[2] || here + "/dist/index.html";
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, build());
  console.log("wrote " + out);
}
