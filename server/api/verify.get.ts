/**
 * GET /api/verify — Returns the Firecrawl error-format verification status.
 * The client checks this on load to surface a banner when the API format changes.
 */

import { getVerificationStatus } from '../utils/verification'

export default defineEventHandler(() => {
  return getVerificationStatus()
})
