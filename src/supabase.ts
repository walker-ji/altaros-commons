/**
 * Supabase client — service-role for spike. Will tighten to JWT in Phase B.
 *
 * Vault document model (reused via existing `documents` table):
 *   - filename = relative path within synced folder (e.g., "vision/origin.md")
 *   - file_type = "text/markdown"
 *   - extracted_text = full file content
 *   - storage_path = "" (we don't use Supabase Storage for vault docs)
 *   - file_size = byte length of content
 *
 * Phase B will introduce a dedicated vault_documents table with
 * (project_id, path, content, modified_at, modified_by, content_hash).
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { CommonsConfig } from './config.js'

export type VaultDoc = {
  id?: string
  projectId: string
  memberId: string
  path: string
  content: string
  size: number
  updatedAt?: string
}

export function makeSupabase(cfg: CommonsConfig): SupabaseClient {
  return createClient(cfg.supabaseUrl, cfg.supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * Upsert a vault document by (project_id, filename).
 * Returns the row's id.
 */
export async function pushDoc(
  sb: SupabaseClient,
  doc: VaultDoc,
): Promise<{ id: string; created: boolean }> {
  // Check if a row already exists for this (project, path)
  const { data: existing, error: findErr } = await sb
    .from('documents')
    .select('id')
    .eq('project_id', doc.projectId)
    .eq('filename', doc.path)
    .eq('file_type', 'text/markdown')
    .limit(1)
    .maybeSingle()

  if (findErr) throw new SupabaseError(`pushDoc lookup failed: ${findErr.message}`)

  if (existing) {
    const { error: upErr } = await sb
      .from('documents')
      .update({
        extracted_text: doc.content,
        file_size: doc.size,
        member_id: doc.memberId,
      })
      .eq('id', existing.id)
    if (upErr) throw new SupabaseError(`pushDoc update failed: ${upErr.message}`)
    return { id: existing.id, created: false }
  }

  const { data: inserted, error: insErr } = await sb
    .from('documents')
    .insert({
      project_id: doc.projectId,
      member_id: doc.memberId,
      filename: doc.path,
      file_type: 'text/markdown',
      file_size: doc.size,
      storage_path: '',
      extracted_text: doc.content,
    })
    .select('id')
    .single()

  if (insErr || !inserted) throw new SupabaseError(`pushDoc insert failed: ${insErr?.message}`)
  return { id: inserted.id, created: true }
}

/**
 * Pull all vault documents for a project. Filters to text/markdown only.
 */
export async function pullDocs(sb: SupabaseClient, projectId: string): Promise<VaultDoc[]> {
  // Note: documents table doesn't have updated_at as of migration 015.
  // Phase B will add it via a trigger or migration.
  const { data, error } = await sb
    .from('documents')
    .select('id, project_id, member_id, filename, file_size, extracted_text, created_at')
    .eq('project_id', projectId)
    .eq('file_type', 'text/markdown')

  if (error) throw new SupabaseError(`pullDocs failed: ${error.message}`)
  if (!data) return []

  return data.map((r) => ({
    id: r.id,
    projectId: r.project_id,
    memberId: r.member_id,
    path: r.filename,
    content: r.extracted_text ?? '',
    size: r.file_size ?? 0,
    updatedAt: r.created_at,
  }))
}

/**
 * Delete a vault document by (project_id, path).
 */
export async function deleteDoc(
  sb: SupabaseClient,
  projectId: string,
  path: string,
): Promise<void> {
  const { error } = await sb
    .from('documents')
    .delete()
    .eq('project_id', projectId)
    .eq('filename', path)
    .eq('file_type', 'text/markdown')
  if (error) throw new SupabaseError(`deleteDoc failed: ${error.message}`)
}

export class SupabaseError extends Error {
  constructor(msg: string) {
    super(msg)
    this.name = 'SupabaseError'
  }
}
