<script setup lang="ts">
withDefaults(
  defineProps<{
    tone?: 'neutral' | 'success' | 'danger'
    /** Wrap long lines instead of scrolling horizontally. */
    wrap?: boolean
  }>(),
  { tone: 'neutral', wrap: false },
)

const TONES = {
  neutral: 'text-ash-300',
  success: 'text-green-400',
  danger: 'text-red-400',
}
</script>

<template>
  <pre
    class="overflow-x-auto rounded-lg border border-code-border bg-code-surface p-3 text-xs font-mono leading-relaxed"
    :class="[TONES[tone], wrap ? 'whitespace-pre-wrap break-words' : '']"
  ><slot /></pre>
</template>
