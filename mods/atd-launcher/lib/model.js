// Builds the main list (spec §4) from a snapshot of live data and the config.
// Pure: main.js passes everything in.

import { scoreFields } from "./fuzzy.js";
import { findCommand, findSpace, BUILTINS } from "./config.js";

export function expand(path, home) {
  if (!path) return home;
  if (path === "~") return home;
  if (path.startsWith("~/")) return home.replace(/\/+$/, "") + path.slice(1);
  return path;
}

export function tilde(path, home) {
  if (!path) return "~";
  const h = home.replace(/\/+$/, "");
  if (path === h) return "~";
  if (path.startsWith(h + "/")) return "~" + path.slice(h.length);
  return path;
}

const clean = (p) => (p.length > 1 ? p.replace(/\/+$/, "") : p);
export const sameFolder = (a, b, home) => clean(expand(a, home)) === clean(expand(b, home));
const contains = (folder, cwd) => {
  const f = clean(folder);
  return cwd === f || cwd.startsWith(f === "/" ? "/" : f + "/");
};

/** Spec §6.3: the saved space whose folder contains the current pane's working folder
 *  (deepest match wins); unknown cwd → the current space's folder. */
export function currentSavedSpace(cfg, cwd, spaceFolder, home) {
  const where = clean(expand(cwd || spaceFolder || "", home));
  let best = null;
  let bestLen = -1;
  for (const s of cfg.spaces) {
    const f = clean(expand(s.path, home));
    if (contains(f, where) && f.length > bestLen) { best = s; bestLen = f.length; }
  }
  return best;
}

/** The open space (if any) for a saved one, matched by folder, never by label. */
export function openSpaceFor(saved, spaces, home) {
  return spaces.find((sp) => !sp.machine && sameFolder(sp.folder || home, saved.path, home)) ?? null;
}

const STATUS_TEXT = { blocked: "waiting for input", working: "working", done: "done", idle: "idle" };

/** Rows for a command (shared by main list, pickers and manage screens). */
export function commandRow(cfg, c) {
  const scope = c.space ? findSpace(cfg, c.space)?.label ?? c.space : "global";
  return { key: `command:${c.ref}`, kind: "command", icon: "▸", label: c.label, detail: `${scope} · ${c.command}`, extras: [c.command, scope], command: c };
}

export function savedSpaceRow(s, snap) {
  const open = openSpaceFor(s, snap.spaces, snap.home);
  return {
    key: `saved:${s.id}`, kind: "savedSpace", icon: open ? "→" : "+", color: open ? null : "create",
    label: s.label, detail: tilde(expand(s.path, snap.home), snap.home), aside: "(saved)", extras: [s.path], saved: s, open,
  };
}

export function openSpaceRow(sp, snap) {
  const current = sp.id === snap.focused?.space;
  const folder = tilde(sp.folder || snap.home, snap.home);
  return {
    key: `space:${sp.id}`, kind: "openSpace", icon: current ? "●" : "→", color: current ? "current" : null,
    label: sp.name, detail: sp.machine ? `${sp.machine}:${folder}` : folder, extras: [sp.folder ?? ""], space: sp, current,
  };
}

export function hostRow(h) {
  return { key: `action:${h.name}`, kind: "host", icon: "▸", label: h.title, detail: h.name, extras: [h.name, h.about], host: h };
}

/** Resolves a pin to what it points at, or null when the item is gone. */
export function resolvePin(cfg, pin, ctx) {
  if (pin.kind === "builtin") return { label: BUILTINS[pin.ref], target: { kind: "builtin", ref: pin.ref } };
  if (pin.kind === "command") {
    const c = findCommand(cfg, pin.ref);
    return c ? { label: c.label, target: { kind: "command", command: c } } : null;
  }
  if (pin.kind === "space") {
    const s = findSpace(cfg, pin.ref);
    return s ? { label: s.label, target: { kind: "space", saved: s } } : null;
  }
  if (pin.kind === "action") {
    const h = ctx.hostActions.find((x) => x.name === pin.ref);
    return h ? { label: h.title, target: { kind: "host", host: h } } : null;
  }
  return null;
}

