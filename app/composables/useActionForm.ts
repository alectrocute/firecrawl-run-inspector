import type { Preset, RunPayload, UserAction } from '~/types'

const VALID_ACTION_TYPES = [
  'wait', 'click', 'screenshot', 'write', 'press', 'scroll', 'scrape', 'executeJavascript',
]

/** Owns the action-editor form state + client-side validation. */
export function useActionForm() {
  const url = ref('')
  const actionsJson = ref('')
  const jsonError = ref<string | null>(null)

  function applyPreset(preset: Preset) {
    url.value = preset.url
    actionsJson.value = JSON.stringify(preset.actions, null, 2)
    jsonError.value = null
  }

  /** Returns a validated payload, or null while setting `jsonError`. */
  function validate(): RunPayload | null {
    jsonError.value = null

    if (!url.value.trim()) {
      jsonError.value = $t('validation.urlEmpty')
      return null
    }

    try {
      new URL(url.value.trim())
    } catch {
      jsonError.value = $t('validation.urlInvalid')
      return null
    }

    try {
      const parsed = JSON.parse(actionsJson.value)

      if (!Array.isArray(parsed)) {
        jsonError.value = $t('validation.actionsNotArray')
        return null
      }
      if (parsed.length === 0) {
        jsonError.value = $t('validation.actionsEmpty')
        return null
      }

      for (let i = 0; i < parsed.length; i++) {
        const action = parsed[i]
        if (!action || typeof action !== 'object') {
          jsonError.value = $t('validation.actionNotObject', { n: i + 1 })
          return null
        }
        if (!action.type) {
          jsonError.value = $t('validation.actionMissingType', { n: i + 1 })
          return null
        }
        if (!VALID_ACTION_TYPES.includes(action.type)) {
          jsonError.value = $t('validation.actionInvalidType', {
            n: i + 1,
            type: action.type,
            types: VALID_ACTION_TYPES.join(', '),
          })
          return null
        }
      }

      return { url: url.value.trim(), actions: parsed as UserAction[] }
    } catch (e: unknown) {
      const msg = e instanceof SyntaxError ? e.message : $t('validation.invalidJson')
      const lineMatch = msg.match(/line\s+(\d+)/i) || msg.match(/position\s+(\d+)/i)
      jsonError.value = lineMatch
        ? $t('validation.invalidJsonDetail', { detail: lineMatch[0], msg })
        : `${$t('validation.invalidJson')}: ${msg}`
      return null
    }
  }

  return { url, actionsJson, jsonError, applyPreset, validate }
}
