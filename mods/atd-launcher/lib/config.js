// The palette's config file (spec §8): parsing with defaults, and edits that
// keep unknown keys and existing order. Pure: no herdr imports, so it's testable
// with node. `raw` is the parsed JSON tree; edits mutate it in place.

import { defaultShortcut } from "./keys.js";

const defaultCommands = () => [{ id: "claude", label: "Claude", command: "claude" }];
export const defaultQuickActions = () => [
  { command: "claude", label: "New Claude tab" },
  { builtin: "new-tab" },
  { builtin: "new-space" },
];
export const BUILTINS = { "new-tab": "New tab", "new-space": "New space" };

export function slug(text) {
  const s = String(text ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return s || "item";
}

export function basename(path) {
  const p = String(path ?? "").replace(/\/+$/, "");
  return p.slice(p.lastIndexOf("/") + 1) || p || "~";
}

/** Shortens a label to ~30 characters (spec §7, Add command). */
export function cutLabel(text, n = 30) {
  const s = String(text ?? "").trim();
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

// Gives every entry an id: its own, else a unique slug of `fallback(entry)`.
function assignIds(entries, fallback) {
  const taken = new Set(entries.filter((e) => typeof e.src?.id === "string" && e.src.id).map((e) => e.src.id));
  for (const e of entries) {
    if (typeof e.src?.id === "string" && e.src.id) { e.id = e.src.id; continue; }
    const base = slug(fallback(e));
    let id = base;
    for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
    taken.add(id);
    e.id = id;
  }
}

function normCommands(list, where, errors, spaceId) {
  const out = [];
  list.forEach((src, i) => {
    if (!isObj(src) || typeof src.command !== "string" || !src.command.trim()) {
      errors.push(`${where}[${i}]: needs a "command"`);
      return;
    }
    // §6.1 "ask for space": on for global commands, off for space commands, unless set.
    const askSpace = typeof src.askSpace === "boolean" ? src.askSpace : !spaceId;
    out.push({ src, label: typeof src.label === "string" && src.label ? src.label : cutLabel(src.command), command: src.command, space: spaceId, askSpace });
  });
  assignIds(out, (e) => (typeof e.src.label === "string" && e.src.label) || e.command.split(/\s+/)[0]);
  for (const c of out) c.ref = spaceId ? `${spaceId}/${c.id}` : c.id;
  return out;
}

/**
 * Parses the file's text (null: no file). Returns
 * { raw, fatal, errors, shortcut, commands, spaces, quickActions, synthetic }.
 * `platform` (herdr's window().platform) picks the default shortcut.
 * A broken file gives `fatal` and the defaults, so everything else keeps working.
 */
export function parseConfig(text, platform) {
  let raw = {};
  let fatal = null;
  if (text != null && text.trim()) {
    try {
      raw = JSON.parse(text);
      if (!isObj(raw)) { fatal = "The file must hold a JSON object"; raw = {}; }
    } catch (e) {
      fatal = String(e.message ?? e);
      raw = {};
    }
  }
  return { ...normalize(raw, platform), fatal };
}

export function normalize(raw, platform) {
  const errors = [];
  const synthetic = { commands: raw.commands === undefined, quickActions: raw.quickActions === undefined };
  const shortcut = typeof raw.shortcut === "string" && raw.shortcut ? raw.shortcut : defaultShortcut(platform);

  let cmdList = raw.commands === undefined ? defaultCommands() : raw.commands;
  if (!Array.isArray(cmdList)) { errors.push(`"commands" must be a list`); cmdList = []; }
  const commands = normCommands(cmdList, "commands", errors, null);

  let spList = raw.spaces ?? [];
  if (!Array.isArray(spList)) { errors.push(`"spaces" must be a list`); spList = []; }
  const spaces = [];
  spList.forEach((src, i) => {
    if (!isObj(src) || typeof src.path !== "string" || !src.path.trim()) {
      errors.push(`spaces[${i}]: needs a "path"`);
      return;
    }
    spaces.push({ src, path: src.path, label: typeof src.label === "string" && src.label ? src.label : basename(src.path) });
  });
  assignIds(spaces, (s) => s.label);
  spaces.forEach((s, i) => {
    let cl = s.src.commands ?? [];
    if (!Array.isArray(cl)) { errors.push(`spaces[${i}].commands must be a list`); cl = []; }
    s.commands = normCommands(cl, `spaces[${i}].commands`, errors, s.id);
  });

  let qaList = raw.quickActions === undefined ? defaultQuickActions() : raw.quickActions;
  if (!Array.isArray(qaList)) { errors.push(`"quickActions" must be a list`); qaList = []; }
  const quickActions = [];
  qaList.forEach((src, i) => {
    const kinds = isObj(src) ? ["builtin", "command", "space", "action"].filter((k) => typeof src[k] === "string" && src[k]) : [];
    if (kinds.length !== 1) {
      errors.push(`quickActions[${i}]: needs exactly one of "builtin", "command", "space", "action"`);
      return;
    }
    const kind = kinds[0];
    if (kind === "builtin" && !BUILTINS[src.builtin]) {
      errors.push(`quickActions[${i}]: unknown builtin "${src.builtin}"`);
      return;
    }
    // Pins have no behaviour fields (§6.1); old newTab/chooseSpace are ignored here.
    quickActions.push({ src, index: i, kind, ref: src[kind], label: typeof src.label === "string" && src.label ? src.label : null });
  });

  return { raw, errors, synthetic, shortcut, commands, spaces, quickActions };
}

export function serialize(raw) {
  return JSON.stringify(raw, null, 2) + "\n";
}

// ---- lookups ---------------------------------------------------------------

export function findCommand(cfg, ref) {
  if (!ref) return null;
  const slash = ref.indexOf("/");
  if (slash < 0) return cfg.commands.find((c) => c.id === ref) ?? null;
  const sp = cfg.spaces.find((s) => s.id === ref.slice(0, slash));
  return sp?.commands.find((c) => c.id === ref.slice(slash + 1)) ?? null;
}

export function findSpace(cfg, id) {
  return cfg.spaces.find((s) => s.id === id) ?? null;
}

export function pinFor(cfg, kind, ref) {
  return cfg.quickActions.find((q) => q.kind === kind && q.ref === ref) ?? null;
}

// ---- edits (mutate raw; callers re-normalize) --------------------------------

function materialize(raw, key) {
  if (key === "commands" && raw.commands === undefined) raw.commands = defaultCommands();
  if (key === "quickActions" && raw.quickActions === undefined) raw.quickActions = defaultQuickActions();
  if (key === "spaces" && raw.spaces === undefined) raw.spaces = [];
}

// Writes an item's generated id into the file, so references to it stay stable.
function pinId(src, id) {
  if (src && !src.id) {
    // Put id first, keeping the rest of the entry's order.
    const rest = { ...src };
    for (const k of Object.keys(src)) delete src[k];
    Object.assign(src, { id }, rest);
  }
}

function commandSrc(raw, ref) {
  if (!ref.includes("/")) materialize(raw, "commands");
  const c = findCommand(normalize(raw), ref);
  return c ? c : null;
}

function rawList(raw, spaceId) {
  if (!spaceId) {
    materialize(raw, "commands");
    return raw.commands;
  }
  const sp = findSpace(normalize(raw), spaceId);
  if (!sp) throw new Error(`No saved space "${spaceId}"`);
  pinId(sp.src, sp.id);
  if (!Array.isArray(sp.src.commands)) sp.src.commands = [];
  return sp.src.commands;
}

/** Adds a command to `spaceId` (null: global). Returns its ref. */
export function addCommand(raw, spaceId, { label, command, askSpace }) {
  const list = rawList(raw, spaceId);
  const taken = new Set(normalize(raw)[spaceId ? "spaces" : "commands"]
    .flatMap((x) => (spaceId ? (x.id === spaceId ? x.commands : []) : [x])).map((c) => c.id));
  const base = slug(label || command.split(/\s+/)[0]);
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
  const entry = { id, label: label || cutLabel(command), command };
  if (typeof askSpace === "boolean") entry.askSpace = askSpace;
  list.push(entry);
  return spaceId ? `${spaceId}/${id}` : id;
}

export function updateCommand(raw, ref, { label, command, askSpace }) {
  const c = commandSrc(raw, ref);
  if (!c) throw new Error(`No command "${ref}"`);
  pinId(c.src, c.id);
  if (label != null) c.src.label = label;
  if (command != null) c.src.command = command;
  if (typeof askSpace === "boolean") c.src.askSpace = askSpace;
}

function retargetPins(raw, kind, from, to) {
  if (!Array.isArray(raw.quickActions)) return;
  raw.quickActions = raw.quickActions.filter((q) => to != null || !(isObj(q) && q[kind] === from));
  for (const q of raw.quickActions) if (isObj(q) && q[kind] === from) q[kind] = to;
}

export function removeCommand(raw, ref) {
  const c = commandSrc(raw, ref);
  if (!c) throw new Error(`No command "${ref}"`);
  const list = rawList(raw, c.space);
  list.splice(list.indexOf(c.src), 1);
  retargetPins(raw, "command", ref, null);
}

/** Moves a command to another scope (null: global). Returns its new ref. */
export function moveCommand(raw, ref, toSpace) {
  const c = commandSrc(raw, ref);
  if (!c) throw new Error(`No command "${ref}"`);
  if ((c.space ?? null) === (toSpace ?? null)) return ref;
  const from = rawList(raw, c.space);
  from.splice(from.indexOf(c.src), 1);
  const to = rawList(raw, toSpace);
  const taken = new Set(normalize(raw)[toSpace ? "spaces" : "commands"]
    .flatMap((x) => (toSpace ? (x.id === toSpace ? x.commands : []) : [x])).map((x) => x.id));
  let id = c.id;
  for (let n = 2; taken.has(id); n++) id = `${c.id}-${n}`;
  const rest = { ...c.src };
  delete rest.id;
  to.push({ id, ...rest });
  const newRef = toSpace ? `${toSpace}/${id}` : id;
  retargetPins(raw, "command", ref, newRef);
  return newRef;
}

/** Adds a saved space. Returns its id. */
export function addSpace(raw, { label, path }) {
  materialize(raw, "spaces");
  const taken = new Set(normalize(raw).spaces.map((s) => s.id));
  const base = slug(label || basename(path));
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
  raw.spaces.push({ id, label: label || basename(path), path });
  return id;
}

export function updateSpace(raw, id, { label, path }) {
  const sp = findSpace(normalize(raw), id);
  if (!sp) throw new Error(`No saved space "${id}"`);
  pinId(sp.src, sp.id);
  if (label != null) sp.src.label = label;
  if (path != null) sp.src.path = path;
}

export function removeSpace(raw, id) {
  const sp = findSpace(normalize(raw), id);
  if (!sp) throw new Error(`No saved space "${id}"`);
  raw.spaces.splice(raw.spaces.indexOf(sp.src), 1);
  retargetPins(raw, "space", id, null);
  if (Array.isArray(raw.quickActions)) {
    raw.quickActions = raw.quickActions.filter((q) => !(isObj(q) && typeof q.command === "string" && q.command.startsWith(id + "/")));
  }
}

/** Pins an item; for commands and spaces the item's id is written into the file. */
export function addPin(raw, pin) {
  const cfg = normalize(raw);
  if (pin.command) {
    const c = findCommand(cfg, pin.command);
    if (c && !c.src.id) {
      if (cfg.synthetic.commands && !c.space) { materialize(raw, "commands"); }
      const again = findCommand(normalize(raw), pin.command);
      pinId(again.src, again.id);
      if (again.space) pinId(findSpace(normalize(raw), again.space).src, again.space);
    }
  }
  if (pin.space) {
    const s = findSpace(cfg, pin.space);
    if (s) pinId(s.src, s.id);
  }
  materialize(raw, "quickActions");
  const entry = {};
  for (const k of ["builtin", "command", "space", "action"]) if (pin[k]) entry[k] = pin[k];
  if (pin.label) entry.label = pin.label;
  raw.quickActions.push(entry);
}

export function removePin(raw, index) {
  materialize(raw, "quickActions");
  raw.quickActions.splice(index, 1);
}

export function unpinItem(raw, kind, ref) {
  materialize(raw, "quickActions");
  raw.quickActions = raw.quickActions.filter((q) => !(isObj(q) && q[kind] === ref));
}

function dropLegacy(q) {
  if (isObj(q)) { delete q.newTab; delete q.chooseSpace; }
}

export function movePin(raw, index, delta) {
  materialize(raw, "quickActions");
  const list = raw.quickActions;
  dropLegacy(list[index]);
  const to = index + delta;
  if (to < 0 || to >= list.length) return index;
  const [x] = list.splice(index, 1);
  list.splice(to, 0, x);
  return to;
}

export function renamePin(raw, index, label) {
  materialize(raw, "quickActions");
  const q = raw.quickActions[index];
  dropLegacy(q);
  if (label) q.label = label;
  else delete q.label;
}

export function resetPins(raw) {
  delete raw.quickActions;
}

export function setShortcut(raw, shortcut, platform) {
  if (shortcut === defaultShortcut(platform) && raw.shortcut === undefined) return;
  raw.shortcut = shortcut;
}
