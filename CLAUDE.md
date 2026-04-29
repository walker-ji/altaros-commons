# @altaros/commons — Claude Code Guidelines

## What is this project?

`@altaros/commons` is the cross-platform team coordination daemon for AltarOS — a TypeScript npm package that syncs a vault folder (`Zampa/`) to Supabase, and (Phase B) hosts an MCP server for Claude Code/Desktop integration. Lives in `~/Music/altaros-commons/` (Walker's machine), pushed to `github.com/walker-ji/altaros-commons` (public).

Status: **Phase A.5 spike complete.** v0.0.1 with single-package layout, file watcher (chokidar), Supabase document round-trip, CLI. Validated on Mac. Phase B is the next significant build: monorepo split into `core/daemon/mcp`, MCP server with `commons.log_session()` etc., conflict-copy semantics, JWT auth.

## Read these first

- **`README.md`** — usage, install, config
- **`YOESEL-START-HERE.md`** — Yoesel's onboarding entry point (front-door doc)
- **`YOESEL-SETUP.md`** — daemon walkthrough (cross-platform, Windows-tested via Yoesel)
- **`YOESEL-CLAUDE-DESKTOP-SETUP.md`** — Claude Desktop + MCP filesystem setup
- **`~/Music/Resonance/Zampa/system/team-coordination-architecture.md`** — full systems overview, schema, identities, Phase B plan

## Working stack

- TypeScript ESM, Node.js 20+
- Tooling: `tsx` for dev (no build step), `tsc` for production builds
- Single package for the spike; will become a monorepo (`packages/{core,daemon,mcp}`) in Phase B

## Key files

```
src/
├── config.ts        Config loader: env → .env → ~/.altaros/commons-config.json
├── supabase.ts      Supabase client + push/pull/delete document operations
├── sync.ts          DocumentSync class — file watcher + push/pull, isSyncable() filter
├── cli.ts           Commander-based CLI: doctor, push, pull, watch, spike
├── spike.ts         Round-trip self-test (probe → push → read-back → verify → cleanup)
└── index.ts         Public API for use as a library
```

## Conventions

- **Forward-slash POSIX paths in Supabase** (e.g., `vision/origin.md`); translate to OS-native at file boundaries
- **Lowercase-hyphen filenames**, ASCII only, under 100 chars (Windows MAX_PATH safety)
- **Filter via `isSyncable()`** — skips `_commons/`, hidden files, non-`.md`, deeper-than-expected paths
- **Write LF line endings**; read both LF and CRLF; never re-save unchanged content (avoids CRLF sync churn on Windows)
- **No deletes propagated** in v0.0.1 — intentional safety; Phase B adds a confirmation flow

## Don't do

- Don't add logic that hardcodes `/` or `\\` for paths — always use Node's `path` module
- Don't commit `.env` (gitignored — verify before pushing if `.env` was modified)
- Don't bypass the documents-table schema — `documents` row needs `project_id`, `member_id`, `filename`, `file_type`, `file_size`, `storage_path` (use `""`), `extracted_text`
- Don't break the `doctor` → `push` → `pull` round-trip — these are the spike's contract; Yoesel's onboarding depends on them

## Phase B build queue (in priority order)

1. `commons-mcp` server — exposes `commons.draft_session_digest`, `commons.log_session`, `commons.team_state`
2. Stop-hook auto-draft on Claude Desktop session-end
3. Conflict-copy semantics on simultaneous edits (Obsidian Sync style)
4. JWT auth replacing service-role-key spike pattern
5. Delete propagation with confirmation flow
6. Daemon autostart recipes (launchd / systemd / Task Scheduler)
7. Monorepo split (`packages/core`, `packages/daemon`, `packages/mcp`)
8. PWA documents browse view (separate concern, may go in AltarOS web/ instead)
9. `zampa-synth` subcommand — Yoesel's local Ollama-backed synthesis on the Zampa folder

## Closing ritual

User-level `~/.claude/CLAUDE.md` defines the two-thread closing pattern. When working in this repo:

1. **Thread 1 — Repo docs**: update README, the YOESEL-* docs, ADRs in `docs/` (when added)
2. **Thread 2 — Vault digest**: session digest at `~/Music/Resonance/Zampa/sessions/YYYY-MM-DD-walker-{slug}.md` — Phase B build sessions are Zampa-adjacent enough that they belong in the team feed

Cross-reference repo files written in T1 by path.
