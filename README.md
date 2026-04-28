# @altaros/commons

Cross-platform vault folder sync and Claude Code MCP for shared team knowledge bases.

> **Status: v0.0.1 spike.** Validates the cross-platform foundation. Phase B will add the proper daemon, MCP server, and conflict-copy semantics.

## What it does (today)

- Watches a folder inside your Obsidian vault (default: `<vault>/Zampa/`)
- Pushes every `.md` change to Supabase (`documents` table) as text/markdown
- Pulls remote `.md` files into the same folder, preserving folder structure
- Cross-platform from day one: Mac, Windows, Linux

## Prerequisites

- **Node.js 20+** — verify with `node --version`
- A Supabase project with the AltarOS commons schema (members, projects, documents tables — migrations 001–015)
- Your Supabase service-role key (spike only — Phase B will use scoped JWTs)
- Your `member_id` for the project you're syncing

## Install (development, this spike)

```bash
git clone <this repo> ~/Music/altaros-commons   # already done if you're reading this
cd ~/Music/altaros-commons
npm install
cp .env.example .env
# Edit .env with real values — see "Config" below
```

## Install (Phase B, future)

```bash
npm install -g @altaros/commons
altaros-commons init   # interactive config wizard
```

## Config

Required fields (env or `~/.altaros/commons-config.json`):

| Key | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Service-role key (spike only) |
| `COMMONS_PROJECT_ID` | UUID of the project in `projects` table |
| `COMMONS_MEMBER_ID` | UUID of your member row |
| `COMMONS_AUTHOR_SLUG` | Filename author tag (e.g. `walker`) |
| `VAULT_ROOT` | Absolute path to your Obsidian vault root |
| `COMMONS_SUBFOLDER` | Subfolder to sync (default: `Zampa`) |

### Looking up your `COMMONS_MEMBER_ID`

```sql
SELECT id, display_name, role
FROM members
WHERE project_id = '<your-project-id>'
  AND auth_id = auth.uid();   -- or filter by email
```

### Cross-platform vault path examples

```bash
# macOS
VAULT_ROOT=/Users/walker/Music/Resonance

# Windows (note forward slashes work in Node, but backslashes also OK in .env)
VAULT_ROOT=C:/Users/Yoesel/Documents/ObsidianVault

# Linux
VAULT_ROOT=/home/walker/Documents/ObsidianVault
```

## Usage

```bash
# Verify everything's wired up
npm run dev -- doctor

# Round-trip self-test (creates probe file, pushes, pulls, cleans up)
npm run spike

# One-shot full sync
npm run dev -- push    # local → supabase
npm run dev -- pull    # supabase → local

# Continuous watch (Ctrl+C to stop)
npm run watch
```

## Cross-platform notes

- **Filenames**: stick to lowercase-with-hyphens, ASCII only, under 100 chars. See `Zampa/CLAUDE.md` for the full convention.
- **Paths**: stored as forward-slash paths in Supabase (`vision/origin.md`). Translated to OS-native on read.
- **Line endings**: written as LF on disk. CRLF inputs are passed through unchanged on push (Phase B will normalize).
- **Windows file locks**: Obsidian holds an exclusive lock on actively-edited files. The watcher retries with backoff on `EBUSY` (Phase B). For the spike, save in Obsidian, then wait ~1s before triggering sync.
- **Hidden folders / `_commons/`**: skipped both directions. `_commons/` is reserved for AltarOS-written content (Phase B).

## What's NOT in this spike

- Conflict resolution (last-write-wins for now)
- Delete propagation (intentional — too risky without a confirmation flow)
- MCP server for Claude Code (Phase B)
- Daemon-mode autostart (Phase B; spike runs in foreground)
- JWT auth (uses service-role key directly; Phase B introduces per-member auth)
- Realtime push notifications (uses polling/event-driven Supabase writes only)

## Architecture (planned, Phase B)

```
@altaros/commons/
├── packages/
│   ├── core/         ← shared library (this spike, mostly)
│   ├── daemon/       ← persistent file-sync background process
│   └── mcp/          ← Claude Code MCP server (commons.log_session, etc.)
└── bin/
    └── altaros-commons   ← CLI entry: {start|mcp|doctor|init}
```

For now, single-package layout to keep the spike small.

## License

MIT
