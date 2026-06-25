import type { H3Event } from 'h3'

/**
 * Resolve the Firecrawl API key for a request.
 * A user-supplied key (sent via the `x-firecrawl-api-key` header) always takes
 * precedence; otherwise we fall back to the server-configured key.
 */
export function resolveApiKey(event: H3Event): string | null {
  const headerKey = getHeader(event, 'x-firecrawl-api-key')?.trim()
  if (headerKey) return headerKey
  const configured = useRuntimeConfig(event).apiKey
  return configured || null
}

/** Heuristic: does this SDK error message indicate an auth/credential failure? */
export function isAuthError(message: string): boolean {
  return /\b401\b|unauthorized|invalid api key|invalid token/i.test(message)
}
