const STORAGE_KEY = 'firecrawl_api_key'

/**
 * Shared Firecrawl API key state.
 *
 * The key lives in memory (shared via `useState`) and is only written to
 * localStorage by `persist()` — which callers invoke after a request the key
 * has successfully authorized, so we never store an unverified key.
 */
export function useApiKey() {
  const apiKey = useState<string>('fc-api-key', () => '')
  const savedKey = useState<string>('fc-api-key-saved', () => '')
  const config = useRuntimeConfig()

  // Hydrate from localStorage once, on the client. This runs in `onMounted`
  // (not during setup) so the first client render matches the server-rendered
  // markup — otherwise the key-gated Run button is hydrated as `disabled` and
  // never gets patched back to enabled. Mutating state after mount triggers a
  // proper reactive update that re-enables it.
  if (import.meta.client && getCurrentInstance()) {
    onMounted(() => {
      if (savedKey.value !== '') return
      const stored = window.localStorage.getItem(STORAGE_KEY) ?? ''
      if (stored) {
        savedKey.value = stored
        if (!apiKey.value) apiKey.value = stored
      }
    })
  }

  const isSaved = computed(
    () => savedKey.value !== '' && savedKey.value === apiKey.value.trim(),
  )
  const hasApiKey = computed(
    () => Boolean(config.public.hasServerApiKey) || apiKey.value.trim() !== '',
  )

  /** Persist the current key to localStorage. Call only after a successful request. */
  function persist() {
    if (!import.meta.client) return
    const key = apiKey.value.trim()
    if (!key) return
    window.localStorage.setItem(STORAGE_KEY, key)
    savedKey.value = key
  }

  /** Clear the key from state and localStorage. */
  function forget() {
    apiKey.value = ''
    savedKey.value = ''
    if (import.meta.client) window.localStorage.removeItem(STORAGE_KEY)
  }

  /** Auth header for API requests; empty when no key is set (server falls back). */
  function authHeaders(): Record<string, string> {
    const key = apiKey.value.trim()
    return key ? { 'x-firecrawl-api-key': key } : {}
  }

  return { apiKey, isSaved, hasApiKey, persist, forget, authHeaders }
}
