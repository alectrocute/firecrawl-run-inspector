<script setup lang="ts">
import type { UserAction, ValidationError } from '~/types'

const props = defineProps<{
  isRunning: boolean
  hasApiKey: boolean
  validationErrors?: ValidationError[] | null
}>()

const emit = defineEmits<{
  run: [payload: { url: string; actions: UserAction[] }]
  cancel: []
}>()

const showCancel = ref(false)
let cancelTimer: ReturnType<typeof setTimeout> | undefined
watch(
  () => props.isRunning,
  (running) => {
    if (running) {
      showCancel.value = false
      cancelTimer = setTimeout(() => { showCancel.value = true }, 5000)
    } else {
      showCancel.value = false
      if (cancelTimer) clearTimeout(cancelTimer)
    }
  },
)
onBeforeUnmount(() => {
  if (cancelTimer) clearTimeout(cancelTimer)
})

const presets = usePresets()
const { url, actionsJson, jsonError, applyPreset, validate } = useActionForm()

const hasError = computed(
  () => jsonError.value !== null || (props.validationErrors?.length ?? 0) > 0,
)
const canSubmit = computed(() => !props.isRunning && !hasError.value && props.hasApiKey)

function submit() {
  if (props.isRunning || !props.hasApiKey) return
  const payload = validate()
  if (payload) emit('run', payload)
}

function onKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault()
    submit()
  }
}
</script>

<template>
  <div class="action-editor">
    <!-- URL input -->
    <div class="mb-5">
      <label for="url-input" class="mb-2 block font-mono text-xs text-ash-400">
        {{ $t('actionEditor.urlLabel') }}
      </label>
      <input
        id="url-input"
        v-model="url"
        type="text"
        inputmode="url"
        :placeholder="$t('actionEditor.urlPlaceholder')"
        class="w-full rounded-lg border border-ash-800 bg-ash-900/50 px-3 py-2.5 font-mono text-sm text-ash-100 placeholder:text-ash-600 transition-colors focus:border-flame-500/50 focus:outline-none focus:ring-2 focus:ring-flame-500/20"
        @keydown="onKeydown"
      />
    </div>

    <!-- Actions JSON editor -->
    <div class="mb-5">
      <div class="mb-2 flex items-center justify-between">
        <label for="actions-input" class="font-mono text-xs text-ash-400">{{ $t('actionEditor.actionsLabel') }}</label>
        <span class="text-xs text-ash-600">{{ $t('actionEditor.actionsHint') }}</span>
      </div>

      <div class="relative">
        <textarea
          id="actions-input"
          v-model="actionsJson"
          rows="14"
          :class="'max-sm:!h-[160px]'"
          :placeholder="$t('actionEditor.actionsPlaceholder')"
          spellcheck="false"
          class="w-full resize-y rounded-lg border border-ash-800 bg-code-surface px-4 py-3 font-mono text-sm text-ash-200 placeholder:text-ash-600 transition-colors focus:border-flame-500/50 focus:outline-none focus:ring-2 focus:ring-flame-500/20"
          style="line-height: 1.6; tab-size: 2"
          @keydown="onKeydown"
        />
        <div class="pointer-events-none absolute bottom-0 left-0 top-0 w-10 rounded-l-lg border-r border-ash-800/50 bg-ash-900/30" />
      </div>

      <!-- Client validation error -->
      <p v-if="jsonError" class="mt-2 flex items-center gap-1.5 text-sm text-red-400">
        <UiIcon name="x" class="h-3.5 w-3.5 shrink-0" />
        {{ jsonError }}
      </p>

      <!-- Server validation errors -->
      <div v-if="validationErrors?.length" class="mt-2 space-y-1">
        <p
          v-for="(err, i) in validationErrors"
          :key="i"
          class="flex items-center gap-1.5 text-sm text-red-400"
        >
          <UiIcon name="x" class="h-3.5 w-3.5 shrink-0" />
          <span class="font-mono text-xs text-red-500">{{ err.field }}</span>
          {{ err.message }}
        </p>
      </div>
    </div>

    <!-- Run / Cancel -->
    <div class="mb-8 flex items-center gap-3">
      <UiButton :disabled="!canSubmit" @click="submit">
        <UiSpinner v-if="isRunning" size="sm" />
        <UiIcon v-else name="play" class="h-3.5 w-3.5" />
        {{ isRunning ? $t('actionEditor.runningButton') : $t('actionEditor.runButton') }}
        <UiIcon v-if="canSubmit" name="arrowRight" class="h-3.5 w-3.5 text-flame-200" />
      </UiButton>
      <UiButton
        v-if="isRunning && showCancel"
        variant="ghost"
        @click="emit('cancel')"
      >
        <UiIcon name="x" class="h-3.5 w-3.5" />
        {{ $t('actionEditor.cancel') }}
      </UiButton>
      <span v-else-if="!hasApiKey" class="text-xs text-red-400">{{ $t('actionEditor.missingApiKey') }}</span>
      <span v-else-if="!hasError" class="text-xs text-ash-600">{{ $t('actionEditor.orShortcut') }}</span>
      <span v-else class="text-xs text-red-400">{{ $t('actionEditor.fixErrors') }}</span>
    </div>

    <!-- Presets -->
    <PresetPicker :presets @select="applyPreset" />
  </div>
</template>
