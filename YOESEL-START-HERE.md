# Yoesel — start here

You're being onboarded onto the Zampa team's shared coordination infrastructure. The pieces you'll set up here let you and Walker (and eventually InnoTech) work in the same shared knowledge base across machines, with Claude Desktop wired into both your Zampa code and the team's reference docs.

This doc is the **front door**. It points you at the right next steps in the right order. The longer guides handle details.

> **Estimated time**: 30–45 minutes start to finish, including reading.

---

## What you're setting up

```
┌────────────────────────────────────────────────────────────────┐
│  Your two Windows machines (desktop + laptop, both 16 GB)     │
│  ──────────────────────────────────────────────────────────   │
│  • Claude Desktop with MCP filesystem (both machines)          │
│  • Obsidian + Obsidian Sync (both — already in place)         │
│  • altaros-commons daemon (DESKTOP ONLY)                       │
│  • Vault folder: <vault>/Zampa/ (canonical team knowledge)     │
└────────────────────────────────────────────────────────────────┘
                            ⇡⇣
                    Supabase (documents table)
                            ⇡⇣
                    Walker's Mac (full operator stack)
```

After setup, this works:

- You write code in Claude Desktop pointed at your Zampa repo. Claude can read and edit files directly.
- You close sessions with **"please fully document this session in all appropriate places"** — Claude updates repo docs AND writes a session digest to `<vault>/Zampa/sessions/YYYY-MM-DD-yoesel-{slug}.md`.
- The daemon on your desktop pushes the digest to Supabase. Walker pulls and sees it.
- Walker writes things → daemon pulls → land in your vault → Obsidian Sync delivers to your laptop. You read everything in Obsidian on either machine.

---

## The path

### Phase 1: `altaros-commons` daemon (~10–15 min on desktop)

Read and follow: **[YOESEL-SETUP.md](./YOESEL-SETUP.md)**

You'll:
1. Install Node.js 20+ if not already
2. Clone this repo (one-liner is in the doc)
3. `npm install`
4. Create `.env` from `.env.example` and fill in (see values below)
5. `npm run dev -- doctor` — verify connectivity
6. `npm run dev -- pull` — get 93 canonical Zampa docs into your Obsidian vault
7. `npm run watch` — leave running in a PowerShell tab to push your changes automatically

**Only on your desktop machine.** Your laptop doesn't need the daemon — Obsidian Sync handles desktop ⇄ laptop on your side.

### Phase 2: Claude Desktop (~10 min, on each machine)

Read and follow: **[YOESEL-CLAUDE-DESKTOP-SETUP.md](./YOESEL-CLAUDE-DESKTOP-SETUP.md)**

You'll:
1. Install Claude Desktop from claude.ai/download (both machines)
2. Configure `%APPDATA%\Claude\claude_desktop_config.json` with the MCP filesystem server pointing at your Zampa code repo + your vault Zampa folder
3. Restart Desktop, verify the MCP indicator shows "filesystem"
4. Create a "Zampa" project, paste the Custom Instructions from the doc
5. Repeat MCP config on your laptop (Project + Custom Instructions roll over automatically via your Anthropic account)

### Phase 3: First session (~10 min)

After Phase 1 + 2 complete, open a chat in the **Zampa** project on your desktop. Paste the **kickoff prompt** below as your first message. This grounds Claude in the team setup.

Then ask Claude to help you with a small actual task on the Zampa code repo — could be a real one, or a doc update for the new commons setup. Work the task. **Close with**:

```
please fully document this session in all appropriate places
```

What should happen:
- Claude updates relevant repo docs (Thread 1)
- Claude writes a session digest to `<vault>/Zampa/sessions/YYYY-MM-DD-yoesel-{slug}.md` (Thread 2)
- Your desktop's `npm run watch` pushes the digest to Supabase
- Walker pulls and sees it on his side

That's the validation moment. Loop closed.

---

## Your `.env` values

Most of these are pre-filled. Two pieces you fill in:
- `SUPABASE_SERVICE_KEY` — **Walker gives you this directly** (sensitive, not in this public doc)
- `VAULT_ROOT` — your Obsidian vault root path on Windows (Settings → About → Vault location). Use forward slashes — Node handles them on Windows.

```
SUPABASE_URL=https://nyikfzzmrrarufxrewqn.supabase.co
SUPABASE_SERVICE_KEY=<ask Walker — sensitive, do not commit>
COMMONS_PROJECT_ID=871f3b8a-fce4-4157-ae3c-5cd1cd30cd15
COMMONS_MEMBER_ID=2ebc2d78-be80-4887-b923-c85a36b58922
COMMONS_AUTHOR_SLUG=yoesel
VAULT_ROOT=C:/Users/Yoesel/Documents/MyVault
COMMONS_SUBFOLDER=Zampa
```

