// Which tabs may be put to sleep. Anything in use, pinned, playing sound or protected stays awake.
export const SLEEP_CHOICES = [0, 30, 60, 120]; // minutes, 0 = off (the default)

export function pickSleepers(tabs, now, minutes) {
  if (!SLEEP_CHOICES.includes(minutes) || minutes === 0) return [];
  return tabs.filter((t) =>
    !t.active && !t.pinned && !t.audible && !t.discarded && t.autoDiscardable !== false &&
    /^https?:/.test(t.url || "") && Number.isFinite(t.lastAccessed) && now - t.lastAccessed >= minutes * 60000);
}
