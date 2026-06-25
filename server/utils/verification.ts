/**
 * Startup verification — sanity-checks that Firecrawl's error message format
 * is still parseable. If the format changes, failure attribution silently
 * breaks, so we verify on boot and surface the result.
 */

import type { VerificationStatus } from '~/types'
import { scrapeWithFirecrawl } from './firecrawl'
import { parseFailingActionIndex } from './instrument'

let status: VerificationStatus = {
  checked: false,
  ok: true,
  message: 'Verification has not run yet.',
}

/** Run once on startup. Sends a deliberately-broken action sequence and
 *  confirms the error message includes a parseable action index. */
export async function verifyErrorFormat(): Promise<void> {
  // Only run if a server-side API key is configured
  const apiKey = useRuntimeConfig().apiKey
  if (!apiKey) {
    status = { checked: true, ok: true, message: 'No API key configured — skipped verification.' }
    return
  }

  try {
    // Submit a sequence with a knowingly-broken selector
    await scrapeWithFirecrawl(apiKey, 'https://httpbin.org/forms/post', {
      formats: ['html'],
      actions: [
        { type: 'click', selector: '#definitely-does-not-exist-xyz-123' },
      ],
      timeout: 15_000,
    })

    // If we reach here, the API didn't throw — that's also a format change
    status = {
      checked: true,
      ok: false,
      message:
        'Firecrawl API did not return an error for a broken selector. ' +
        'Error format may have changed — failure attribution may be unreliable.',
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    const index = parseFailingActionIndex(message)

    if (index !== null) {
      status = {
        checked: true,
        ok: true,
        message: `Error format verified (parsed action index ${index}).`,
      }
    } else {
      status = {
        checked: true,
        ok: false,
        message:
          `Could not parse action index from error: "${message.slice(0, 200)}". ` +
          'Firecrawl error format may have changed — failure attribution may be unreliable.',
      }
    }
  }
}

/** Read the latest verification status. */
export function getVerificationStatus(): VerificationStatus {
  return { ...status }
}
