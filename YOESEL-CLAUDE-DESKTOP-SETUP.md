# Yoesel — Claude Desktop setup guide

You're moving from the Claude web app to the Claude **Desktop app** — the standalone Windows installer from claude.ai. Same Claude underneath, but Desktop can connect to **MCP servers** that give it real read/write access to your filesystem (your Zampa code repo, your Obsidian vault). That's how it becomes useful for coding work and the team's session-digest workflow.

> **Companion guide**: `YOESEL-SETUP.md` in this repo covers installing the `altaros-commons` daemon (the cross-machine sync). Do that one too — it's the bridge between you, Walker, and (eventually) InnoTech. Either order works.

---

## What's actually different from web Chat

| | Web (claude.ai) | Desktop |
|---|---|---|
| **Where it lives** | Browser | Standalone app on your taskbar |
| **What it can touch** | Just the conversation + uploads | Your filesystem, via **MCP servers** you authorize |
| **Persistent context** | Per-conversation | **Projects** with custom instructions + workspace files |
| **For coding** | Cut-and-paste back and forth | Edits files in place once MCP filesystem is wired up |
| **Best for** | Quick reads, mobile | Real working sessions where you want files touched + decisions captured |

You'll keep using web Chat for some things (mobile, quick reads). Desktop is for **working sessions**.

---

## Step 1 — Install Claude Desktop

1. Go to [claude.ai/download](https://claude.ai/download)
2. Download the **Windows installer** (.exe)
3. Run it, sign in with your Anthropic account (same one as web)

When it opens, the UI looks similar to the web app — sidebar with chats on the left, conversation in the middle.

---

## Step 2 — Pick model + verify settings

In the model dropdown (top of conversation): **Claude Sonnet 4.5** (or latest available).

Settings → Profile: confirm your name + email. This is what shows up if Claude needs to reference you.

---

## Step 3 — The critical step: MCP filesystem server

This is what makes Desktop useful for coding. Without it, Claude can't read or write files on your machine — it's still just chat.

The MCP filesystem server is a small Node.js process that runs on demand, gives Claude access to **specific folders you whitelist**, and exits when Claude closes. You configure which folders it can see.

### Prerequisites

- **Node.js 20+** installed (you'll need this anyway for the `altaros-commons` daemon — see `YOESEL-SETUP.md`). Verify in PowerShell: `node --version`

### Configure

The Claude Desktop config file lives at:

```
%APPDATA%\Claude\claude_desktop_config.json
```

i.e. `C:\Users\Yoesel\AppData\Roaming\Claude\claude_desktop_config.json`. The `Claude` folder may not exist yet — create it. The file may not exist yet — create it with this content:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:/Users/Yoesel/zampa-platform",
        "C:/Users/Yoesel/Documents/ObsidianVault/Zampa"
      ]
    }
  }
}
```

**Replace the two paths** with:
1. The actual path to your Zampa code repo on Windows (where you develop)
2. The path to the `Zampa/` subfolder inside your Obsidian vault (which will be populated after `altaros-commons pull`)

Forward slashes work on Windows in JSON (cleaner than escaping backslashes). Both these paths must be **absolute** and **must exist** when Claude Desktop starts.

> **Why two paths?** The first is your code (where Thread 1 of the closing ritual writes — repo docs, ADRs, inline). The second is the team knowledge base (where Thread 2 writes — session digests). Both need read/write.

Save the file and **fully restart Claude Desktop** (quit from system tray, relaunch). MCP servers only start at app launch.

### Verify it's connected

In a new conversation, look at the bottom-right of the input area — you should see an MCP indicator (icon or number showing "1 MCP"). Click it; "filesystem" should appear in the list.

Test it: ask Claude `list the files in my Zampa folder`. It should respond with actual filenames from your vault, not a refusal.

If something's wrong:
- Indicator missing → config JSON has a typo, or `npx` isn't on PATH (check PowerShell `where.exe npx`)
- Says "no access" → path in config doesn't exist yet, or has typo
- Test: open Notepad, save a tiny test.txt in one of the whitelisted folders, ask Claude to read it. Round-trip confirms.

---

## Step 4 — Create a "Zampa" project with team conventions

Claude Desktop's **Projects** feature pins persistent context across all chats inside that project. This is where the team conventions live.

In the sidebar, click **Projects → New Project**. Name it: `Zampa`.

Open project Settings → **Custom Instructions**. Paste this:

```
This project is the Zampa team's working space. I'm Yoesel — co-founder
+ lead developer, working with Walker (in Bhutan) on Zampa, a payment +
event platform. The team also has Sonam (finance), Wangchuk (tech,
InnoTech), and Panjo (external partner, InnoTech director).

