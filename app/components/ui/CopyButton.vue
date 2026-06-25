<script setup lang="ts">
const props = withDefaults(
  defineProps<{ value: string; label?: string }>(),
  { label: '' },
)

const copied = ref(false)
const displayLabel = computed(() => props.label || $t('ui.copy'))

async function copy() {
  try {
    await navigator.clipboard.writeText(props.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    /* clipboard unavailable */
  }
}
</script>

<template>
  <UiButton variant="ghost" @click="copy">
    <UiIcon :name="copied ? 'check' : 'clipboard'" class="h-3.5 w-3.5" />
    {{ copied ? $t('ui.copied') : displayLabel }}
  </UiButton>
</template>
