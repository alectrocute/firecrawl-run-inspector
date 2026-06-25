<script setup lang="ts">
const props = defineProps<{
  selector: string
}>()

const copied = ref(false)

async function copy() {
  try {
    await navigator.clipboard.writeText(props.selector)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    /* clipboard unavailable */
  }
}
</script>

<template>
  <span
    class="inline-flex items-center gap-1 rounded border border-code-border bg-code-surface px-2 py-0.5 font-mono text-xs text-green-400"
  >
    {{ selector }}
    <button
      type="button"
      class="shrink-0 rounded p-0.5 text-ash-500 transition-colors hover:text-ash-200"
      :aria-label="$t('ui.copySelector', { selector })"
      @click="copy"
    >
      <UiIcon :name="copied ? 'check' : 'clipboard'" class="h-3 w-3" />
    </button>
  </span>
</template>
