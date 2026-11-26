// Sleeps idle tabs when the owner turned the setting on.
const ALARM = "nocturne-sleep";
const ensureAlarm = async () => { if (!(await chrome.alarms.get(ALARM))) chrome.alarms.create(ALARM, { periodInMinutes: 5 }); };
chrome.runtime.onInstalled.addListener(ensureAlarm);
chrome.runtime.onStartup.addListener(ensureAlarm);
ensureAlarm();

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM) return;
  const { sleepMinutes = 0 } = await chrome.storage.local.get("sleepMinutes");
  if (!sleepMinutes) return;
  for (const tab of pickSleepers(await chrome.tabs.query({}), Date.now(), sleepMinutes)) {
    try { await chrome.tabs.discard(tab.id); } catch {} // the tab may have closed meanwhile
  }
});
