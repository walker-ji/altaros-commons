# Yoesel — Claude Code setup guide

You're moving from Claude (web/chat) to Claude Code (CLI). Same Claude underneath — but Code reads and writes files in your repos, runs commands, and can keep working sessions structured. This guide gets you set up the right way for our team's workflow on Zampa.

> **Companion guide**: `YOESEL-SETUP.md` in this repo covers installing the `altaros-commons` daemon. Do that one too — it's the bridge between you, Walker, and (eventually) InnoTech.

---

## What's actually different from Chat

| | Chat | Code |
|---|---|---|
| **Where it lives** | claude.ai in browser | A terminal on your machine |
| **What it can touch** | Just the conversation | Your filesystem — reads + writes files in the repo you launch it in |
| **Memory** | Per-conversation | Each working directory has its own context (via `CLAUDE.md` files) |
| **Zampa code work** | Cut-and-paste back and forth | Edits files in place, runs tests, makes commits |
| **Best for** | Quick questions, exploration | Real coding sessions, decisions you want documented |

You'll keep using Chat for some things (quick reads, mobile, casual). Code is for **working sessions**.

---

## Step 1 — Install Claude Code

If you haven't already:

```powershell
# In PowerShell, run as your user (NOT admin):
npm install -g @anthropic-ai/claude-code
```

Verify:
```powershell
claude --version
```

If `npm` isn't found: install **Node.js 20+ LTS** from [nodejs.org](https://nodejs.org/) first, restart PowerShell, retry.

---

## Step 2 — First sign-in + model

```powershell
claude
```

Walks you through OAuth sign-in (your Anthropic account — same one as Chat). Pick:
- **Model**: Claude Sonnet 4.5 (or latest available — defaults are fine)
- **Theme**: dark or light, your call
- **Trust this directory**: yes (when prompted in your Zampa repo)

When you're in, type `/help` to see commands.

---

## Step 3 — Where to launch Claude Code

You'll have **three different working directories** that matter, each with different purposes:

### A. Your Zampa code repo (where you develop)
Wherever you cloned `zampa-platform` on your Windows machine. Probably something like:
```
C:\Users\Yoesel\Documents\zampa-platform
```

**This is where most Claude Code sessions happen.** Open PowerShell, `cd` into it, run `claude`. From here, Claude can read your code, run tests, commit changes.

### B. `altaros-commons` (the sync daemon)
The repo you clone from `YOESEL-SETUP.md`. You'll occasionally `cd` here to run `npm run dev -- pull` / `push` / `watch`, or to fix daemon issues — usually not for Claude Code work.

### C. Your Obsidian vault (`Zampa/` folder inside)
**Don't launch Claude Code here.** This is reference material, not a codebase. Claude reads from here when you point it at it (e.g., "look at `Zampa/partners/dk-bank/checkout-ux-spec-v2.md`"), but the working directory should stay in (A).

---

## Step 4 — Set up your user-level `CLAUDE.md`

This file teaches Claude on your machine the conventions our team uses. It applies in every project you open, not just Zampa.

**Location on Windows**:
```
%USERPROFILE%\.claude\CLAUDE.md
```

i.e. `C:\Users\Yoesel\.claude\CLAUDE.md`. The `.claude` folder may already exist after Step 2; if not, create it.

**Open it in any editor** (`notepad %USERPROFILE%\.claude\CLAUDE.md`) and paste in:

```markdown
# Personal CLAUDE.md — Yoesel (Zampa team)

## Closing ritual: two threads

When I say "please fully document this session in all appropriate places",
document in two threads:

1. **Repo thread** — code-adjacent: update READMEs, ADRs, docs/, inline
   comments wherever the changes warrant. Native Edit/Write. Audience:
   anyone reading the code.

2. **Vault thread** — team-context: write a session digest at
   `<vault>/Zampa/sessions/YYYY-MM-DD-yoesel-{slug}.md`, using the
   template at `<vault>/Zampa/sessions/_template.md`. Cross-reference
   any repo files written in (1) by path.

Until commons-mcp ships (Phase B), the vault digest is hand-authored
from the template.

The vault path is wherever my Obsidian vault is — same as the
`VAULT_ROOT` in my `~/altaros-commons/.env`.

## Conventions

- Filenames: lowercase-hyphen, ASCII only, under 100 chars,
  date-prefix for sessions (YYYY-MM-DD)
- Author slug in filenames: `yoesel`
- `<vault>/Zampa/_commons/` is read-only — AltarOS writes there, not me
- Project name in shared work: "Zampa" (the Supabase slug is still
  "kuzu" for legacy reasons; use "Zampa" in user-facing copy)

## Tone

I'm working with Walker (Bhutan) on Zampa, a payment + event platform
in Bhutan. I'm a co-founder + lead developer. Direct collaboration
style; concise responses preferred over long-winded ones.
```

