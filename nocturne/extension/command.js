// Command bar: Enter opens an address, anything else goes to the browser's default search engine.
export function toAddress(text) {
  const t = text.trim();
  if (/^https?:\/\/\S+$/i.test(t)) return t;
  if (/^localhost(:\d+)?(\/\S*)?$/i.test(t)) return "http://" + t;
  if (/^[^\s\/?#@:]+\.[a-z]{2,}(:\d+)?([\/?#]\S*)?$/i.test(t)) return "https://" + t;
  return null;
}
