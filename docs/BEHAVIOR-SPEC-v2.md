---
title: Command Palette — Behavior & Experience Spec (v2)
status: draft for review
tags: [spec, command-palette, ux]
---

# Command Palette — Behavior & Experience Spec (v2)

> [!abstract]
> What the user sees and what happens, not how it's built. **This is the source of truth** for the `atd-launcher` herdr-app mod: change behavior here first, then the code. Where herdr-app forces a difference, the difference is written here too.

## 1. Concepts

| Concept                | Meaning                                                                                                                                                                                                                                                                                         |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Space / Tab / Pane** | A workspace (usually tied to a folder) / a tab inside it / a terminal inside a tab                                                                                                                                                                                                              |
| **Agent**              | A coding agent (Claude, Codex, Pi…) running in a pane                                                                                                                                                                                                                                           |
| **Current**            | The pane, tab or space that had focus when the palette opened                                                                                                                                                                                                                                   |
| **Saved space**        | A label + folder, with optional **space commands**                                                                                                                                                                                                                                              |
| **Saved command**      | A label + command text. **Global** (shown everywhere; agent launchers like `claude` are global commands) or a **space command** (shown only in its space, §6.3)                                                                                                                                 |
| **Quick action**       | An ordered pin to a built-in (`New tab`, `New space`), saved command, saved space or host action. Pins are references, so editing an item updates its pin. A pin can have its own label and, for commands, **open in new tab** (off by default). Running agents and open spaces can't be pinned |
| **Host action**        | One of the host app's own operations, e.g. "Pane: Split"                                                                                                                                                                                                                                        |

Default quick actions: `+ New Claude tab` (`claude`, new tab) · `+ New tab` · `+ New space`.

## 2. Principles

1. **One shortcut, one list** of every target and action, fuzzy-searchable.
2. **The common case is two keystrokes:** shortcut, Enter → new agent tab. The current item is sorted first and is the default.
3. **Ask only what's needed;** prefill what can be guessed.
4. **Safe by default:** anything that closes, removes, stops, disables or unlinks asks first (`No` is the default, Esc means No). A command is never typed into a busy pane without asking.
5. **Configurable in place.** The config file is optional.

## 3. Opening and closing

- **Shortcut:** ⌘T where the app receives ⌘ keys, otherwise prefix+T. Configurable. Pressing it again closes the palette. In herdr-app the shortcut is a `keys.json` global binding to `mod.open:atd-launcher`; the config file's `shortcut` is written there each time the palette opens, so the file wins.
- **Terminals often swallow ⌘ keys,** so `Alt+Enter` stands in for `⌘Enter`. The footer always shows keys that work, and Settings warns when a chosen shortcut can't be received.
- **Config rows show at once;** live sections show `Loading…` until their data arrives.
- **Closes:** any successful run, focus or create, and Open config file.
- **Stays open:** settings changes, cancels, and failures (the error is shown, then the user is back where they were, with inputs kept).

## 4. The main list

```text
Command Palette
> query_

Quick Actions
› + New Claude tab                       new tab · claude
  + New tab
  + New space
Agents
  ◐ api        codex — add rate limit    waiting for input
  ● web        claude — fix login bug    working
Spaces
  ● web                                  ~/code/web
  → api                                  ~/code/api
  → web                                  ~/code/web    (saved)
  → api                                  ~/code/api    (saved)
  + docs                                 ~/code/docs   (saved)
Commands
  ▸ Dev server                           web · pnpm dev -p 3001
  ▸ Codex                                global · codex
Settings
  …
Pane
  …

Enter run · ⌘Enter new tab · Tab options · Esc back           42/120
```

`42/120` = rows matching the search / all rows.

### 4.1 Sections

Shown in this order; empty sections are hidden. Each section puts the current item first.

1. **Quick Actions:** the user's pins, in order. A pinned space command shows only in its space. Pinned items also appear in their own section.
2. **Agents:** ones waiting for input go above the current one.
3. **Spaces:** open spaces, then all saved spaces. A saved space that's open is listed twice: once as open, once as saved. Open and saved spaces are matched by folder, never by label.
4. **Commands:** the current space's commands, then global ones.
5. **Settings** (§7).
6. **Host actions:** one section per category, e.g. `pane.wait_for_output` → "Pane: Wait For Output".

### 4.2 Icons

| `●` current/default (green) | `◐` agent waiting (yellow) | `+` creates (green) | `▸` runs here | `→` switches focus | `−` closes/removes (red) | `✎` / `⧉` edit/copy |
| --- | --- | --- | --- | --- | --- | --- |