Save and close. From this point on, every Claude Code session you start anywhere on your machine has this context.

---

## Step 5 — Read the project-level `CLAUDE.md` files

Each repo can have its own `CLAUDE.md` that gives Claude context-specific guidance. Two you should read:

### `<vault>/Zampa/CLAUDE.md`
The team-conventions doc for the canonical Zampa knowledge base. It teaches Claude how the folder is organized and where session digests / decisions / partner docs go. **Read this in Obsidian** after your first `pull`. Reference, not action.

### `<your zampa-platform repo>/CLAUDE.md`
If Walker already has one in the Zampa code repo, read it for code-specific guidance. If not, ask him — together you can write one. It would cover things like:
- Where docs live (`docs/`, ADRs)
- Test conventions
- DK Bank / Stripe integration patterns
- Anything Zampa-codebase-specific that Claude should know

---

## Step 6 — Your first session, the right way

Once everything's set up, the simplest first real test:

1. `cd` into your Zampa code repo
2. `claude`
3. Ask Claude to help with a small Zampa task — could be a real one you were going to do anyway, or a documentation update for the new commons setup
4. Work the task
5. **Close with**: `please fully document this session in all appropriate places`

What should happen:
- Claude updates any relevant repo docs (Thread 1)
- Claude writes `<vault>/Zampa/sessions/2026-04-29-yoesel-onboarding.md` using the template (Thread 2)
- Your daemon (running `npm run watch` in another terminal, or do `npm run dev -- push` manually) propagates the digest to Supabase
- Walker pulls on his side, sees your first digest

That's the round-trip. Once it works, the workflow is in place.

---

## Step 7 — Optional: keyboard tricks

A few that pay off:

- `/help` inside a Claude session shows all commands
- `/clear` resets the conversation context (without quitting)
- `/compact` summarizes the conversation when it gets long, frees up context
- `Esc` while Claude is working interrupts gracefully — better than Ctrl+C
- `Shift+Tab` inserts a newline; `Enter` submits

---

## Step 8 — Keep Chat for what it's good for

You don't need to abandon Chat. Some things Chat is still better for:
- Quick questions on the go (mobile)
- Brainstorming when there's no code involved
- Exploration where you don't want artifacts
- Conversations with Walker about design decisions before they become code

Code is for the working sessions where you want files touched, decisions captured, and the legibility loop running.

---

## What to do if something feels wrong

- **Stuck on install / auth**: Walker can help live, or check `claude --help`
- **Claude doesn't know about the team conventions**: verify your `~/.claude/CLAUDE.md` exists with content from Step 4
- **Closing prompt produces a repo edit but no vault digest**: probably means Claude can't find the vault path — ask it explicitly to write to the path
- **Sync feels broken**: check `npm run dev -- doctor` from `altaros-commons/` (the daemon, not Claude Code)
- **You disagree with a convention**: capture it in your next session digest, propose changes. The format isn't sacred — it's a starting shape we'll evolve.

---

## How this fits the bigger picture

Right now (Phase A complete):
- 92 canonical Zampa docs are in your vault after `pull`
- Walker's machine reads them for synthesis (AltarOS), so he can ask his system questions about Zampa and get context-aware answers
- Your machine writes session digests when you close sessions; they sync to Walker's machine
- You and Walker are now legible to each other across machines

Coming (Phase B, weeks not months):
- A Claude Code MCP that automates the digest writing — `commons.log_session(...)` instead of hand-authoring
- Conflict-copy semantics on simultaneous edits
- Full-monorepo install (`npm install -g @altaros/commons`)
- InnoTech rollout

Coming further (Phase D, months):
- Possibly open-source as `claude-session-digest-mcp` — your patterns and feedback shape that

---

## TL;DR

1. `npm install -g @anthropic-ai/claude-code`
2. `claude` → sign in → pick Sonnet 4.5
3. Create `%USERPROFILE%\.claude\CLAUDE.md` with the content from Step 4
4. From your Zampa code repo, run `claude`, work a task, close with "please fully document this session in all appropriate places"
5. Verify the session digest landed in `<vault>/Zampa/sessions/`
6. Sync via `altaros-commons` daemon (separate guide)
7. Walker sees it on his side. Loop closed.
