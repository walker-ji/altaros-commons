/**
 * Public API for @altaros/commons
 *
 * Reserved for use as a library by Phase B's MCP server and daemon.
 * Spike consumers use the CLI; this entry exists for npm publish completeness.
 */
export { loadConfig, syncedFolderPath, ConfigError } from './config.js'
export type { CommonsConfig } from './config.js'
export { DocumentSync, toPosixRel, fromPosixRel, isSyncable } from './sync.js'
export { makeSupabase, pushDoc, pullDocs, deleteDoc, SupabaseError } from './supabase.js'
export type { VaultDoc } from './supabase.js'
