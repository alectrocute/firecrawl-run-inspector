/** Format a millisecond duration as a compact human string (e.g. 520ms, 1.8s). */
export function formatMs(ms?: number): string {
  if (!ms) return ''
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}

/** Truncate a string to `max` chars, appending an ellipsis when clipped. */
export function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value
}

/** Strip the protocol from a URL for compact display. */
export function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//, '')
}