export function pinRow(cfg, pin, snap, ctx) {
  const r = resolvePin(cfg, pin, ctx);
  if (!r) return { key: `pin:${pin.index}`, kind: "pin", missing: true, icon: "⚠", color: "warn", label: `missing: ${pin.label ?? pin.ref}`, detail: pin.kind, pin };
  const t = r.target;
  const row = { key: `pin:${pin.index}`, kind: "pin", pin, target: t, label: pin.label ?? r.label };
  if (t.kind === "builtin") Object.assign(row, { icon: "+", color: "create", detail: "", targetKey: `builtin:${pin.ref}` });
  if (t.kind === "command") {
    Object.assign(row, {
      icon: "+", color: "create",
      detail: t.command.command, extras: [t.command.command], targetKey: `command:${t.command.ref}`,
    });
  }
  if (t.kind === "space") {
    const open = openSpaceFor(t.saved, snap.spaces, snap.home);
    Object.assign(row, { icon: open ? "→" : "+", color: open ? null : "create", detail: tilde(expand(t.saved.path, snap.home), snap.home), extras: [t.saved.path], targetKey: `saved:${t.saved.id}` });
  }
  if (t.kind === "host") Object.assign(row, { icon: "▸", detail: t.host.name, extras: [t.host.name], targetKey: `action:${t.host.name}` });
  return row;
}

export const SETTINGS = [
  { id: "add-space", icon: "+", color: "create", label: "Add space…" },
  { id: "add-command", icon: "+", color: "create", label: "Add command…" },
  { id: "manage-pins", icon: "✎", label: "Manage quick actions…" },
  { id: "manage-commands", icon: "✎", label: "Manage commands…" },
  { id: "shortcut", icon: "✎", label: "Shortcut…" },
  { id: "open-config", icon: "✎", label: "Open config file" },
];

/**
 * snap: { spaces, agents, focused, cwd, home, loading }
 * cfg: normalized config (or null while loading)
 * ctx: { hostActions, currentSaved }
 * Returns sections: [{ title, tag, rows, loading? }] with empty sections dropped.
 */
