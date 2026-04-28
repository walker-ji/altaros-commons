/**
 * DocumentSync — file-watcher loop that pushes local changes to Supabase
 * and pulls remote changes into the local vault folder.
 *
 * Cross-platform: chokidar handles macOS FSEvents, Linux inotify, Windows ReadDirectoryChangesW.
 *
 * Conflict policy (spike): last-write-wins on push. Phase B adds conflict-copy semantics
 * using content hashes + timestamps.
 */
import chokidar, { FSWatcher } from 'chokidar'
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import { join, dirname, relative, sep, posix } from 'node:path'
import { existsSync } from 'node:fs'
import { CommonsConfig, syncedFolderPath } from './config.js'
import { makeSupabase, pushDoc, pullDocs, VaultDoc } from './supabase.js'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Convert a system path to a forward-slash relative path for storage.
 * On Windows, "vision\\origin.md" → "vision/origin.md".
 */
export function toPosixRel(absPath: string, root: string): string {
  const rel = relative(root, absPath)
  return rel.split(sep).join(posix.sep)
}

/**
 * Convert a stored forward-slash path back to a system absolute path.
 */
export function fromPosixRel(rel: string, root: string): string {
  return join(root, ...rel.split(posix.sep))
}

/**
 * Should this path sync? Filters hidden files, _commons/ (read-only by convention),
 * and non-.md files.
 */
export function isSyncable(relPath: string): boolean {
  if (!relPath.endsWith('.md')) return false
  // Hidden files and folders
  const segments = relPath.split(posix.sep)
  if (segments.some((s) => s.startsWith('.'))) return false
  // _commons is AltarOS-written zone; humans don't sync there
  // Note: Phase B will reverse this — _commons IS what gets pushed FROM AltarOS,
  // not received. For spike we just skip it both ways.
  if (segments[0] === '_commons') return false
  return true
}

export class DocumentSync {
  private cfg: CommonsConfig
  private sb: SupabaseClient
  private watcher: FSWatcher | null = null
  private rootPath: string

  constructor(cfg: CommonsConfig) {
    this.cfg = cfg
    this.sb = makeSupabase(cfg)
    this.rootPath = syncedFolderPath(cfg)
  }

  /** One-shot: push every local file to Supabase. */
  async pushAll(): Promise<{ pushed: number; created: number; skipped: number }> {
    const files = await collectFiles(this.rootPath)
    let pushed = 0
    let created = 0
    let skipped = 0
    for (const absPath of files) {
      const relPath = toPosixRel(absPath, this.rootPath)
      if (!isSyncable(relPath)) {
        skipped++
        continue
      }
      const content = await readFile(absPath, 'utf-8')
      const result = await pushDoc(this.sb, {
        projectId: this.cfg.projectId,
        memberId: this.cfg.memberId,
        path: relPath,
        content,
        size: Buffer.byteLength(content, 'utf-8'),
      })
      pushed++
      if (result.created) created++
    }
    return { pushed, created, skipped }
  }

  /** One-shot: pull every remote file and write to disk. */
  async pullAll(): Promise<{ pulled: number; written: number }> {
    const docs = await pullDocs(this.sb, this.cfg.projectId)
    let written = 0
    for (const doc of docs) {
      if (!isSyncable(doc.path)) continue
      const absPath = fromPosixRel(doc.path, this.rootPath)
      await mkdir(dirname(absPath), { recursive: true })
      // Only write if content differs (avoid mtime churn)
      let needWrite = true
      if (existsSync(absPath)) {
        const current = await readFile(absPath, 'utf-8')
        if (current === doc.content) needWrite = false
      }
      if (needWrite) {
        await writeFile(absPath, doc.content, 'utf-8')
        written++
      }
    }
    return { pulled: docs.length, written }
  }

  /** Start the file watcher; pushes on add/change, deletes on unlink. */
  async startWatch(opts: { onEvent?: (msg: string) => void } = {}): Promise<void> {
    if (this.watcher) throw new Error('Watcher already running')
    const log = opts.onEvent ?? (() => {})

    this.watcher = chokidar.watch(this.rootPath, {
      ignored: (path: string) => {
        const rel = toPosixRel(path, this.rootPath)
        // chokidar checks the root path itself with empty rel — don't ignore that
        if (rel === '' || rel === '.') return false
        return !isSyncable(rel) && !path.endsWith('.md')
      },
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100,
      },
      // Cross-platform: don't follow symlinks (Windows oddity)
      followSymlinks: false,
    })

    this.watcher.on('add', (path: string) => this.handleChange(path, 'add', log))
    this.watcher.on('change', (path: string) => this.handleChange(path, 'change', log))
    this.watcher.on('unlink', (path: string) => this.handleDelete(path, log))
    this.watcher.on('error', (err: unknown) => log(`[watcher error] ${(err as Error).message}`))

    log(`watching ${this.rootPath}`)
  }

  async stopWatch(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close()
      this.watcher = null
    }
  }

  private async handleChange(
    absPath: string,
    kind: 'add' | 'change',
    log: (msg: string) => void,
  ): Promise<void> {
    const relPath = toPosixRel(absPath, this.rootPath)
    if (!isSyncable(relPath)) return
    try {
      const content = await readFile(absPath, 'utf-8')
      const result = await pushDoc(this.sb, {
        projectId: this.cfg.projectId,
        memberId: this.cfg.memberId,
        path: relPath,
        content,
        size: Buffer.byteLength(content, 'utf-8'),
      })
      log(`[${kind}] ${relPath} → supabase (${result.created ? 'created' : 'updated'})`)
    } catch (err) {
      log(`[${kind} ERROR] ${relPath}: ${(err as Error).message}`)
    }
  }

  private async handleDelete(absPath: string, log: (msg: string) => void): Promise<void> {
    const relPath = toPosixRel(absPath, this.rootPath)
    if (!isSyncable(relPath)) return
    log(`[unlink] ${relPath} — deletion sync deferred to Phase B`)
    // Spike: don't propagate deletes. Too risky without confirmation flow.
  }
}

async function collectFiles(root: string): Promise<string[]> {
  const out: string[] = []
  async function walk(dir: string) {
    const entries = await import('node:fs/promises').then((fs) =>
      fs.readdir(dir, { withFileTypes: true }),
    )
    for (const e of entries) {
      const full = join(dir, e.name)
      if (e.isDirectory()) {
        if (e.name.startsWith('.') || e.name === 'node_modules') continue
        await walk(full)
      } else if (e.isFile() && e.name.endsWith('.md')) {
        out.push(full)
      }
    }
  }
  await walk(root)
  return out
}
