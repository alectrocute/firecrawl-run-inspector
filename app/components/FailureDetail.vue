<script setup lang="ts">
import type {
  RunResponse,
  TimelineStep,
  RetryAnnotation,
  Tone,
} from '~/types'

defineProps<{
  failure: RunResponse['failure']
  failingStep?: TimelineStep
  lastGoodScreenshotUrl?: string
  retries?: RetryAnnotation[]
}>()

defineEmits<{ expand: [url: string] }>()

const classificationTone: Record<string, Tone> = {
  selector_not_found: 'ember',
  wait_timeout: 'warning',
  navigation_timeout: 'warning',
  api_timeout: 'warning',
  rate_limited: 'ember',
  blocked: 'danger',
  empty_result: 'neutral',
  unknown: 'neutral',
}

const categoryTone: Record<string, Tone> = {
  network: 'danger',
  api: 'ember',
  sdk: 'danger',
  validation: 'warning',
}

</script>

<template>
  <div v-if="failure" class="failure-detail">
    <!-- Classification badges -->
    <div class="mb-5 flex flex-wrap items-center gap-2">
      <UiCaption class="mb-1 w-full">{{ $t('failureDetail.errorClassification') }}</UiCaption>
      <UiBadge v-if="failure.category" :tone="categoryTone[failure.category] ?? 'neutral'" size="md">
        {{ $t(`failureDetail.category.${failure.category}`) }}
      </UiBadge>
      <UiIcon v-if="failure.category" name="arrowRight" class="h-3.5 w-3.5 text-ash-600" />
      <UiBadge :tone="classificationTone[failure.classification] ?? 'neutral'" size="md">
        {{ $t(`failureDetail.classification.${failure.classification}`) }}
      </UiBadge>
    </div>

    <!-- Advice -->
    <UiAlert tone="ember" :dot="false" class="mb-5">
      <p class="text-sm leading-relaxed text-flame-300/80">
        {{ $t(`failureDetail.advice.${failure.classification}`) }}
      </p>
    </UiAlert>

    <!-- Rate limit retries -->
    <UiAlert
      v-if="failure.classification === 'rate_limited' && retries?.length"
      tone="ember"
      :dot="false"
      class="mb-5"
    >
      <UiCaption class="mb-2">{{ $t('failureDetail.retryAttempts') }}</UiCaption>
      <div class="space-y-1">
        <div
          v-for="(r, i) in retries"
          :key="i"
          class="flex items-center gap-2 font-mono text-xs"
        >
          <span class="text-flame-400">{{ $t('failureDetail.attempt', { n: r.attempt }) }}</span>
          <span class="text-ash-600">—</span>
          <span class="text-ash-400">{{ $t('timeline.retryWaited', { time: formatMs(r.delayMs) }) }}</span>
        </div>
      </div>
    </UiAlert>

    <!-- Last good screenshot -->
    <div v-if="lastGoodScreenshotUrl" class="mb-5">
      <ScreenshotThumb
        :src="lastGoodScreenshotUrl"
        :alt="$t('failureDetail.lastGoodScreenshot.alt')"
        :label="$t('failureDetail.lastGoodScreenshot.label')"
        @expand="$emit('expand', lastGoodScreenshotUrl!)"
      />
      <p class="mt-1.5 text-xs text-ash-600">
        {{ $t('failureDetail.lastGoodScreenshot.caption') }}
      </p>
    </div>

    <!-- Failing action JSON -->
    <div v-if="failingStep" class="mb-5">
      <div class="mb-2 flex items-center justify-between">
        <UiCaption>{{ $t('failureDetail.failingAction') }}</UiCaption>
        <UiCopyButton :value="JSON.stringify(failingStep.action, null, 2)" :label="$t('failureDetail.copyJson')" />
      </div>
      <UiCodeBlock tone="success">{{ JSON.stringify(failingStep.action, null, 2) }}</UiCodeBlock>
    </div>

    <!-- Raw error -->
    <div>
      <UiCaption class="mb-2">{{ $t('failureDetail.rawError') }}</UiCaption>
      <UiCodeBlock tone="danger" wrap>{{ failure.message }}</UiCodeBlock>
    </div>
  </div>
</template>