export function buildMain(snap, cfg, ctx) {
  const sections = [];
  const add = (title, tag, rows, extra = {}) => { if (rows.length || extra.loading) sections.push({ title, tag, rows, ...extra }); };

  // 1. Quick actions
  if (!cfg) add("Quick Actions", "Quick action", [], { loading: true });
  else {
    const rows = [];
    for (const pin of cfg.quickActions) {
      const row = pinRow(cfg, pin, snap, ctx);
      if (row.missing) continue; // only shown in Manage quick actions
      if (row.target.kind === "command" && row.target.command.space && row.target.command.space !== ctx.currentSaved?.id) continue;
      rows.push(row);
    }
    add("Quick Actions", "Quick action", rows);
  }

  // 2. Agents: waiting ones above the current one, then the rest.
  const focusedTerm = snap.focused?.terminal;
  const agentRows = snap.agents.map((a) => {
    const current = a.address === focusedTerm || a.focused;
    const waiting = a.status === "blocked";
    const prog = (a.program?.name ?? a.app ?? "agent").toLowerCase();
    return {
      key: `agent:${a.address}`, kind: "agent", agent: a, current, waiting,
      icon: waiting ? "◐" : current ? "●" : "→", color: waiting ? "waiting" : current ? "current" : null,
      label: a.space_name, detail: a.title ? `${prog} — ${a.title}` : prog, aside: STATUS_TEXT[a.status] ?? a.status,
      asideColor: waiting ? "waiting" : null, extras: [a.tab_name, prog, a.title ?? ""],
    };
  });
  const rank = (r) => (r.waiting ? 0 : r.current ? 1 : 2);
  agentRows.sort((x, y) => rank(x) - rank(y));
  add("Agents", "Agent", agentRows);

  // 3. Commands: the current space's, then global.
  if (!cfg) add("Commands", "Command", [], { loading: true });
  else {
    const here = ctx.currentSaved ? ctx.currentSaved.commands : [];
    add("Commands", "Command", [...here, ...cfg.commands].map((c) => commandRow(cfg, c)));
  }

  // 4. Spaces: open spaces (current first), then all saved spaces.
  const open = snap.spaces.map((sp) => openSpaceRow(sp, snap));
  open.sort((x, y) => (y.current ? 1 : 0) - (x.current ? 1 : 0));
  const saved = cfg ? cfg.spaces.map((s) => savedSpaceRow(s, snap)) : [];
  add("Spaces", "Space", [...open, ...saved], { loading: !cfg && !open.length });

  // 5. Settings
  const settingRows = [];
  if (cfg && (cfg.fatal || cfg.errors.length)) {
    settingRows.push({ key: "setting:config-error", kind: "configError", icon: "⚠", color: "warn", label: "Config error", detail: cfg.fatal ?? `${cfg.errors.length} entr${cfg.errors.length === 1 ? "y" : "ies"} skipped` });
  }
  for (const s of SETTINGS) {
    settingRows.push({ key: `setting:${s.id}`, kind: "setting", setting: s.id, icon: s.icon, color: s.color ?? null, label: s.label, detail: s.id === "shortcut" ? cfg?.shortcut ?? "" : "" });
  }
  add("Settings", "Setting", settingRows);

  // 6. Host actions, one section per category.
  const cats = new Map();
  for (const h of ctx.hostActions) {
    if (!cats.has(h.category)) cats.set(h.category, []);
    cats.get(h.category).push(hostRow(h));
  }
  for (const [cat, rows] of cats) add(cat, cat, rows);

  return sections;
}

/** §4.3: the color type icon shown before the label while searching. A pin shows its target's. */
const TYPE_ICONS = { agent: "🤖", command: "⚡", savedSpace: "📁", openSpace: "📁", space: "📁", setting: "⚙️", configError: "⚙️", host: "🧩", builtin: "✨" };
export function typeIcon(row) {
  const kind = row.kind === "pin" ? row.target?.kind : row.kind;
  return TYPE_ICONS[kind] ?? "";
}

/** Search ranking bonus: commands (and pins to commands) rank above spaces. */
const COMMAND_BONUS = 10;
function kindBonus(r) {
  return r.kind === "command" || (r.kind === "pin" && r.target?.kind === "command") ? COMMAND_BONUS : 0;
}

/**
 * Turns sections into display items. Without a query: headers and rows. With one:
 * a single ranked list with type tags, pinned items once (the item's own row wins).
 * Returns { items: [{head}|{row}], rows, total }.
 */
export function flatten(sections, query) {
  // Items and rows share the same (tagged) row objects.
  const tagged = sections.map((s) => s.rows.map((r) => (s.tag ? { ...r, tag: s.tag } : r)));
  const all = tagged.flat();
  const total = all.length;
  if (!query) {
    const items = [];
    sections.forEach((s, i) => {
      if (s.title) items.push({ head: s.title });
      if (s.loading && !s.rows.length) items.push({ note: "Loading…" });
      for (const r of tagged[i]) items.push({ row: r });
    });
    return { items, rows: all, total };
  }
  const own = new Set(all.filter((r) => r.kind !== "pin").map((r) => r.key));
  const scored = [];
  for (const r of all) {
    if (r.kind === "pin" && r.targetKey && own.has(r.targetKey)) continue;
    const s = scoreFields(query, r.label, [r.detail ?? "", ...(r.extras ?? [])]);
    if (s != null) scored.push({ r, s: s + kindBonus(r) });
  }
  scored.sort((a, b) => b.s - a.s);
  const rows = scored.map((x) => x.r);
  return { items: rows.map((row) => ({ row })), rows, total };
}
