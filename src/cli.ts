#!/usr/bin/env node
/**
 * altaros-commons CLI — minimal v0.
 *
 * Commands:
 *   altaros-commons doctor         — verify config + connectivity
 *   altaros-commons push           — one-shot push all local files
 *   altaros-commons pull           — one-shot pull all remote files
 *   altaros-commons watch          — start file watcher, push on change
 *   altaros-commons spike          — round-trip self-test (push → pull → diff)
 */
import { Command } from 'commander'
import { loadConfig, ConfigError, syncedFolderPath } from './config.js'
import { DocumentSync } from './sync.js'
import { makeSupabase } from './supabase.js'

const program = new Command()
program
  .name('altaros-commons')
  .description('AltarOS Commons — vault folder sync via Supabase')
  .version('0.0.1')

program
  .command('doctor')
  .description('Verify config, vault path, and Supabase connectivity')
  .action(async () => {
    try {
      const cfg = loadConfig()
      console.log('✓ Config loaded')
      console.log(`  vault: ${cfg.vaultRoot}`)
      console.log(`  synced folder: ${syncedFolderPath(cfg)}`)
      console.log(`  project_id: ${cfg.projectId}`)
      console.log(`  author: ${cfg.authorSlug} (member ${cfg.memberId.slice(0, 8)}...)`)
      console.log(`  supabase: ${cfg.supabaseUrl}`)

      const sb = makeSupabase(cfg)
      const { data, error } = await sb
        .from('projects')
        .select('id, name, slug')
        .eq('id', cfg.projectId)
        .maybeSingle()
      if (error) {
        console.error(`✗ Supabase query failed: ${error.message}`)
        process.exit(1)
      }
      if (!data) {
        console.error(`✗ Project ${cfg.projectId} not found`)
        process.exit(1)
      }
      console.log(`✓ Project found: ${data.name} (slug: ${data.slug})`)

      const { count, error: cErr } = await sb
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', cfg.projectId)
        .eq('file_type', 'text/markdown')
      if (cErr) {
        console.warn(`⚠ documents count failed (table may not exist): ${cErr.message}`)
      } else {
        console.log(`✓ ${count ?? 0} markdown docs already synced for this project`)
      }
    } catch (err) {
      handleError(err)
    }
  })

program
  .command('push')
  .description('Push all local .md files in synced folder to Supabase')
  .action(async () => {
    try {
      const cfg = loadConfig()
      const sync = new DocumentSync(cfg)
      console.log(`Pushing from ${syncedFolderPath(cfg)}...`)
      const result = await sync.pushAll()
      console.log(
        `✓ Pushed ${result.pushed} (${result.created} new, ${result.pushed - result.created} updated), skipped ${result.skipped}`,
      )
    } catch (err) {
      handleError(err)
    }
  })

program
  .command('pull')
  .description('Pull all remote .md files into synced folder')
  .action(async () => {
    try {
      const cfg = loadConfig()
      const sync = new DocumentSync(cfg)
      console.log(`Pulling to ${syncedFolderPath(cfg)}...`)
      const result = await sync.pullAll()
      console.log(`✓ Pulled ${result.pulled}, wrote ${result.written} (${result.pulled - result.written} unchanged)`)
    } catch (err) {
      handleError(err)
    }
  })

program
  .command('watch')
  .description('Watch synced folder; push on add/change')
  .action(async () => {
    try {
      const cfg = loadConfig()
      const sync = new DocumentSync(cfg)
      await sync.startWatch({ onEvent: (msg) => console.log(msg) })
      console.log('Watching for changes. Ctrl+C to stop.')
      // Keep alive
      process.on('SIGINT', async () => {
        console.log('\nStopping watcher...')
        await sync.stopWatch()
        process.exit(0)
      })
    } catch (err) {
      handleError(err)
    }
  })

program
  .command('spike')
  .description('Round-trip self-test: write probe → push → pull → diff → cleanup')
  .action(async () => {
    const { runSpike } = await import('./spike.js')
    await runSpike()
  })

program.parse()

function handleError(err: unknown): never {
  if (err instanceof ConfigError) {
    console.error(`Config error:\n${err.message}`)
  } else {
    console.error(`Error: ${(err as Error).message}`)
    if (process.env.DEBUG) console.error((err as Error).stack)
  }
  process.exit(1)
}
