# ATD Launcher

An Arc-style New Tab for herdr-app. Press ⌘T and a centered box comes up with one fuzzy-searchable list: your quick actions, the agents that are running (the ones waiting for you on top), your saved commands, your spaces, settings and every Herdr command. Pick an agent, such as Claude, and then the space it should run in, and it starts in a new tab there. Each space also has its own quick commands (dev server, tests, open in editor) that show while you're in it. The full behavior is in [`docs/BEHAVIOR-SPEC-v2.md`](docs/BEHAVIOR-SPEC-v2.md), which this brief summarizes.

![ATD Launcher](preview.png)

## What you see

- **A window overlay**, 680px wide and 75% of the window's height, centered, on `popover`, 14px padding, 10px gaps, 13px text in `foreground`. Nothing is dimmed behind it.
- **The header**: the screen's title in 14px semibold ("ATD Launcher" on the main list, a breadcrumb like `Claude → Run in new tab in` on a picker). On the right, in 11px `dim`, it says what Esc does now: `Esc clear search`, `Esc back to <screen>` or `Esc close`.
- **The search line**: `> ` then the query, with a drawn cursor. It's text the palette draws, not a native input.
- **The list**: a virtual list of 30px rows under 26px section headers (11px semibold `dim`, bottom-aligned). Sections, top to bottom, each hidden when empty and each with the current item first:
  1. **Quick Actions**: the person's pins, in order. Defaults: `+ New Claude tab` (`claude`), `+ New tab`, `+ New space`.
  2. **Agents**: running agents as `space  program — tab title  status`. Agents waiting for input (`◐`, `ansi3`) come above the current one.
  3. **Commands**: the current space's commands, then global ones, with `space · command text` on the right.
  4. **Spaces**: open spaces (`●` current, `→` others), then every saved space (`→` if open, `+` if not), each with its folder (`~` for home).
  5. **Settings**: `+ Add space…`, `+ Add command…`, `✎ Manage quick actions…`, `✎ Manage commands…`, `✎ Shortcut…`, `✎ Open config file`.
  6. **Host actions**: one section per command group, e.g. "Pane: Split".
- **A row**: a 2-character icon slot, then the label (max 260px, cut with `…`), then 12px `dim` detail, then an optional right-hand note. Icons: `●` current (`ansi2`), `◐` waiting (`ansi3`), `+` creates (`ansi2`), `▸` runs here, `→` switches focus, `−` closes or removes (`ansi1`), `✎` / `⧉` edit and copy. Other icons are `muted`. The selected row has a 6px-rounded `hover` background. The row under the mouse gets `hover` at 35% alpha. Rows sit 4px in from the sides, so neighbouring highlights never touch.
- **While searching**: the headers go away and the matches form one ranked list. Each row gets a type icon after its action icon (🤖 agent, ⚡ command, 📁 space, ⚙️ setting, 🧩 host action, ✨ built-in) and a dim type tag on the right (`Agent`, `Command`…) on a `raised` chip.
- **A status line** above the footer, 12px, in `ansi2` (`✓ Added "Dev server" to web`) or `ansi1` for errors.
- **The footer**, 11px `dim` above a 1px `border` line: the keys that work on the selected row, then `matches/total`. For example `Enter choose space · ⌘↵ new tab · ⇧↵ right pane · ⌘⇧↵ here · Tab more    42/120`.

## How it behaves

