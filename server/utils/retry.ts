/**
 * Generic retry helper with exponential backoff.
 *
 * Only retries on rate-limit (429) errors — other failures throw immediately.
 */

import type { RetryAnnotation } from '~/types'
import { diagnoseTransport } from './errors'

const MAX_RETRIES = 3
const BASE_DELAY_MS = 1_000

export async function withRetry<T>(
  fn: () => Promise<T>,
  onRetry?: (attempt: number, delayMs: number, reason: string) => void,
): Promise<{ result: T; retries: RetryAnnotation[] }> {
  const retries: RetryAnnotation[] = []

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await fn()
      return { result, retries }
    } catch (err: unknown) {
      const { isRateLimited } = diagnoseTransport(err)

      if (!isRateLimited || attempt === MAX_RETRIES) throw err

      const delayMs = BASE_DELAY_MS * 2 ** (attempt - 1) // 1s, 2s, 4s
      const reason = err instanceof Error ? err.message : 'Rate limited'

      retries.push({ attempt, delayMs, reason })
      onRetry?.(attempt, delayMs, reason)

      await new Promise((r) => setTimeout(r, delayMs))
    }
  }

  // Unreachable — the loop always throws on the last attempt
  throw new Error('Unreachable')
}
