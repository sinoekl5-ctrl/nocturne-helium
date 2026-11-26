// The command bar and the extension-only settings.
{
  const $ = (id) => document.getElementById(id);
  const field = $("command"), results = $("results");
  const readMode = () => {
    try { const v = localStorage.getItem("nocturne-cleaner"); return CLEANER_MODES.includes(v) ? v : "suggest"; }
    catch { return "suggest"; }
  };
  const openTab = (tab) => { chrome.tabs.update(tab.id, { active: true }); chrome.windows.update(tab.windowId, { focused: true }); };

  function row(label, run) {
    const b = document.createElement("button");
    b.className = "result";
    b.dir = "auto";
    b.textContent = label;
    b.addEventListener("click", run);
    results.append(b);
  }

  let turn = 0;
  field.addEventListener("input", async () => {
    const mine = ++turn, text = field.value;
    const sum = calculate(text);
    const address = toAddress(text);
    const tabs = sum === null && !address && text.trim().length > 1 ? findTabs(await chrome.tabs.query({}), text) : [];
    if (mine !== turn) return; // a newer keystroke already took over
    results.textContent = "";
    if (sum !== null) row("= " + sum, () => { field.value = String(sum); results.textContent = ""; field.focus(); });
    if (address && readMode() === "suggest") {
      const clean = cleanUrl(address);
      if (clean.removed) row("Open without tracking (" + clean.removed + " removed): " + clean.url, () => location.assign(clean.url));
    }
    for (const tab of tabs) row("Switch to tab: " + (tab.title || tab.url), () => openTab(tab));
  });

  field.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || e.isComposing || !field.value.trim()) return;
    const sum = calculate(field.value);
    if (sum !== null) { field.value = String(sum); results.textContent = ""; return; }
    const address = toAddress(field.value);
    if (address) location.assign(readMode() === "auto" ? cleanUrl(address).url : address);
    else chrome.search.query({ text: field.value.trim(), disposition: "CURRENT_TAB" });
  });

  const cleaner = $("cleaner"), sleep = $("sleep");
  cleaner.value = readMode();
  cleaner.addEventListener("change", () => { try { localStorage.setItem("nocturne-cleaner", cleaner.value); } catch {} });
  chrome.storage.local.get("sleepMinutes").then((v) => { sleep.value = String(v.sleepMinutes || 0); });
  sleep.addEventListener("change", () => chrome.storage.local.set({ sleepMinutes: Number(sleep.value) }));
}
