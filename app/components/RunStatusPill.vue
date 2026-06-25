<script setup lang="ts">
import type { RunStatusTone } from '~/types'

defineProps<{
  tone: RunStatusTone
  /** Optional trailing detail, e.g. "3 steps · 1.8s". */
  detail?: string
}>()

const LABEL: Record<RunStatusTone, string> = {
  idle: $t('runStatus.idle'),
  running: $t('runStatus.running'),
  passed: $t('runStatus.passed'),
  failed: $t('runStatus.failed'),
  error: $t('runStatus.error'),
}

const RING: Record<RunStatusTone, string> = {
  idle: 'border-ash-800 text-ash-500',
  running: 'border-flame-500/40 text-flame-400',
  passed: 'border-green-500/30 text-green-400',
  failed: 'border-red-500/30 text-red-400',
  error: 'border-red-500/30 text-red-400',
}

const DOT: Record<RunStatusTone, string> = {
  idle: 'bg-ash-600',
  running: 'bg-flame-500 animate-pulse',
  passed: 'bg-green-500',
  failed: 'bg-red-500',
  error: 'bg-red-500',
}
</script>

<template>
  <span
    class="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 font-mono text-[11px]"
    :class="RING[tone]"
  >
    <span class="h-1.5 w-1.5 rounded-full" :class="DOT[tone]" />
    {{ LABEL[tone] }}
    <template v-if="detail">
      <span class="text-ash-700">·</span>
      <span class="text-ash-400">{{ detail }}</span>
    </template>
  </span>
</template>
