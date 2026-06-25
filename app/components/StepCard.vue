<script setup lang="ts">
import type { StepStatus, TimelineStep } from '~/types'

const props = defineProps<{
  step: TimelineStep
  isFirst: boolean
  isLast: boolean
  /** Tailwind classes for the connector line below the rail dot. */
  connectorClass: string
  showMismatchWarning?: boolean
}>()

defineEmits<{ expand: [url: string] }>()

const DOT: Record<StepStatus, string> = {
  succeeded: 'bg-green-500 border-green-400/30',
  failed: 'bg-red-500 border-red-400/30',
  running: 'bg-flame-500 border-flame-400/30 animate-pulse',
  completed_empty: 'bg-yellow-500 border-yellow-400/30',
  pending: 'bg-ash-700 border-ash-600',
  skeleton: 'bg-ash-800 border-ash-700 animate-pulse',
}

const CARD: Record<StepStatus, string> = {
  succeeded: 'border-green-500/20 bg-green-500/[0.03]',
  failed: 'border-red-500/30 bg-red-500/5',
  running: 'border-flame-500/20 bg-flame-500/[0.03]',
  completed_empty: 'border-yellow-500/20 bg-yellow-500/[0.03]',
  pending: 'border-ash-800 bg-ash-900/20',
  skeleton: 'border-ash-800 bg-ash-900/10',
}

const STATUS_LABEL: Partial<Record<StepStatus, { key: string; class: string }>> = {
  failed: { key: 'timeline.status.FAILED', class: 'text-red-400' },
  running: { key: 'timeline.status.RUNNING', class: 'text-flame-400' },
  completed_empty: { key: 'timeline.status.EMPTY', class: 'text-yellow-400' },
  pending: { key: 'timeline.status.PENDING', class: 'text-ash-600' },
}

const statusLabel = computed(() => STATUS_LABEL[props.step.status])
</script>

<template>
  <div class="flex gap-3 sm:gap-4">
    <!-- Rail -->
    <div class="flex flex-col items-center">
      <div
        class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold"
        :class="DOT[step.status]"
      >
        <UiIcon v-if="step.status === 'succeeded'" name="check" class="h-3.5 w-3.5 text-white" />
        <UiIcon v-else-if="step.status === 'failed'" name="x" class="h-3.5 w-3.5 text-white" />
        <span v-else class="text-ash-300">{{ step.index + 1 }}</span>
      </div>
      <div v-if="!isLast" class="min-h-[28px] w-0.5 flex-1" :class="connectorClass" />
    </div>

    <!-- Card -->
    <div class="mb-5 flex-1 rounded-lg border p-3 transition-colors sm:p-4" :class="CARD[step.status]">
      <template v-if="step.status === 'skeleton'">
        <div class="flex items-center gap-3">
          <span class="h-4 w-16 animate-pulse rounded bg-ash-800" />
          <span class="h-4 w-12 animate-pulse rounded bg-ash-800" />
          <span class="h-4 flex-1 animate-pulse rounded bg-ash-800" />
        </div>
      </template>
      <template v-else>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-2">
            <span class="shrink-0 font-mono text-xs text-ash-500">{{ $t('timeline.stepLabel', { n: step.index + 1 }) }}</span>
            <UiBadge mono size="xs">{{ step.action.type }}</UiBadge>
            <span class="truncate text-sm text-ash-300">{{ actionLabel(step.action) }}</span>
          </div>
          <span v-if="step.status === 'succeeded'" class="font-mono text-xs text-green-400">
            {{ formatMs(step.durationMs) }}
          </span>
          <span v-else-if="statusLabel" class="text-xs font-semibold" :class="statusLabel.class">
            {{ $t(statusLabel.key) }}
          </span>
        </div>
      </template>

      <div
        v-if="showMismatchWarning"
        class="mt-2 rounded border border-yellow-500/20 bg-yellow-500/10 p-2 text-xs text-yellow-400"
      >
        {{ $t('timeline.mismatchWarning') }}
      </div>

      <div
        v-if="step.status === 'failed' && step.error"
        class="mt-3 break-words rounded border border-red-500/20 bg-red-500/10 p-2.5 font-mono text-sm text-red-300"
      >
        {{ step.error.message }}
      </div>

      <ScreenshotThumb
        v-if="step.screenshotUrl"
        class="mt-3"
        :src="step.screenshotUrl"
        :alt="$t('timeline.screenshot.altAfterStep', { n: step.index + 1 })"
        :label="step.status === 'failed' ? $t('timeline.screenshot.lastPageState') : $t('timeline.screenshot.afterStep')"
        @expand="$emit('expand', step.screenshotUrl!)"
      />
      <ScreenshotThumb
        v-else-if="isFirst && step.preStateScreenshotUrl"
        class="mt-3"
        :src="step.preStateScreenshotUrl"
        :alt="$t('timeline.screenshot.altInitialState')"
        :label="$t('timeline.screenshot.initialState')"
        @expand="$emit('expand', step.preStateScreenshotUrl!)"
      />
    </div>
  </div>
</template>