Each row starts with a 2-character icon slot so text lines up. Long lines are cut with `…`; the selected row's highlight must survive the cut. The selected row (moved by the arrow keys or set by a click) has the strong highlight. The row under the mouse gets a fainter one, so the two can't be confused; hover doesn't move the selection (herdr-app gives virtual-list rows no hover event, and its hover state can go stale and leave a faint highlight behind). Highlights of neighbouring rows never touch.

### 4.3 Search

Fuzzy, case-insensitive, characters in order. Ranks higher: word-start matches, consecutive characters, shorter text. Also matches folders, command text, agent/tab names and method names. While searching, headers hide, results form one ranked list with a dim type tag (`Agent`, `Command`…), and pinned items appear once.

## 5. Keys

| Key | Where | Action |
| --- | --- | --- |
| type, `Backspace`, `Ctrl+U` | search, prompts | Edit / clear |
| `↑` `↓` `Ctrl+P` `Ctrl+N` `PgUp` `PgDn` | lists | Move |
| `←` `→` `Ctrl+A` `Ctrl+E` | text prompts | Move the cursor |
| `Enter` | anywhere | Do the default (first item of the row's menu). In Manage quick actions, Enter opens the pin's options instead |
| `⌘Enter` / `Alt+Enter` | commands | Run in a new tab (other rows: same as Enter) |
| `Tab` | rows | Options menu |
| `Shift+↑↓` | Manage quick actions | Move a pin (saves immediately) |
| `Esc` | anywhere | Back one step: clear the search → previous screen (search and selection restored) → close |
| `Ctrl+C` | anywhere | Close |
| click / right-click | rows | Same as `Enter` / `Tab` |

## 6. Rows

### 6.1 What each row does

**Bold** = Enter. Remove/Close items confirm first.

| Row | Options menu (`Tab` key) | Notes |
| --- | --- | --- |
| Saved command | **Run here** · Run in new tab · Run in new tab in another space… · Pin/Unpin · Edit… · Remove… | Run here types into the current pane; the tab keeps its name. A new tab is named after the command and opens in the current space (global) or the command's own space (space command). If that space isn't open, it's opened and its first tab is used. |
| New tab | **In current space** · In another space… | Opens an empty tab |
| New space | — | Asks for a folder (prefilled with the current one), creates the space and switches to it |
| Saved space | **Open** · Open a new copy · Pin/Unpin · Add command… · Edit… · Remove… | Open switches to it if open, else creates it at its folder. Missing folder → `Folder not found: <path>` with Edit… / Remove / Back |
| Open space | **Switch to** · Close… | |
| Agent | **Focus** · Close pane… | |
| Quick action | The item's menu + Rename · Toggle *open in new tab* · Move up/down · Unpin | |
| Host action | **Run** · Pin/Unpin | §6.4 |

"Another space…" pickers list open spaces (current first), then saved spaces that aren't open.

**Running a command in a new tab:** plain text (`pnpm dev -p 3001`) is started directly, split on spaces; text with shell syntax (pipes, `&&`, quotes, `$`, `~`…) runs through the user's shell (`$SHELL -ic`). Shell functions work either way; aliases only in the second form.

**Removing** a saved command or space from the palette also removes its pins (removing a space removes pins to its commands too). `⚠ missing` pins only come from hand-edits.

### 6.2 Busy pane guard

If the current pane is running an agent or another foreground process, Run here asks first: **Run in new tab** · Run here anyway · Cancel.

### 6.3 Which space you're in

The saved space whose folder contains the current pane's working folder (deepest match wins). If that folder is unknown, use the current space's folder. No match → only global commands.

### 6.4 Host actions

- **Inputs:** required inputs are asked in order: choices and yes/no → picker; pane/tab/space/plugin/agent → live picker; text/number → prompt (numbers checked as you type). Esc goes back one input. Actions whose required inputs can't be prompted for (lists, nested data) are hidden.
  - herdr-app's command list gives argument names but no types, so the kind is inferred from the name: `pane`/`tab`/`space`/`terminal` → live picker; `id` → space or tab picker by the command's group (`space.*`, `tab.*`), layout node picker for `layout.*`; `direction` → right/down (`pane.split`) or left/right/up/down; `place` → tab/right/down; `to` → program/menu; `confirmed` → yes/no; `index`/`px`/`weight` → number; `name` → layout picker (`layout.*`), theme picker (`app.theme`), else text; `layout`/`argv`/`props` → hidden; anything else → text.
  - `app.palette` is hidden. Actions ending in `.close`, `.kill`, `.reset`, `.quit` confirm first and pass `confirmed: true` when the command takes it.
- **Result:** success closes the palette and runs the action. herdr-app commands return nothing, so there is no result screen; a failure after closing shows as a toast.

### 6.5 Shared screens

- **Picker:** works like the main list, titled with a breadcrumb, e.g. `Claude → Run in another space`.
- **Text prompt:** one line plus a help line with an example. Invalid input shows an inline note instead of cancelling.
- **Confirm:** the title states the consequence, e.g. `Remove "web" and its 2 commands?`.
- **Status line:** a one-line notice above the footer, e.g. `✓ Added "Dev server" to web`. It clears on the next keystroke.
- **Error:** the message and what to try next.

## 7. Settings

| Row | Flow |
| --- | --- |
| `+ Add space…` | Folder (current) → label (folder name) |
| `+ Add command…` | Scope (This space / Global / other space) → command → label (the command, cut to ~30 characters) → Pin? (No / Yes, run here / Yes, new tab) |
| `✎ Manage quick actions…` | Pins in order, with the quick-action menu; `+ Add quick action…` (Built-ins / Commands / Spaces / Host actions, then for commands: run here or new tab?); `↺ Reset to defaults`. A pin whose item was deleted shows here as `⚠ missing: <label>`, never in the main list |
| `✎ Manage commands…` | All commands, grouped Global / per space; the menu adds **Move to…** |
| `✎ Shortcut…` | Record a new shortcut |
| `✎ Open config file` | Opens it in `$EDITOR` in a new tab |

Settings changes refresh the list in place, show a status line and keep the palette open. Values in parentheses are prefills.

**Manage quick actions** screen:

```text
Manage quick actions

› 1  + New Claude tab          new tab · claude
  2  + New tab                 built-in
  3  + New space               built-in
  4  ▸ Run tests               here · pnpm test
     + Add quick action…
     ↺ Reset to defaults

Enter options · Shift+↑↓ move · Esc done
```

## 8. Configuration file

Optional; for hand-editing and syncing dotfiles. It lives at `~/.config/atd-launcher/config.json` and is re-read every time the palette opens. Open config file creates it with the defaults if it's missing.

```json
{
  "shortcut": "cmd+t",
  "commands": [
    { "id": "claude", "label": "Claude", "command": "claude" },
    { "id": "codex",  "label": "Codex",  "command": "codex" }
  ],
  "spaces": [
    {
      "id": "web", "label": "web", "path": "~/code/web",
      "commands": [
        { "id": "dev",  "label": "Dev server", "command": "pnpm dev -p 3001" },
        { "id": "test", "label": "Run tests",  "command": "pnpm test --watch" }
      ]
    },
    { "path": "~/code/api" }
  ],
  "quickActions": [
    { "command": "claude", "label": "New Claude tab", "newTab": true },
    { "builtin": "new-tab" },
    { "builtin": "new-space" },
    { "command": "web/test" },
    { "space": "api" },
    { "action": "pane.split" }
  ]
}
```

- **Defaults:** missing `commands` → just Claude; missing `quickActions` → the three defaults; `[]` → empty. Labels (taken from the folder name or the command text), `newTab` (false) and `id`s (created by the palette) can be left out.
- **References:** global commands by `id`, space commands by `space-id/command-id`.
- **Errors:** a broken file shows one `⚠ Config error` row, with details and Open config file. Incomplete entries are skipped and listed there too. Everything else keeps working.
- **Preserving the file:** writes keep unknown keys and the existing order. If the file changed on disk since the palette read it, the write is refused, the file is re-read and the user is told to try again. A broken file is never written; fix it first.
- **Ids (decided):** a missing `id` defaults to a slug of the label, else of the folder's name (`~/code/api` → `api`); duplicates get `-2`, `-3`. Pinning an item writes its id into the file so the reference stays stable if the label changes.

## 9. Ideas for later

- [ ] Optional inputs for host actions ("More options…"), and list inputs (unlocks "send keys")
- [ ] Folder completion in folder prompts
- [ ] Command placeholders: `{folder}`, `{branch}`, `{file?}` asked at run time
- [ ] Keep-open mode to run several actions in a row
- [ ] Command groups: one pin opens agent + dev server + tests
- [ ] Import spaces from git repos under a root folder
- [ ] Rank recently used items higher in search (needs a local state file, kept out of the config)
- [ ] Paste (⌘V) in the search box and prompts (they're drawn by the palette, not a native input)
- [ ] Remote spaces (on another machine) as saved spaces; today folder checks and matching are local only