- **Open and close**: `mod.open:atd-launcher` toggles it (⌘T on macOS, Ctrl+T on Linux and Windows). It closes with Esc on the main list, Ctrl+C, the shortcut again, or any successful run, focus or create. Every close first focuses the pane that had focus when it opened, so you keep typing where you were.
- **The New Tab flow**: Enter on an agent command (`claude`, `codex`…) opens a space picker: the current space, then other open spaces, then saved spaces that aren't open. Choosing one starts the agent in a new tab there. If the saved space wasn't open, it's opened first and the agent runs in its first tab. So the default action is ⌘T, Enter, Enter.
- **Four run keys on every runnable row**: Enter goes to the space picker when the command's *ask for space* is on (the default for global commands), or to a new tab when it's off (the default for space commands). ⌘Enter is a new tab in the same space. Shift+Enter splits the current tab to the right and runs it there. ⌘Shift+Enter types it into the current terminal. On Linux and Windows, Alt stands in for ⌘. Ctrl+Enter and Opt+Enter never reach a mod, so they aren't used.
- **Per-space commands**: the "current space" is the saved space whose folder contains the focused pane's folder (the deepest match wins). Its commands show first in Commands, and its pins show in Quick Actions only there.
- **Other rows**: Enter on a saved space opens it, or switches to it if it's open (a missing folder shows `Folder not found` with Edit, Remove and Back). Enter on an open space switches to it. Enter on an agent focuses it. Enter on a host action asks for its required inputs one by one, then runs it.
- **Tab** (or right-click) opens the row's menu in two sections. **Run** lists the destinations, each with its key on the right. **Manage** has Ask for space on/off, Pin/Unpin, Edit…, Remove…, Move to…, Rename and Move up/down.
- **Keys**: ↑↓ and Ctrl+P/N move and wrap around at the ends. PgUp/PgDn move a page. Typing searches, Backspace deletes and Ctrl+U clears. Esc goes back one step (clear the search, then the previous screen with its search and selection restored, then close). A click is Enter, without modifiers.
- **Search** is fuzzy and case-insensitive with the characters in order. Word starts, runs of consecutive characters and shorter text rank higher, and commands get a fixed bonus over spaces. It also matches folders, command text, agent and tab names, and command names.
- **Safety**: anything that closes, removes or stops something asks first, with No as the default. Running a command "here" in a busy pane (an agent, or anything that isn't an idle shell) asks: Run in new tab · Run in right pane · Run here anyway · Cancel.
- **Settings stay in the palette**: a change refreshes the list in place and shows a status line. Failures show an Error screen and then go back with the inputs kept.

## Built from

- **Mod** `mods/atd-launcher/`, with `mod.json` set to `{ "place": "none", "title": "ATD Launcher", "overlay": { "kind": "window", "key": "atd-palette", "width": 680, "height": 0.75 } }`. `main.js` is the View: a stack of screens (the main list at the bottom; menus, pickers, prompts, confirms and the shortcut recorder pushed on top), each resolving a promise so that flows are plain `async` code. `lib/` holds the pure parts, tested with `node --test` (`npm test`): `fuzzy.js` scoring, `config.js` for parsing, defaults and in-place edits of the config file, `model.js` for sections and rows, `hostactions.js` to infer input kinds from argument names, and `keys.js` for per-platform keys and hints.
- **Keys** `keys.json`, set to `{"global": {"cmd-t": "mod.open:atd-launcher"}}`.
- **Config** `~/.config/herdr-app/atd-launcher.json` (`appHome()`), read every time the palette opens. It holds `commands` (global), `spaces` (`path`, optional `label`, `id` and `commands`), `quickActions` (pins: `{command}`, `{builtin}`, `{space}`, `{action}`) and an optional `shortcut`. Without the file the palette runs on defaults. Writes keep unknown keys and the existing order, and they refuse when the file changed on disk. See `examples/atd-launcher.example.json`.
- **herdr**: `spaces`, `agents`, `panes`, `focused`, `terminals`, `commands`, `theme`, `settings`, `window`, `home`, `appHome`, `readTextFile`, `writeTextFile`, `exec`, `hc`, `run`, `notify`, `closeOverlay`, `layout`/`layouts`/`themes` for host-action pickers. The commands it runs are `tab.new`, `terminal.open` (`place: right`), `space.new`, `space.select`, `space.close`, `agent.focus`, `pane.close`, `pane.focus` and any host action. "Run here" is `hc send <terminal> <text>`.
- **gpui**: `View`, `div`, `v_flex`, `h_flex`, `v_virtual_list`, `Scrollbar`, `VirtualListScrollHandle`, plus `cx.bind_keys` for Tab.
- **Programs**: `sh` reads `$SHELL`. Commands with shell syntax run as `$SHELL -ic <text>`, plain ones are split on spaces, and the right pane always uses `$SHELL -lic`. `test -d` checks folders.

## Watch out

- A `dialog` overlay eats Esc before the mod sees it, so this has to be a `window` overlay. Inside it, Tab moves focus before `on_key_down` sees the key, so bind `tab` to an action (`atd-tab`) in a key context.
- A window overlay doesn't give the keyboard back when it closes: call `pane.focus` on the origin pane before closing.
- `v_virtual_list` item sizes don't follow the app zoom: multiply them by `settings().zoom`, or rows overlap. `on_click` isn't allowed inside its rows: use `on_item_click` on the list. `herdr-app check` doesn't run row renderers, so row bugs only show in the real window.
- In the current themes `selected` ≈ `popover`, so the selection uses `hover`. Hover state can go stale: hover doesn't move the selection.
- A split's program starts with the app's `PATH`, not the login shell's, so the right pane wraps commands in `$SHELL -lic`.
- `run()` returns no ids, so a command for a saved space that isn't open goes in the `space.new` call itself (`name`, `folder`, `argv`) and becomes the new space's first tab. It isn't created first and then looked up.
- On Linux and Windows `cmd` is Super / Windows, which the desktop usually takes: bind `ctrl-t` there. A `shortcut` in the config file is written to `keys.json` on every open (the file wins), replacing other bindings to this mod and nothing else.
- Remote spaces aren't supported as saved spaces: folder checks are local.

## Done when

- `herdr-app check ~/.config/herdr-app/mods/atd-launcher` passes and `npm test` passes.
- ⌘T opens "ATD Launcher". Enter on `+ New Claude tab` shows the space picker with the current space first, and Enter starts `claude` in a new tab there. ⌘T again closes it, and typing goes back to the pane you were in.
- Choosing a saved space that isn't open opens it at its folder and runs the agent in its first tab.
- In a saved space's folder, that space's commands come first under Commands. In another folder they're gone.
- Shift+Enter on a command splits the current tab to the right and runs it there. ⌘Shift+Enter in an idle shell types it in. In a pane running an agent, it asks first.
- Typing `cla` shows one ranked list with type icons and tags. Esc clears it, then Esc closes.
- `+ Add command…` writes to `~/.config/herdr-app/atd-launcher.json`, keeping the other keys. A file edited by hand in the meantime makes the write refuse.
