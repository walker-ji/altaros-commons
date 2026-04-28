#!/usr/bin/env node
// CLI entry shim. Always loads compiled output from dist/.
// During dev (no build), use `npm run dev -- <command>` instead.
import('../dist/cli.js').catch((err) => {
  console.error('altaros-commons: failed to load CLI.')
  console.error('If running from source without a build, use:  npm run dev -- <command>')
  console.error(err.message)
  process.exit(1)
})
