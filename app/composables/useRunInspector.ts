import type {
  RunResponse,
  UserAction,
  ErrorCategory,
  ErrorView,
  RunStatusTone,
  ValidationError,
} from '~/types'

export function useRunInspector() {
  const { persist: persistApiKey, authHeaders } = useApiKey()

  // ── Core state ──────────────────────────────────────────────────────

  const isRunning = ref(false)
  const result = ref<RunResponse | null>(null)
  const error = ref<string | null>(null)
  const errorCategory = ref<ErrorCategory | null>(null)
  const validationErrors = ref<ValidationError[] | null>(null)

  // Cancellation
  const pendingActions = ref<UserAction[]>([])
  let abortController: AbortController | null = null

  // ── Derived ─────────────────────────────────────────────────────────

  const failingStep = computed(() => {
    if (!result.value?.failure) return undefined
    return result.value.steps.find(
      (s: { index: number }) => s.index === result.value!.failure!.failedAtStep
    )
  })

  const lastGoodScreenshotUrl = computed(() => {
    if (!result.value?.failure) return undefined
    const failedAt = result.value.failure.failedAtStep
    if (failedAt > 0) return result.value.steps[failedAt - 1]?.screenshotUrl
    return undefined
  })

  const isNetworkError = computed(() => errorCategory.value === 'network')
  const isApiError = computed(() => errorCategory.value === 'api')
  const isSdkError = computed(() => errorCategory.value === 'sdk')
  const isValidationError = computed(() => errorCategory.value === 'validation')

  const hasResult = computed(() => result.value !== null && !isRunning.value)
  const rawJson = computed(() => (result.value ? JSON.stringify(result.value, null, 2) : ''))

  /** High-level run state surfaced in the inspect header. */
  const statusTone = computed<RunStatusTone>(() => {
    if (isRunning.value) return 'running'
    if (error.value) return 'error'
    if (hasResult.value) return result.value!.failure ? 'failed' : 'passed'
    return 'idle'
  })

  /** One-liner detail shown next to the status pill. */
  const statusDetail = computed(() =>
    hasResult.value
      ? $t('runStatus.detail', {
          count: result.value!.steps.length,
          time: formatMs(result.value!.totalDurationMs),
        })
      : undefined,
  )

  /** Presentational error view keyed by transport-error category. */
  const errorView = computed<ErrorView | null>(() => {
    if (!error.value) return null
    if (isNetworkError.value) {
      return {
        tone: 'danger',
        title: $t('transportErrors.network.title'),
        body: 'text-red-300',
        hint: $t('transportErrors.network.hint'),
      }
    }
    if (isApiError.value) {
      return {
        tone: 'ember',
        title: $t('transportErrors.api.title'),
        body: 'text-flame-300',
        hint: $t('transportErrors.api.hint'),
      }
    }
    if (isSdkError.value) {
      return { tone: 'danger', title: $t('transportErrors.sdk.title'), body: 'text-red-300' }
    }
    return null
  })

  // ── Run action sequence ─────────────────────────────────────────────

  async function run(payload: { url: string; actions: UserAction[] }) {
    isRunning.value = true
    result.value = null
    error.value = null
    errorCategory.value = null
    validationErrors.value = null
    pendingActions.value = payload.actions

    abortController = new AbortController()

    try {
      result.value = await $fetch<RunResponse>('/api/run', {
        method: 'POST',
        body: payload,
        headers: authHeaders(),
        signal: abortController.signal,
        timeout: 120_000,
      })
      persistApiKey()
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        error.value = $t('transportErrors.cancelled')
        errorCategory.value = 'sdk'
      } else {
        categorizeError(err)
      }
    } finally {
      isRunning.value = false
      pendingActions.value = []
      abortController = null
    }
  }

  function cancel() {
    abortController?.abort()
  }

  function categorizeError(err: unknown) {
    if (err && typeof err === 'object' && 'data' in err) {
      const data = (err as { data?: { category?: string; fieldErrors?: ValidationError[] } }).data
      if (data?.category === 'validation' && data.fieldErrors) {
        errorCategory.value = 'validation'
        validationErrors.value = data.fieldErrors
        error.value = data.fieldErrors.map((e) => e.message).join('; ')
        return
      }
    }

    const msg = err instanceof Error ? err.message : 'An unexpected error occurred'
    const lower = msg.toLowerCase()

    if (/fetch|network|connection|dns|econnrefused|timeout/.test(lower)) {
      errorCategory.value = 'network'
    } else if (/status|[45]\d\d/.test(lower)) {
      errorCategory.value = 'api'
    } else {
      errorCategory.value = 'sdk'
    }

    error.value = msg
  }

  // ── Public API ──────────────────────────────────────────────────────

  // Exposed as read-only refs (consumers can read but not reassign) while
  // preserving the underlying mutable element types for component props.
  return {
    // state
    isRunning: computed(() => isRunning.value),
    result: computed(() => result.value),
    error: computed(() => error.value),
    errorCategory: computed(() => errorCategory.value),
    validationErrors: computed(() => validationErrors.value),

    // derived
    failingStep,
    lastGoodScreenshotUrl,
    hasResult,
    rawJson,
    statusTone,
    statusDetail,
    errorView,
    isNetworkError,
    isApiError,
    isSdkError,
    isValidationError,

    // actions
    run,
    cancel,
    pendingActions: computed(() => pendingActions.value),
  }
}
