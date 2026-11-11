// Host actions (spec §6.4): herdr-app's own commands, with the kind of input
// each required argument needs inferred from its name (the command list has
// no types). Commands with an input we can't ask for are hidden.

const titleWord = (w) => (w ? w[0].toUpperCase() + w.slice(1) : w);
export const titleCase = (s) => s.split(/[_\s]+/).map(titleWord).join(" ");

/** "pane.wait_for_output" → { category: "Pane", title: "Pane: Wait For Output" } */
export function describe(name) {
  const dot = name.indexOf(".");
  const category = titleCase(dot < 0 ? "app" : name.slice(0, dot));
  const rest = titleCase(dot < 0 ? name : name.slice(dot + 1));
  return { category, title: `${category}: ${rest}` };
}

// Never offered: the palette itself, and inputs we can't prompt for.
const HIDDEN = new Set(["app.palette"]);

/** What to ask for one required argument of `command`, or null if unaskable. */
export function inputKind(command, arg) {
  const group = command.split(".")[0];
  switch (arg) {
    case "pane": return { kind: "pane" };
    case "terminal": return { kind: "terminal" };
    case "tab": return { kind: "tab" };
    case "space": return { kind: "space" };
    case "id":
      if (group === "space") return { kind: "space" };
      if (group === "tab") return { kind: "tab" };
      if (group === "layout") return { kind: "layoutNode" };
      return { kind: "text" };
    case "direction":
      return { kind: "choice", choices: command === "pane.split" ? ["right", "down"] : ["left", "right", "up", "down"] };
    case "place": return { kind: "choice", choices: ["tab", "right", "down"] };
    case "to": return { kind: "choice", choices: ["program", "menu"] };
    case "confirmed": return { kind: "bool" };
    case "index": case "px": case "weight": return { kind: "number" };
    case "name":
      if (command.startsWith("layout.")) return { kind: "layoutName" };
      if (command === "app.theme") return { kind: "theme" };
      return { kind: "text" };
    case "layout": case "argv": case "props": return null; // nested data
    default: return { kind: "text" };
  }
}

const DESTRUCTIVE = /\.(close|kill|reset|quit)$/;

/** commands() → host actions the palette can run, in the host's order. */
export function hostActions(commands) {
  const out = [];
  for (const c of commands ?? []) {
    if (HIDDEN.has(c.name)) continue;
    const inputs = [];
    let ok = true;
    for (const a of c.args ?? []) {
      if (!a.required) continue;
      const k = inputKind(c.name, a.name);
      if (!k) { ok = false; break; }
      inputs.push({ name: a.name, ...k });
    }
    if (!ok) continue;
    const { category, title } = describe(c.name);
    const takesConfirmed = (c.args ?? []).some((a) => a.name === "confirmed");
    out.push({ name: c.name, category, title, about: c.about ?? "", inputs, destructive: DESTRUCTIVE.test(c.name), takesConfirmed });
  }
  return out;
}

/** Number inputs are checked as you type. */
export function checkNumber(text) {
  if (!text.trim()) return "Enter a number";
  return Number.isFinite(Number(text)) ? null : "Not a number";
}
