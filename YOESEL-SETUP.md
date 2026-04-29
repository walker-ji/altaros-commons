# Yoesel — `@altaros/commons` setup (Windows)

> **Pair this with `YOESEL-CLAUDE-DESKTOP-SETUP.md`** in this same repo. That one covers the Claude Desktop app (installing, MCP filesystem, the Zampa project + custom instructions, the closing ritual). They go together — this guide is the daemon (cross-machine sync); that one is the working surface (where you actually do sessions). Either order works.

This walks you through getting set up so that the canonical Zampa knowledge base (vision, system docs, partner work, session digests) is synced to your Obsidian vault on your Windows machine.

After this, you and Walker share one Zampa folder. You both write into it via Obsidian; the daemon handles the sync to Supabase; the other person's machine pulls and the new content appears in their vault.

> **Time estimate**: 15–20 minutes. Most of it is one-time setup.

---

## Prerequisites

You need:

1. **Node.js 20 or newer.** Check: open PowerShell, run:
   ```powershell
   node --version
   ```
   Should print `v20.x.x` or higher. If not installed, get the LTS installer from [nodejs.org](https://nodejs.org/) (use the .msi for Windows).

2. **Git for Windows.** Check:
   ```powershell
   git --version
   ```
   If missing: [git-scm.com](https://git-scm.com/download/win).

3. **Obsidian** with your existing vault open. (You already have this.)

4. **Walker's invitation** containing:
   - The git repo URL (Walker is filling this in once he picks the destination)
   - Your `.env` values (Walker has these prepared)

---

## Step 1 — Clone the repo

Pick a folder to put it in. Walker uses `~/Music/altaros-commons` on his Mac; on Windows, anywhere in your Documents or home folder is fine. Example:

```powershell
cd $env:USERPROFILE
git clone https://github.com/walker-ji/altaros-commons.git altaros-commons
cd altaros-commons
```

---

## Step 2 — Install dependencies

```powershell
npm install
```

Should finish in under a minute. If you see `EACCES` or permission errors, try:

```powershell
npm install --cache=$env:TEMP\altaros-npm-cache
```

This uses an isolated cache and bypasses any global cache permission issues (Walker hit this on Mac).

If Windows Defender or SmartScreen flags any of the npm dependencies, click "Allow" or "More info → Run anyway." These are mainstream packages (`@supabase/supabase-js`, `chokidar`, `commander`, `dotenv`) — not malicious, just unsigned.

---

## Step 3 — Configure `.env`

Copy the example and fill in your values:

```powershell
copy .env.example .env
notepad .env
```

Walker will give you all the actual values. The fields you'll fill in:

```
SUPABASE_URL=https://nyikfzzmrrarufxrewqn.supabase.co
SUPABASE_SERVICE_KEY=<Walker provides>
COMMONS_PROJECT_ID=871f3b8a-fce4-4157-ae3c-5cd1cd30cd15
COMMONS_MEMBER_ID=2ebc2d78-be80-4887-b923-c85a36b58922
COMMONS_AUTHOR_SLUG=yoesel
VAULT_ROOT=<your Obsidian vault root, see below>
COMMONS_SUBFOLDER=Zampa
```

**Finding your `VAULT_ROOT`:**
- Open Obsidian → Settings → About → "Vault location" shows the path
- Copy it as-is into `.env`. **Forward slashes work on Windows** (Node handles both):
  ```
  VAULT_ROOT=C:/Users/Yoesel/Documents/MyVault
  ```
  Backslashes also work but you'd need to escape them:
  ```
  VAULT_ROOT=C:\\Users\\Yoesel\\Documents\\MyVault
  ```
  Use forward slashes — easier.

Save the file and close Notepad.

---

## Step 4 — Verify connectivity (`doctor`)

```powershell
npm run dev -- doctor
```

You should see:

```
✓ Config loaded
  vault: C:/Users/Yoesel/Documents/MyVault
  synced folder: C:/Users/Yoesel/Documents/MyVault/Zampa
  project_id: 871f3b8a-fce4-4157-ae3c-5cd1cd30cd15
  author: yoesel (member 2ebc2d78...)
  supabase: https://nyikfzzmrrarufxrewqn.supabase.co
✓ Project found: Kuzu (slug: kuzu)
✓ 92 markdown docs already synced for this project
```

If anything's missing or fails, the error message will tell you what env var is wrong. Common issues:

- **"VAULT_ROOT does not exist"** → check the path you put in `.env` — backslashes need escaping or use forward slashes
- **"Project not found"** → COMMONS_PROJECT_ID typo or pasted with spaces around it
- **"network error" / TLS error** → first ensure you can reach `https://nyikfzzmrrarufxrewqn.supabase.co/rest/v1/` in a browser; if blocked, check corporate firewall/VPN

> **Note about "Kuzu":** the project name in Supabase is still "Kuzu" — that's the legacy slug. The brand is Zampa; Walker will rename the Supabase project name eventually. Both names refer to the same thing.

---

## Step 5 — Initial pull (the big one)

This pulls all 92 canonical Zampa docs into your vault:

```powershell
npm run dev -- pull
```

Expected:
```
Pulling to C:/Users/Yoesel/Documents/MyVault/Zampa...
✓ Pulled 92, wrote 92 (0 unchanged)
```

Now open Obsidian. The `Zampa/` folder in your vault is populated. Read `Zampa/README.md` for the navigation guide. **Read `Zampa/CLAUDE.md`** — that file teaches Claude (in your Claude Code sessions) what "document this session in all appropriate places" means in this team setup.

A good first-read order:
1. `Zampa/README.md` — folder navigation
2. `Zampa/sessions/2026-04-29-walker-altaros-commons-foundation.md` — what was built last night, includes notes for you
3. `Zampa/CLAUDE.md` — two-thread closing pattern
4. `Zampa/system/system-overview.md` — entry-point doc for the platform itself
5. `Zampa/current/state.md` — where Zampa stands right now

---

## Step 6 — Send your first push

To validate the round-trip:

1. In Obsidian, navigate to `Zampa/sessions/`
2. Copy `_template.md` to a new file: `2026-04-30-yoesel-onboarding.md`
3. Fill in a short digest about getting set up. Doesn't have to be elaborate — a few sentences confirming things work.
4. Save in Obsidian
5. Back in PowerShell:
   ```powershell
   npm run dev -- push
   ```
6. Walker will pull on his side and see your digest. The round-trip is real.

---

## Continuous sync (`watch` mode)

Once you're confident, run watch mode in a terminal tab:

```powershell
npm run watch
```

This stays running and pushes changes automatically when you save files in Obsidian. Ctrl+C to stop.

**Caveats for the spike:**
- **Push only on save**: changes go up automatically when you save in Obsidian. Pulling Walker's changes is still manual via `npm run dev -- pull` until Phase B adds bidirectional realtime.
- **Deletes don't propagate yet** — intentional safety. If you delete a file locally, the Supabase row stays. Phase B adds a confirmation flow.
- **Conflict on simultaneous edits**: last-write-wins for now. Phase B adds conflict-copy semantics. For tonight, just don't both edit the same file at the same time.

---

## Daily workflow once it's running

| Activity | What you do | What happens |
|---|---|---|
| Read team context | Open Obsidian → `Zampa/` folder | Whatever Walker / others have pushed appears |
| Write a thought | Edit a file in Obsidian, save | Watch mode pushes to Supabase |
| End of Claude Code session on Zampa | Tell Claude "fully document this session in all appropriate places" | Claude updates repo docs + writes a digest in `Zampa/sessions/` (the digest gets pushed automatically) |
| Sync down latest from team | `npm run dev -- pull` | Latest team content appears in your vault |
| Check sync status | `npm run dev -- doctor` | Reports row count and connectivity |

---

## Troubleshooting

**`npm install` slow or hanging on Windows:**
- Try `npm install --cache=$env:TEMP\altaros-npm-cache --no-audit`
- Antivirus scanning every npm extract can slow this dramatically — try `npm install --no-fund --no-audit` if it's still slow

**File lock errors (`EBUSY`) when watch mode tries to push a file you're editing in Obsidian:**
- Spike behavior: the watcher will fail silently and try again on next save
- Phase B adds proper retry-with-backoff
- Workaround: just save again after a moment

**Path too long errors on deeply-nested files:**
- Windows MAX_PATH is 260 chars by default
- The canonical Zampa folder is shallow enough that this shouldn't hit
- If it does: enable long path support — see [Windows long path docs](https://docs.microsoft.com/en-us/windows/win32/fileio/maximum-file-path-limitation)

**`altaros-commons` command not found:**
- That's the binary name from a global install (Phase B). For now, always use `npm run dev -- <command>` from inside the `altaros-commons` folder.

**Defender keeps quarantining the npm packages:**
- Add `<your-folder>\altaros-commons\node_modules\` to Defender exclusions: Settings → Update & Security → Windows Security → Virus & threat protection → Manage settings → Add exclusions

**You broke something / want to start over:**
```powershell
cd <your-folder>\altaros-commons
rm -r node_modules,.env,package-lock.json
# Then redo Step 2 + Step 3
```
Your vault is unaffected — this only resets the daemon's setup.

---

## Where to ask for help

Walker is your first port of call. Once Yoesel-Walker validates this works, the same setup goes to InnoTech with Wangchuk leading.

If you hit something Walker can't quickly fix, capture it as a session digest in `Zampa/sessions/` — that lands in his vault on next pull and becomes the queue of "things for Phase B to address."

---

## What this is part of

The canonical Zampa folder + this daemon + the documents-layer integration in AltarOS = **Phase A** of a multi-phase build. Where we go next:

- **Phase A.5b — done.** AltarOS now reads the canonical Zampa folder for synthesis and chat context (Walker's machine only, since AltarOS is Mac-first).
- **Phase B — coming.** Real npm package (`npm install -g @altaros/commons`), MCP server (`commons.log_session()` callable from Claude Code), Stop-hook auto-draft, conflict-copy semantics, JWT auth, daemon autostart.
- **Phase C — coming.** InnoTech rollout (Wangchuk + 1–2 others).
- **Phase D — coming.** Open-sourcing as `@altaros/commons` with AltarOS as one backend, Notion / git / Slack as alternatives.

You're on the ground floor. Anything you find awkward, document it — those notes shape Phase B.
