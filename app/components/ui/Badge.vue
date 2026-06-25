<script setup lang="ts">
import type { Tone } from '~/types'

withDefaults(
  defineProps<{
    tone?: Tone
    /** Square-ish monospace chip (e.g. action-type tags) instead of a pill. */
    mono?: boolean
    size?: 'xs' | 'sm' | 'md'
  }>(),
  { tone: 'neutral', mono: false, size: 'sm' },
)

const TONES: Record<Tone, string> = {
  neutral: 'border-ash-700 bg-ash-900/60 text-ash-400',
  ember: 'border-flame-500/30 bg-flame-500/10 text-flame-400',
  success: 'border-green-500/30 bg-green-500/10 text-green-400',
  danger: 'border-red-500/30 bg-red-500/10 text-red-400',
  warning: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
}

const SIZES: Record<'xs' | 'sm' | 'md', string> = {
  xs: 'px-1.5 py-0.5 text-[11px]',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
}
</script>

<template>
  <span
    class="inline-flex items-center border font-medium"
    :class="[TONES[tone], SIZES[size], mono ? 'rounded font-mono' : 'rounded-full']"
  >
    <slot />
  </span>
</template>
