/**
 * Runs on server startup — verifies the Firecrawl API error format is still
 * parseable so failure attribution doesn't silently break.
 */

import { verifyErrorFormat } from '../utils/verification'

export default defineNitroPlugin(() => {
  // Fire-and-forget — don't block startup on this check.
  verifyErrorFormat().catch(() => {
    // Swallow — verification failures are surfaced via the /api/verify endpoint.
  })
})