> Replace `C:/Users/Yoesel/Documents/MyVault` with your actual vault path. The vault must already exist (i.e., Obsidian must have opened it before).

---

## Your kickoff prompt

After Phase 1 + 2 complete and you've done your first `pull`, **paste this as your first message in a new chat inside the "Zampa" Claude Desktop project**. Replace `<vault>` with your actual vault path on Windows.

```
Hi Claude. I'm Yoesel, working on Zampa with Walker — co-founder + lead
developer. I've just set up Claude Desktop with the MCP filesystem
connected to my Zampa code repo and the team's shared knowledge base
at <vault>/Zampa/.

Before any actual work, please ground yourself in the team setup:

1. Read <vault>/Zampa/CLAUDE.md and <vault>/Zampa/README.md — confirm
   you understand the folder conventions and the two-thread closing
   pattern.

2. Read <vault>/Zampa/system/team-coordination-architecture.md —
   the systems overview Walker wrote up. Tells you where everything
   lives and what's planned for Phase B.

3. Read <vault>/Zampa/system/system-overview.md — Zampa-the-platform
   itself (containers, payment flows, modules).

4. Read <vault>/Zampa/sessions/2026-04-29-walker-altaros-commons-foundation.md
   — most recent session digest, also a working example of the format
   we use.

After that, give me a one-paragraph summary confirming what you
understand. Then I'll tell you what we're working on.
```

Claude will read those files via the MCP filesystem, summarize what it found, and you're ready to work.

---

## What you'll have at the end

| Working state | Where |
|---|---|
| 93 canonical Zampa docs | In `<vault>/Zampa/` (read in Obsidian) |
| Claude Desktop with file access | Your desktop and laptop |
| "Zampa" project with team conventions | Sidebar in Claude Desktop, both machines |
| Daemon pushing your changes | Desktop, foreground PowerShell |
| Round-trip with Walker validated | First session digest in `<vault>/Zampa/sessions/` |

---

## Folder naming for clarity

Two folders, different casing on purpose:

| Folder | Path on your machine | Purpose |
|---|---|---|
| Zampa code repo | `C:/Users/Yoesel/zampa-platform` (or wherever you cloned it) | Where you develop |
| Zampa knowledge base | `<vault>/Zampa` | Team's shared reference docs |

Both go in your `claude_desktop_config.json` MCP filesystem args. Different cases (`zampa-platform` lowercase vs `Zampa` capitalized) keep them visually distinct in Claude's responses.

---

## If something breaks

1. **Walker first** — sitting next to you (or DM/Slack)
2. **`npm run dev -- doctor`** in `altaros-commons/` — diagnoses sync issues
3. **MCP issues** — see Troubleshooting in `YOESEL-CLAUDE-DESKTOP-SETUP.md` (JSON validation, `npx` PATH, Defender flags)
4. **Anything Walker can't quickly fix** — capture as a session digest. It lands in his vault on next pull and becomes the queue for Phase B improvements.

---

## What's coming after you're set up

This is **Phase A** — the foundation. Once you and Walker validate the round-trip, **Phase B** starts:

- **`commons-mcp` server** — adds `commons.log_session()` and friends to your MCP config alongside the filesystem one. The closing ritual goes from "Claude writes a markdown file" to "Claude calls a tool that writes the markdown + emits a Supabase notification." Cleaner.
- **Stop-hook auto-draft** — the digest gets proposed automatically at session-end without you typing the prompt
- **Conflict-copy semantics** — Obsidian-Sync-style on simultaneous edits
- **`zampa-synth`** — lightweight tool that runs your local Ollama (`qwen3.5:4b`) on the Zampa folder. Your own synthesis, on your own machine, output flows into `_commons/synthesis/` and propagates to Walker

Until Phase B ships, the manual flow above is the contract.

---

## Read deeper when curious

- **[`Zampa/system/team-coordination-architecture.md`](https://github.com/walker-ji/altaros-commons/tree/main)** (in your vault after first pull) — full systems overview
- **[`Zampa/CLAUDE.md`](https://github.com/walker-ji/altaros-commons/tree/main)** (in your vault after first pull) — team conventions for Claude
- **[`Zampa/README.md`](https://github.com/walker-ji/altaros-commons/tree/main)** (in your vault after first pull) — folder navigation guide

Welcome to the Zampa team's shared brain.
