// §6.5 folder prompt: which folder to list for the typed text, which names match, and the completion.
// Pure: main.js reads the folder and passes the names in.

export const MAX_SUGGESTIONS = 8;

/**
 * Splits typed text into the folder to list (as typed, ending in `/`) and the name being typed.
 * null when the text gets no suggestions (empty, relative).
 */
export function splitFolderPath(text) {
  if (text === "~") text = "~/";
  if (!text.startsWith("/") && !text.startsWith("~/")) return null;
  const i = text.lastIndexOf("/");
  return { dir: text.slice(0, i + 1), partial: text.slice(i + 1) };
}

/** Folder names starting with `partial` (case-insensitive), hidden ones only for a `.` prefix, sorted, capped. */
export function matchFolders(names, partial, max = MAX_SUGGESTIONS) {
  const p = partial.toLowerCase();
  return names
    .filter((n) => n && (p.startsWith(".") || !n.startsWith(".")) && n.toLowerCase().startsWith(p))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }) || (a < b ? -1 : a > b ? 1 : 0))
    .slice(0, max);
}

/** The field's text after completing with `name`: the typed name is replaced, a `/` added. */
export function completeFolder(text, name) {
  const sp = splitFolderPath(text);
  return sp ? `${sp.dir}${name}/` : text;
}

/** Folder names from `find <dir> -mindepth 1 -maxdepth 1 -type d` output. */
export function parseFindOutput(stdout, dir) {
  const base = dir.replace(/\/+$/, "");
  return stdout.split("\n").filter(Boolean)
    .map((line) => (line.startsWith(base + "/") ? line.slice(base.length + 1) : line.slice(line.lastIndexOf("/") + 1)))
    .filter((n) => n && !n.includes("/"));
}
