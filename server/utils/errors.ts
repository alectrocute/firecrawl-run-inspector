/**
 * Error diagnostics — classifies Firecrawl action errors and categorises
 * transport-level failures so the client can show the right messaging.
 */

import type { ErrorClassification, TransportDiagnosis } from '~/types'

// ── Action-level classification ────────────────────────────────────────

/**
 * Classify a Firecrawl error message into a semantic bucket.
 * Order matters — earlier matches take precedence.
 */
export function classifyActionError(message: string): ErrorClassification {
  const m = message.toLowerCase()

  if (m.includes('element not found') || m.includes('selector')) {
    return 'selector_not_found'
  }
  if (m.includes('navigation') && (m.includes('timeout') || m.includes('timed out'))) {
    return 'navigation_timeout'
  }
  if (m.includes('rate') && (m.includes('limit') || m.includes('429'))) {
    return 'rate_limited'
  }
  if (m.includes('timeout') || m.includes('timed out')) {
    return (m.includes('action') || m.includes('step') || m.includes('wait'))
      ? 'wait_timeout'
      : 'api_timeout'
  }
  if (m.includes('blocked') || m.includes('captcha') || m.includes('403')) {
    return 'blocked'
  }
  if (m.includes('empty') || m.includes('no content')) {
    return 'empty_result'
  }
  return 'unknown'
}

// ── Transport-level categorisation ─────────────────────────────────────

/**
 * Categorise a thrown error at the transport level.
 *
 *  network  — connection refused, DNS, fetch failed (never reached the API)
 *  api      — the Firecrawl API returned an error (4xx, 5xx, rate-limit)
 *  sdk      — unexpected / unrecognised error
 */
export function diagnoseTransport(err: unknown): TransportDiagnosis {
  const message = err instanceof Error ? err.message : String(err ?? 'Unknown error')
  const m = message.toLowerCase()

  // ── Network: couldn't reach the server ──────────────────────────────
  if (
    m.includes('fetch failed') ||
    m.includes('connection refused') ||
    m.includes('econnrefused') ||
    m.includes('enotfound') ||
    m.includes('dns') ||
    m.includes('network') ||
    m.includes('timeout') ||
    m.includes('etimedout') ||
    m.includes('abort')
  ) {
    // Timeout is ambiguous — if it mentions actions/steps it's an API timeout
    if (m.includes('action') || m.includes('step') || m.includes('selector') || m.includes('element')) {
      return { category: 'api', message, isRateLimited: false }
    }
    return { category: 'network', message, isRateLimited: false }
  }

  // ── API: rate limiting ──────────────────────────────────────────────
  if (m.includes('429') || m.includes('rate limit')) {
    return { category: 'api', message, isRateLimited: true }
  }

  // ── API: HTTP errors ────────────────────────────────────────────────
  if (
    m.includes('status') ||
    m.includes('http') ||
    (m.includes('5') && m.includes('error')) ||
    (m.includes('4') && m.includes('error'))
  ) {
    return {
      category: 'api',
      message,
      isRateLimited: m.includes('429') || m.includes('rate limit'),
    }
  }

  // ── SDK: everything else ────────────────────────────────────────────
  return { category: 'sdk', message, isRateLimited: false }
}
