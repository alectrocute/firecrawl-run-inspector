<script setup lang="ts">
import type { Tone } from '~/types'

const props = withDefaults(
  defineProps<{
    tone?: Tone
    title?: string
    /** Show the leading status dot next to the title. */
    dot?: boolean
  }>(),
  { tone: 'neutral', title: undefined, dot: true },
)

const BOX: Record<Tone, string> = {
  neutral: 'border-ash-800 bg-ash-900/30',
  ember: 'border-flame-500/30 bg-flame-500/5',
  success: 'border-green-500/20 bg-green-500/5',
  danger: 'border-red-500/30 bg-red-500/5',
  warning: 'border-yellow-500/20 bg-yellow-500/5',
}

const DOT: Record<Tone, string> = {
  neutral: 'bg-ash-500',
  ember: 'bg-flame-500',
  success: 'bg-green-500',
  danger: 'bg-red-500',
  warning: 'bg-yellow-500',
}

const TITLE: Record<Tone, string> = {
  neutral: 'text-ash-300',
  ember: 'text-flame-400',
  success: 'text-green-400',
  danger: 'text-red-400',
  warning: 'text-yellow-400',
}

const hasHeader = computed(() => !!props.title || !!useSlots().title)
</script>

<template>
  <div class="rounded-lg border p-4" :class="BOX[tone]">
    <div v-if="hasHeader" class="flex items-center gap-2">
      <span v-if="dot" class="h-2 w-2 shrink-0 rounded-full" :class="DOT[tone]" />
      <slot name="title">
        <h3 class="text-sm font-medium" :class="TITLE[tone]">{{ title }}</h3>
      </slot>
    </div>
    <div :class="hasHeader ? 'mt-1.5' : ''">
      <slot />
    </div>
  </div>
</template>
