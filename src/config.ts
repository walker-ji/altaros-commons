/**
 * Config loader. Resolution order:
 *   1. Environment variables (process.env)
 *   2. .env file in cwd (loaded by dotenv)
 *   3. ~/.altaros/commons-config.json (if it exists)
 *
 * Cross-platform path resolution: paths in config files use the OS-native
 * format, but stored Supabase paths are always forward-slash POSIX.
 */
import { config as dotenv } from 'dotenv'
import { readFileSync, existsSync } from 'node:fs'
import { join, isAbsolute } from 'node:path'
import { homedir } from 'node:os'

// Load .env if present (no-op if absent)
dotenv()

export type CommonsConfig = {
  supabaseUrl: string
  supabaseServiceKey: string
  projectId: string
  memberId: string
  authorSlug: string
  vaultRoot: string
  subfolder: string
}

export class ConfigError extends Error {
  constructor(msg: string) {
    super(msg)
    this.name = 'ConfigError'
  }
}

const CONFIG_FILE = join(homedir(), '.altaros', 'commons-config.json')

type FileConfig = Partial<{
  supabase_url: string
  supabase_service_key: string
  project_id: string
  member_id: string
  author_slug: string
  vault_root: string
  subfolder: string
}>

function readConfigFile(): FileConfig {
  if (!existsSync(CONFIG_FILE)) return {}
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8')) as FileConfig
  } catch (err) {
    throw new ConfigError(`Failed to parse ${CONFIG_FILE}: ${(err as Error).message}`)
  }
}

export function loadConfig(): CommonsConfig {
  const file = readConfigFile()
  const env = process.env

  const cfg: CommonsConfig = {
    supabaseUrl: env.SUPABASE_URL || file.supabase_url || '',
    supabaseServiceKey: env.SUPABASE_SERVICE_KEY || file.supabase_service_key || '',
    projectId: env.COMMONS_PROJECT_ID || file.project_id || '',
    memberId: env.COMMONS_MEMBER_ID || file.member_id || '',
    authorSlug: env.COMMONS_AUTHOR_SLUG || file.author_slug || '',
    vaultRoot: env.VAULT_ROOT || file.vault_root || '',
    subfolder: env.COMMONS_SUBFOLDER || file.subfolder || 'Zampa',
  }

  const missing: string[] = []
  if (!cfg.supabaseUrl) missing.push('SUPABASE_URL')
  if (!cfg.supabaseServiceKey) missing.push('SUPABASE_SERVICE_KEY')
  if (!cfg.projectId) missing.push('COMMONS_PROJECT_ID')
  if (!cfg.memberId) missing.push('COMMONS_MEMBER_ID')
  if (!cfg.authorSlug) missing.push('COMMONS_AUTHOR_SLUG')
  if (!cfg.vaultRoot) missing.push('VAULT_ROOT')

  if (missing.length > 0) {
    throw new ConfigError(
      `Missing required config: ${missing.join(', ')}\n` +
        `Set via environment variables, .env file, or ${CONFIG_FILE}\n` +
        `See .env.example for a template.`,
    )
  }

  if (!isAbsolute(cfg.vaultRoot)) {
    throw new ConfigError(`VAULT_ROOT must be an absolute path: got "${cfg.vaultRoot}"`)
  }
  if (!existsSync(cfg.vaultRoot)) {
    throw new ConfigError(`VAULT_ROOT does not exist: ${cfg.vaultRoot}`)
  }

  return cfg
}

/** Absolute path to the synced folder: <vault_root>/<subfolder> */
export function syncedFolderPath(cfg: CommonsConfig): string {
  return join(cfg.vaultRoot, cfg.subfolder)
}
