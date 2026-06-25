import messages from '../../locales/en.json'

/** Walk a dot-separated path (e.g. `timeline.status.FAILED`) into the message tree. */
function resolve(path: string): unknown {
  return path.split('.').reduce<unknown>((node, key) => {
    if (node && typeof node === 'object') return (node as Record<string, unknown>)[key]
    return undefined
  }, messages)
}

/** Replace `{token}` placeholders with the matching param, leaving unknown tokens intact. */
function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  )
}

/**
 * Resolve a translation key to its string, interpolating any `{token}` params.
 * Shared by the Vue app and the Nitro server so `en.json` is the single source
 * of truth for all user-facing copy.
 */
export function translate(path: string, params?: Record<string, string | number>): string {
  const value = resolve(path)
  if (typeof value !== 'string') {
    if (import.meta.dev) console.warn(`[i18n] Missing translation for "${path}"`)
    return path
  }
  return interpolate(value, params)
}

/** Resolve a translation key to a string array (e.g. ordered progress stages). */
export function translateList(path: string): string[] {
  const value = resolve(path)
  if (!Array.isArray(value)) {
    if (import.meta.dev) console.warn(`[i18n] Missing translation list for "${path}"`)
    return []
  }
  return value as string[]
}
