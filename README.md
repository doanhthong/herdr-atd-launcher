# ATD Launcher

**An Arc-like command palette (New Tab) for [herdr-app](https://herdr.dev).** Press ⌘T, pick an agent,
pick the space it should run in. Each space keeps its own quick commands one keystroke away.

![ATD Launcher](preview.png)

## Why

In Arc, ⌘T isn't just "new tab". It's one box that finds anything and opens it where you want.
ATD Launcher brings that to herdr-app:

1. **Choose the agent.** Claude, Codex, Pi, a second Claude profile: each is just a saved command.
2. **Choose the space.** The current space comes first, then your other open spaces, then saved
   project folders that aren't open yet (picking one opens it).
3. **It runs** in a new tab there. Your default flow is **⌘T, Enter, Enter**.

```text
ATD Launcher                                   Esc close
> _

Quick Actions
› + New Claude tab                       claude
  + New Codex tab                        codex
  + New tab
Agents
  ◐ api        codex — add rate limit    waiting for input
  ● web        claude — fix login bug    working
Commands
  ▸ Dev server                           web · pnpm dev
  ▸ Run tests                            web · pnpm test --watch
  ▸ Claude (work)                        global · CLAUDE_CONFIG_DIR=… claude
Spaces
  ● web                                  ~/code/web
  + docs                                 ~/code/docs
──────────────────────────────────────────────────────────────
Enter choose space · ⌘↵ new tab · ⇧↵ right pane · ⌘⇧↵ here · Tab more
```

## What's in the box

- **Quick commands per space**: the dev server, tests and "Open in Zed" of the project you're in
  show at the top of Commands. They're gone when you're in another project.
- **Four run keys, everywhere**: `Enter` picks a space · `⌘Enter` new tab here · `⇧Enter` right pane ·
  `⌘⇧Enter` types it into the current terminal (asks first if an agent is busy there).
- **Agents waiting for you on top**: jump to any running agent. The ones waiting for input come first.
- **Spaces**: switch to open ones, or open saved project folders by name.
- **Fuzzy search over everything**, including every herdr-app command ("Pane: Split", "Layout: Switch"…),
  with type icons so agents, commands and spaces are easy to tell apart.
- **Configurable in place**: pin quick actions, add spaces and commands, record the shortcut, all from
  inside the palette (`Tab` on any row for its options). A JSON file holds it all, so it's easy to sync.
- **Safe by default**: anything that closes or removes something asks first. Esc always goes one
  step back.

On Linux and Windows, `Alt` stands in for `⌘` and the shortcut is `Ctrl+T`.

## Install

**From the gallery:** ask your agent in herdr-app to add `herdr.dev/mods/doanhthong/herdr-atd-launcher`.

**By hand:**

1. **Copy the mod** into herdr-app:
   ```sh
   git clone https://github.com/doanhthong/herdr-atd-launcher && cd herdr-atd-launcher
   ./scripts/sync.sh        # → ~/.config/herdr-app/mods/atd-launcher
   ```
2. **Add the shortcut**: merge [`keys.json`](keys.json) into `~/.config/herdr-app/keys.json`, so that its
   `"global"` section has
   ```json
   "cmd-t": "mod.open:atd-launcher"
   ```
   On Linux and Windows use `"ctrl-t"` instead: there `cmd` is the Super / Windows key, which the
   desktop usually takes. On macOS this replaces herdr-app's own ⌘T (new tab). The palette's
   `+ New tab` covers that, or you can pick another key.
3. **Create your config** (recommended) from the example, then edit its agents, spaces and commands:
   ```sh
   cp examples/atd-launcher.example.json ~/.config/herdr-app/atd-launcher.json
   ```
   Tip: let an agent fill it in. Ask it to scan the folders you've worked in lately, add them as
   `spaces`, and add each project's dev/test commands (from `package.json` scripts, a `Makefile`, etc.)
   as space `commands`, following [§8 of the spec](docs/BEHAVIOR-SPEC-v2.md#8-configuration-file) and
   keeping your existing entries.
4. **Press ⌘T** (Ctrl+T on Linux and Windows).

The mod runs programs (`$SHELL`, `hc send`, `test -d`) and reads and writes
`~/.config/herdr-app/atd-launcher.json` and `keys.json`. It makes no network calls.

## Config

`~/.config/herdr-app/atd-launcher.json` is re-read every time the palette opens. Most of it can also be
edited from the palette (Tab on a row, or Settings).

```json
{
  "commands": [
    { "id": "claude", "label": "Claude", "command": "claude" },
    { "id": "codex",  "label": "Codex",  "command": "codex" }
  ],
  "spaces": [
    { "id": "web", "path": "~/code/web", "commands": [
      { "id": "dev", "label": "Dev server", "command": "pnpm dev" }
    ] }
  ],
  "quickActions": [{ "command": "claude", "label": "New Claude tab" }, { "builtin": "new-tab" }]
}
```

- **`commands`** are global: your agents and anything else you want everywhere. Enter asks for a space
  (set `"askSpace": false` to run straight in a new tab in the current space).
- **`spaces`** are project folders, each with optional `commands`. Space commands show only while
  you're in that folder, and Enter runs them in a new tab in their own space.
- **`quickActions`** are pins at the top: `{ "command": "id" }` or `"space-id/command-id"`,
  `{ "space": "id" }`, `{ "builtin": "new-tab" | "new-space" }`, `{ "action": "pane.split" }`.
- `label` and `id` are optional. A second Claude profile is just another command with env vars in
  front (see `Claude (work)` in the example).
- Without a config the palette still runs: Claude as the only agent, three default quick actions,
  no saved spaces.
- `shortcut` in this file wins over `keys.json`: the palette writes it there each time it opens.
  Leave it out (as the example does) to keep the binding from step 2.
- Every field is described in [§8 of the spec](docs/BEHAVIOR-SPEC-v2.md#8-configuration-file).

## Docs

- [`docs/BEHAVIOR-SPEC-v2.md`](docs/BEHAVIOR-SPEC-v2.md): what the palette does (the source of truth)
- [`RECIPE.md`](RECIPE.md): the gallery brief to build it from scratch
- [`AGENTS.md`](AGENTS.md): how to work on it (layout, dev loop, gotchas)

## License

[MIT](LICENSE)