I have an MCP filesystem server that gives you access to my Zampa code
repo and the team's shared knowledge base at <vault>/Zampa/. The
shared knowledge base has its own CLAUDE.md at the root — read that
first when working in this project, it explains the team's
conventions in detail.

## Closing ritual: two threads

When I say "please fully document this session in all appropriate
places", document in two threads:

1. **Repo thread** — code-adjacent: update READMEs, ADRs, docs/,
   inline comments wherever code changes warrant. Audience: anyone
   reading the code.

2. **Vault thread** — team-context: write a session digest at
   <vault>/Zampa/sessions/YYYY-MM-DD-yoesel-{slug}.md, using the
   template at <vault>/Zampa/sessions/_template.md. Cross-reference
   any repo files written in (1) by path.

(Eventually a `commons.log_session()` MCP tool will automate Thread
2 — Phase B of the build. For now, hand-author from the template.)

## Conventions

- Filenames: lowercase-hyphen, ASCII only, under 100 chars,
  date-prefix for sessions (YYYY-MM-DD).
- My author slug in filenames: `yoesel`.
- <vault>/Zampa/_commons/ is read-only — AltarOS writes there, not
  me.
- Project name in user-facing text: "Zampa". The Supabase project
  slug is still "kuzu" for legacy hashtext-salt reasons; use "Zampa"
  in everything human-readable.

## Tone

Direct collaboration; concise responses preferred over long-winded
ones. Walker and I both prefer terse-and-correct over verbose-and-
hedged.
```

Save. **Every chat you start inside the Zampa project now inherits these instructions.** New chats outside the project don't.

---

## Step 5 — Read the existing CLAUDE.md files

Once the MCP filesystem is wired and your `altaros-commons pull` has populated `<vault>/Zampa/`, ask Claude in a Zampa-project chat:

```
Read <vault>/Zampa/CLAUDE.md and <vault>/Zampa/README.md
and confirm you understand the folder structure.
```

(Replace `<vault>` with the actual path.)

Claude should respond summarizing the folder layout. If yes, you're set up correctly.

If your **Zampa code repo** has its own `CLAUDE.md` (Walker may have authored one), point Claude at that too — it has code-specific guidance.

---

## Step 6 — Your first session, the right way

A simple test of the full loop:

1. Open a chat in the Zampa project
2. Ask Claude to help with a small task on the Zampa code repo — could be a real one you were going to do, or just a dry run
3. Work the task — Claude edits files via the MCP filesystem
4. **Close with**: `please fully document this session in all appropriate places`

What should happen:
- Claude updates any relevant repo docs (Thread 1)
- Claude writes `<vault>/Zampa/sessions/2026-04-29-yoesel-onboarding.md` using the template (Thread 2)
- The `altaros-commons` daemon (running in a separate PowerShell with `npm run watch`, or do `npm run dev -- push` manually) propagates the digest to Supabase
- Walker pulls on his side and sees your first digest

That's the round-trip. Once it works, the workflow is in place.

---

## Step 7 — When to use Desktop vs. web Chat

**Desktop**: any session where you want files touched, decisions captured, code changed, or the project-level conventions to apply.

**Web Chat**: quick questions on the go, mobile, brainstorming with no code involved. Sometimes useful to have a separate space without the formal closing ritual hanging over it.

Don't feel obligated to do everything in Desktop. Use the right tool for the moment.

---

## Two machines: desktop (your primary) + laptop (out and about)

You work on two Windows machines — desktop at home (primary) and laptop on the go. Good news: **Obsidian Sync already keeps your vault aligned between them**, so this is simpler than it sounds. The daemon only needs to run on **one** machine.

### How the data flows

```
Walker's Mac vault Zampa/  ⇄  Supabase  ⇄  Yoesel's desktop daemon
                                                  ⇡⇣
                                          Yoesel's vault Zampa/ (desktop)
                                                  ⇡⇣ Obsidian Sync
                                          Yoesel's vault Zampa/ (laptop)
