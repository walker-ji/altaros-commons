/**
 * spike.ts — round-trip self-test.
 *
 * 1. Create a probe file at <vault>/<subfolder>/_spike/test-{timestamp}.md
 * 2. Push it to Supabase
 * 3. Read the row back from Supabase
 * 4. Verify content matches
 * 5. Pull all docs (validates pull path works)
 * 6. Delete the probe row from Supabase + local file
 *
 * Validates: config loading, file watcher path handling, Supabase connectivity,
 * push/pull round-trip, content fidelity.
 */
import { writeFile, mkdir, unlink, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { loadConfig, syncedFolderPath } from './config.js'
import { makeSupabase, pushDoc, pullDocs, deleteDoc } from './supabase.js'

const PROBE_BODY = `---
type: spike_probe
created: ${new Date().toISOString()}
---

# Spike Probe

This file was created by \`altaros-commons spike\` to validate the sync round-trip.
If you see this file in your vault, the spike test wrote it but failed to clean up.
Safe to delete.
`

export async function runSpike(): Promise<void> {
  console.log('🧪 altaros-commons spike — round-trip self-test\n')

  let probeRelPath = ''
  let probeAbsPath = ''
  let probeId = ''
  const cfg = loadConfig()
  const sb = makeSupabase(cfg)

  try {
    // Step 1: Probe file
    const stamp = Date.now()
    probeRelPath = `_spike/test-${stamp}.md`
    probeAbsPath = join(syncedFolderPath(cfg), probeRelPath)
    await mkdir(dirname(probeAbsPath), { recursive: true })
    await writeFile(probeAbsPath, PROBE_BODY, 'utf-8')
    console.log(`✓ Step 1 — wrote probe file: ${probeRelPath}`)

    // Step 2: Push
    const pushResult = await pushDoc(sb, {
      projectId: cfg.projectId,
      memberId: cfg.memberId,
      path: probeRelPath,
      content: PROBE_BODY,
      size: Buffer.byteLength(PROBE_BODY, 'utf-8'),
    })
    probeId = pushResult.id
    console.log(`✓ Step 2 — pushed to supabase (id: ${probeId.slice(0, 8)}..., ${pushResult.created ? 'created' : 'updated'})`)

    // Step 3: Read back
    const { data, error } = await sb
      .from('documents')
      .select('extracted_text, file_size, filename')
      .eq('id', probeId)
      .single()
    if (error || !data) throw new Error(`Read-back failed: ${error?.message}`)
    console.log(`✓ Step 3 — read back from supabase (${data.file_size} bytes)`)

    // Step 4: Verify content fidelity
    if (data.extracted_text !== PROBE_BODY) {
      throw new Error(
        `Content mismatch! Length: ${data.extracted_text?.length} vs ${PROBE_BODY.length}`,
      )
    }
    if (data.filename !== probeRelPath) {
      throw new Error(`Path mismatch: ${data.filename} vs ${probeRelPath}`)
    }
    console.log('✓ Step 4 — content fidelity verified (byte-exact)')

    // Step 5: Pull all (validates list path)
    const allDocs = await pullDocs(sb, cfg.projectId)
    const found = allDocs.find((d) => d.id === probeId)
    if (!found) throw new Error('Probe not in pullDocs result')
    console.log(`✓ Step 5 — pullDocs returned ${allDocs.length} docs (probe found)`)

    console.log('\n✅ Spike PASSED — round-trip works on this machine')
  } catch (err) {
    console.error(`\n❌ Spike FAILED: ${(err as Error).message}`)
    if (process.env.DEBUG) console.error((err as Error).stack)
    process.exitCode = 1
  } finally {
    // Cleanup
    console.log('\nCleanup:')
    if (probeId) {
      try {
        await deleteDoc(sb, cfg.projectId, probeRelPath)
        console.log(`  ✓ deleted supabase row ${probeId.slice(0, 8)}...`)
      } catch (err) {
        console.warn(`  ⚠ failed to delete supabase row: ${(err as Error).message}`)
      }
    }
    if (probeAbsPath && existsSync(probeAbsPath)) {
      try {
        await unlink(probeAbsPath)
        console.log(`  ✓ deleted local file ${probeRelPath}`)
        // Try to remove the _spike folder if empty
        const { rmdir } = await import('node:fs/promises')
        try {
          await rmdir(dirname(probeAbsPath))
          console.log(`  ✓ removed empty _spike/ folder`)
        } catch {
          // _spike not empty or doesn't exist; ignore
        }
      } catch (err) {
        console.warn(`  ⚠ failed to delete local file: ${(err as Error).message}`)
      }
    }
  }
}
