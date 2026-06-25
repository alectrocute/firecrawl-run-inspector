<script setup lang="ts">
defineProps<{
  modelValue: string
  /** Whether the current key is persisted in localStorage. */
  saved?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  forget: []
}>()

const revealed = ref(false)
</script>

<template>
  <div class="mb-5">
    <div class="mb-2 flex items-center justify-between">
      <label for="api-key-input" class="font-mono text-xs text-ash-400">
        {{ $t('apiKey.label') }}
      </label>
      <span
        v-if="saved"
        class="inline-flex items-center gap-1 font-mono text-[11px] text-green-400"
      >
        <UiIcon name="check" class="h-3 w-3" />
        {{ $t('apiKey.savedBadge') }}
      </span>
    </div>

    <div class="relative">
      <input
        id="api-key-input"
        :type="revealed ? 'text' : 'password'"
        :value="modelValue"
        :placeholder="$t('apiKey.placeholder')"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        class="w-full rounded-lg border border-ash-800 bg-ash-900/50 px-3 py-2.5 pr-16 font-mono text-sm text-ash-100 placeholder:text-ash-600 transition-colors focus:border-flame-500/50 focus:outline-none focus:ring-2 focus:ring-flame-500/20"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <button
        type="button"
        class="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 font-mono text-[11px] text-ash-500 transition-colors hover:text-ash-300"
        :aria-pressed="revealed"
        @click="revealed = !revealed"
      >
        {{ revealed ? $t('apiKey.hide') : $t('apiKey.show') }}
      </button>
    </div>

    <div class="mt-1.5 flex items-center justify-between gap-3">
      <button
        v-if="saved"
        type="button"
        class="shrink-0 text-xs text-ash-500 transition-colors hover:text-flame-400"
        @click="emit('forget')"
      >
        {{ $t('apiKey.forget') }}
      </button>
    </div>
  </div>
</template>
