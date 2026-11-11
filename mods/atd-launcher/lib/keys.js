// Platform-dependent keys (spec §3, §5, §6.1). Pure: no herdr imports.
// herdr-app spells the platform modifier `cmd` everywhere; off macOS that is the
// Super / Windows key, which the desktop usually takes, so Alt stands in for ⌘.

export const isMac = (platform) => platform === "macos";

/** The palette's shortcut when the config file has none. */
export const defaultShortcut = (platform) => (isMac(platform) ? "cmd-t" : "ctrl-t");

/** Hints for the run destinations, keyed by menu slot. */
export const runKeyHints = (platform) =>
  isMac(platform) ? { tab: "⌘↵", pane: "⇧↵", here: "⌘⇧↵" } : { tab: "Alt+↵", pane: "⇧↵", here: "Alt+⇧↵" };

/** The record screen's example shortcut. */
export const shortcutExample = (platform) => (isMac(platform) ? "⌘T" : "Ctrl+T");

/** Which run destination an Enter with these modifiers picks (§6.1). */
export function runMode(m) {
  const cmd = m.platform || m.alt;
  if (cmd && m.shift) return "here";
  if (cmd) return "tab";
  if (m.shift) return "pane";
  return "enter";
}

/** True when `ks` uses the platform modifier where the desktop usually takes it. */
export const unreachableShortcut = (ks, platform) => !isMac(platform) && /(^|-)cmd-/.test(ks);