```

Two sync layers, each doing one job:
- **Obsidian Sync** keeps your desktop and laptop vaults aligned (your side, between your devices). Already does this for everything in your vault.
- **`altaros-commons` daemon** runs on **desktop only** — keeps the desktop's vault aligned with Walker's via Supabase.

### What goes on each machine

**Desktop (primary):**
1. Claude Desktop installed + signed in (Steps 1–2)
2. `claude_desktop_config.json` with MCP filesystem server (Step 3)
3. `altaros-commons` repo cloned + `npm install` + `.env` configured (see `YOESEL-SETUP.md`)
4. **`altaros-commons` daemon running**: `npm run watch` in a PowerShell tab, kept open while you work
5. "Zampa" project + Custom Instructions in Claude Desktop (Step 4)

**Laptop (mobile):**
1. Claude Desktop installed + signed in (same account → "Zampa" project + Custom Instructions appear automatically)
2. `claude_desktop_config.json` with MCP filesystem server — paths adjusted if needed
3. **No `altaros-commons` daemon needed.** Obsidian Sync handles delivery to/from desktop.

### Round-trip example

1. Sitting at laptop in a café, edit `Zampa/sessions/2026-04-30-yoesel-debug-payment.md` in Obsidian
2. Obsidian Sync propagates the file to your desktop at home (within ~30 sec when both online)
3. Desktop's daemon (`npm run watch`) sees the new file, pushes to Supabase
4. Walker pulls on his Mac, sees your digest

When desktop is off and you're on laptop:
- Edits queue in Obsidian Sync, deliver to desktop when it comes back online
- Walker sees the change shortly after
- Same in reverse: Walker's pushes land in desktop's vault, propagate to laptop via Obsidian Sync once desktop is on

This is fine for ordinary work patterns. Latency only adds up if your desktop is off for days.

### Optional fallback for long trips away from desktop

If you're out for a week and want direct sync from laptop to Supabase without going through desktop, install `altaros-commons` on laptop too (same setup as desktop, with laptop's `VAULT_ROOT`). **Don't run it normally** — keep the watch off. When you actually need it (extended desktop outage), run `npm run dev -- pull` then `npm run dev -- watch` from laptop. Stop it before powering desktop back on, otherwise both daemons end up pushing the same content (idempotent but noisy).

For Phase A, you probably don't need this — desktop is reliable enough that its daemon covers normal travel.

### One thing to avoid

**Don't actively edit the same file on both machines at the same minute.** Obsidian Sync handles ordinary back-and-forth, but two simultaneous edits will conflict. The daemon's last-write-wins picks one. Phase B adds conflict-copy semantics. For now: save and close on the old machine before starting work on the new one.

### Setup order

1. **Desktop first** — full setup (Steps 1–6 above). Run a real first session, verify round-trip with Walker.
2. **Then laptop** — Steps 1–4 only (skip the daemon install). Confirm "Zampa" project appears, MCP filesystem connects, you can read/write `Zampa/` files via Claude Desktop on laptop. Obsidian Sync handles propagating any laptop-side writes through to desktop's daemon.
3. **Verify Obsidian Sync is on for both** — Obsidian Settings → Sync → status should show "Synced".

---

## Coming in Phase B (weeks, not months)

- A native **`commons-mcp`** server you'll add alongside the filesystem one. It exposes `commons.log_session()`, `commons.draft_session_digest()`, `commons.team_state()`. The closing ritual goes from "Claude writes a markdown file" to "Claude calls a tool that writes the markdown + emits a Supabase notification." Cleaner.
- **Stop-hook auto-draft** — the digest gets proposed automatically at session-end without you typing the prompt. You just review and confirm.
- Until then, the manual flow is the contract.

---

## Troubleshooting

**MCP indicator missing after restart**:
- JSON syntax error in `claude_desktop_config.json` — validate it pasted into [jsonlint.com](https://jsonlint.com)
- `npx` not on PATH — open PowerShell, run `where.exe npx`, should print a path

**"Access denied" when Claude tries to read/write a file**:
- That folder isn't in the `args` list in `claude_desktop_config.json`
- Add it, restart Desktop fully

**Custom Instructions not being followed**:
- Confirm you're in the Zampa project (sidebar shows "Zampa" highlighted)
- New chat inside the project? Settings inherit per-project, not per-chat
- Sometimes Claude needs a gentle reminder mid-conversation: "remember the Zampa project conventions"

**You disagree with a convention**:
- Capture it in your next session digest, propose the change. Format isn't sacred — it's an evolving shape we'll converge on.

**Where to ask for help**:
- Walker first
- Anything Walker can't quickly fix — capture as a session digest. It lands in his vault on next pull and becomes the queue for Phase B work.

---

## TL;DR

1. Install Claude Desktop from claude.ai/download → sign in → pick Sonnet 4.5
2. Create `%APPDATA%\Claude\claude_desktop_config.json` with the filesystem MCP config (Step 3) — paths to your Zampa code repo + vault Zampa folder
3. Restart Desktop fully; verify MCP indicator shows "filesystem"
4. Create a "Zampa" project; paste the custom instructions from Step 4 (this carries to your laptop automatically when signed into same account)
5. Run a real task in a Zampa-project chat; close with "please fully document this session in all appropriate places"
6. Verify the digest landed in `<vault>/Zampa/sessions/`
7. Daemon pushes to Supabase; Walker pulls and sees it. Loop closed.
8. On your laptop: Steps 1–4 only (Claude Desktop + MCP filesystem). **No daemon on laptop** — your desktop daemon handles Supabase via Obsidian Sync delivering files between your two machines.
