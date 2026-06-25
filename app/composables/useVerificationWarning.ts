import type { VerificationStatus } from '~/types'

/**
 * Reads the server-side Firecrawl error-format verification result and exposes
 * the warning banner state for the app shell.
 */
export function useVerificationWarning() {
  const warning = ref<string | null>(null)
  const dismissed = ref(false)

  onMounted(async () => {
    try {
      const status = await $fetch<VerificationStatus>('/api/verify')
      if (!status.ok) warning.value = status.message
    } catch {
      // The verification endpoint is diagnostic only; don't block the app.
    }
  })

  function dismiss() {
    dismissed.value = true
  }

  return { warning, dismissed, dismiss }
}
