<script setup lang="ts">
import type { RunResponse, TimelineStep, RunWarning, RetryAnnotation } from '~/types'

const props = defineProps<{
  steps: TimelineStep[]
  failure?: RunResponse['failure']
  totalDurationMs: number
  warnings?: RunWarning[]
  retries?: RetryAnnotation[]
  /** When set, renders N skeleton placeholder cards (overrides steps). */
  skeletonCount?: number
  /** Extra screenshot URL (e.g. last-good from prefix re-run) included in lightbox. */
  extraScreenshotUrl?: string
}>()

const skeletonSteps = computed<TimelineStep[]>(() =>
  Array.from({ length: props.skeletonCount ?? 0 }, (_, i) => ({
    index: i,
    action: { type: 'wait' as const },
    status: 'skeleton' as const,
  })),
)

const lightboxIndex = ref<number>(-1)

/** Every screenshot URL across all steps, in timeline order. */
const screenshotUrls = computed(() => {
  const urls: string[] = []
  for (const step of props.steps) {
    // pre-state screenshot only on the first step
    if (step === props.steps[0] && step.preStateScreenshotUrl) {
      urls.push(step.preStateScreenshotUrl)
    }
    if (step.screenshotUrl) {
      urls.push(step.screenshotUrl)
    }
  }
  if (props.extraScreenshotUrl) {
    urls.push(props.extraScreenshotUrl)
  }
  return urls
})

function openLightbox(url: string) {
  lightboxIndex.value = screenshotUrls.value.indexOf(url)
}
function closeLightbox() {
  lightboxIndex.value = -1
}

defineExpose({ openLightbox })

const allSucceeded = computed(
  () => props.steps.length > 0 && props.steps.every((s) => s.status === 'succeeded'),
)
const hasEmpty = computed(() => props.steps.some((s) => s.status === 'completed_empty'))
const hasMismatch = computed(
  () => props.warnings?.some((w) => w.type === 'screenshot_count_mismatch') ?? false,
)
const retryTitle = computed(() => {
  const n = props.retries?.length ?? 0
  return $t('warnings.rateLimited', { count: n, retries: n === 1 ? 'retry' : 'retries' })
})

/** Colour of the connector line between step `index` and `index + 1`. */
function connectorClass(index: number): string {
  const steps = props.steps
  if (index >= steps.length - 1) return ''
  const current = steps[index]!.status
  const next = steps[index + 1]!.status
  if (current === 'failed' || next === 'pending') return 'bg-ash-800'
  if (current === 'succeeded' && next === 'succeeded') return 'bg-green-500/40'
  if (current === 'succeeded' && next === 'running') return 'bg-flame-500/40'
  if (current === 'completed_empty' || next === 'completed_empty') return 'bg-yellow-500/40'
  return 'bg-ash-800'
}
</script>

<template>
  <div class="action-timeline">
    <!-- Failure banner -->
    <UiAlert
      v-if="failure"
      tone="danger"
      :title="$t('timeline.failedBanner', { failed: failure.failedAtStep + 1, total: failure.totalSteps })"
      class="mb-8"
    >
      <p class="font-mono text-sm text-red-300">{{ failure.message }}</p>
      <p v-if="failure.classification === 'api_timeout'" class="mt-2 text-xs text-ash-500">
        {{ $t('timeline.apiTimeoutDetail') }}
      </p>
      <p v-else-if="failure.classification === 'wait_timeout'" class="mt-2 text-xs text-ash-500">
        {{ $t('timeline.waitTimeoutDetail') }}
      </p>
    </UiAlert>

    <!-- Empty result banner -->
    <UiAlert
      v-if="!failure && hasEmpty"
      tone="warning"
      :title="$t('timeline.emptyBanner')"
      class="mb-8"
    >
      <p class="text-sm text-yellow-300/70">
        {{ $t('timeline.emptyBannerDetail') }}
      </p>
      <p class="mt-1 font-mono text-xs text-ash-500">{{ $t('timeline.totalTime', { time: formatMs(totalDurationMs) }) }}</p>
    </UiAlert>

    <!-- Success banner -->
    <UiAlert
      v-if="!failure && allSucceeded"
      tone="success"
      :title="$t('timeline.successBanner', { count: steps.length })"
      class="mb-8"
    >
      <p class="font-mono text-sm text-green-300/70">{{ $t('timeline.totalTime', { time: formatMs(totalDurationMs) }) }}</p>
    </UiAlert>

    <!-- Retry annotations -->
    <UiAlert v-if="retries?.length" tone="ember" :title="retryTitle" class="mb-6">
      <div class="space-y-1">
        <div
          v-for="(r, i) in retries"
          :key="i"
          class="flex items-center gap-2 text-xs text-ash-400"
        >
          <span class="font-mono text-flame-500">{{ $t('failureDetail.attempt', { n: r.attempt }) }}</span>
          <span class="text-ash-600">•</span>
          <span>{{ $t('timeline.retryWaited', { time: formatMs(r.delayMs) }) }}</span>
          <span class="text-ash-600">•</span>
          <span class="truncate font-mono text-ash-500">{{ r.reason }}</span>
        </div>
      </div>
    </UiAlert>

    <!-- Timeline -->
    <div
      v-if="skeletonCount && skeletonCount > 0"
      class="pointer-events-none relative"
    >
      <p class="mb-4 font-mono text-xs text-ash-500">
        {{ $t('timeline.stepQueued', { count: skeletonCount, plural: skeletonCount === 1 ? '' : 's' }) }}
      </p>
      <StepCard
        v-for="(step, i) in skeletonSteps"
        :key="i"
        :step
        :is-first="i === 0"
        :is-last="i === skeletonSteps.length - 1"
        connector-class="bg-ash-800"
      />
    </div>
    <div v-else-if="steps.length === 0" class="py-16 text-center">
      <p class="text-base text-ash-500">{{ $t('timeline.noSteps') }}</p>
      <p class="mt-1 text-sm text-ash-600">{{ $t('timeline.noStepsDetail') }}</p>
    </div>
    <div v-else class="relative">
      <StepCard
        v-for="(step, i) in steps"
        :key="i"
        :step
        :is-first="i === 0"
        :is-last="i === steps.length - 1"
        :connector-class="connectorClass(i)"
        :show-mismatch-warning="hasMismatch"
        @expand="openLightbox"
      />
    </div>

    <Lightbox
      v-model="lightboxIndex"
      :images="screenshotUrls"
      @close="closeLightbox"
    />
  </div>
</template>
