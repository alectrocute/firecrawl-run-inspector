<script setup lang="ts">
import { ActionTimeline } from '#components'

const {
  isRunning,
  result,
  error,
  validationErrors,
  failingStep,
  lastGoodScreenshotUrl,
  hasResult,
  statusTone,
  statusDetail,
  errorView,
  pendingActions,
  run,
  cancel,
} = useRunInspector()

const { apiKey, isSaved: saved, forget } = useApiKey()

const timelineRef = ref<InstanceType<typeof ActionTimeline> | null>(null)

function openLightbox(url: string) {
  timelineRef.value?.openLightbox(url)
}

// The input subhead carries one accented term, marked with <action>…</action>
// in the locale string so the copy (and which word is highlighted) stays in en.json.
const subheadParts = computed(() => {
  const raw = $t('workbench.inputPane.subhead')
  const open = raw.indexOf('<action>')
  const close = raw.indexOf('</action>')
  if (open === -1 || close === -1) return { before: raw, accent: '', after: '' }
  return {
    before: raw.slice(0, open),
    accent: raw.slice(open + '<action>'.length, close),
    after: raw.slice(close + '</action>'.length),
  }
})

const rawJson = computed(() => (result.value ? JSON.stringify(result.value, null, 2) : ''))
const { warning: verifyWarning, dismissed: verifyDismissed, dismiss: dismissVerifyWarning } =
  useVerificationWarning()
</script>

<template>
  <div class="flex min-h-screen flex-col lg:h-screen lg:overflow-hidden">
    <TheTopBar />

    <!-- Verification warning — surfaced when Firecrawl error format changes -->
    <div
      v-if="verifyWarning && !verifyDismissed"
      class="mx-auto flex w-full max-w-[1320px] items-start gap-3 border-x border-b border-yellow-500/20 bg-yellow-500/10 px-6 py-3"
    >
      <UiIcon name="alert" class="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
      <p class="text-sm leading-relaxed text-yellow-300/80">{{ verifyWarning }}</p>
      <button
        class="ml-auto shrink-0 rounded p-1 text-yellow-500 transition-colors hover:text-yellow-300"
        @click="dismissVerifyWarning"
      >
        <UiIcon name="x" class="h-4 w-4" />
      </button>
    </div>

    <!-- Two-pane workbench -->
    <div
      class="relative mx-auto flex min-h-0 w-full max-w-[1320px] flex-1 flex-col border-x border-b border-ash-800 lg:flex-row"
    >
      <Crosshairs />

      <!-- LEFT · form -->
      <WorkbenchPane
        index="01"
        :label="$t('sectionLabels.input')"
        class="shrink-0 border-b border-ash-800 lg:w-[420px] lg:border-b-0 lg:border-r xl:w-[460px]"
      >
        <template #subhead>
          <p class="mt-2 text-xs leading-relaxed text-ash-500">
            {{ subheadParts.before }}<span class="text-flame-500">{{ subheadParts.accent }}</span>{{ subheadParts.after }}
          </p>
        </template>
        <ClientOnly>
          <ApiKeyField v-model="apiKey" :saved @forget="forget" />
        </ClientOnly>
        <ActionEditor :isRunning :validationErrors :pendingActions @run="run" @cancel="cancel" />
      </WorkbenchPane>

      <!-- RIGHT · inspect -->
      <WorkbenchPane index="02" :label="$t('sectionLabels.inspect')" :crosshairs="['tl', 'bl']" fill class="flex-1">
        <template #header-extra>
          <RunStatusPill :tone="statusTone" :detail="statusDetail" />
        </template>

        <!-- Transport error -->
        <UiAlert v-if="errorView" :tone="errorView.tone" :title="errorView.title">
          <p class="text-sm" :class="errorView.body">{{ error }}</p>
          <p v-if="errorView.hint" class="mt-2 text-xs text-ash-500">{{ errorView.hint }}</p>
        </UiAlert>

        <!-- Loading -->
        <template v-else-if="isRunning">
          <RunningIndicator />
          <ActionTimeline
            v-if="pendingActions.length > 0"
            class="mt-6"
            :steps="[]"
            :total-duration-ms="0"
            :skeleton-count="pendingActions.length"
          />
        </template>

        <!-- Results -->
        <template v-else-if="hasResult">
          <div class="space-y-8">
            <!-- Warnings -->
            <UiAlert v-if="result!.warnings?.length" tone="warning">
              <template #title>
                <h3 class="font-mono text-[11px] uppercase tracking-wider text-yellow-400">
                  {{ $t('warnings.heading', { count: result!.warnings!.length }) }}
                </h3>
              </template>
              <ul class="space-y-1.5">
                <li
                  v-for="(w, i) in result!.warnings"
                  :key="i"
                  class="flex items-start gap-1.5 text-sm text-yellow-300/80"
                >
                  <span class="mt-0.5 shrink-0 text-yellow-500">▸</span>
                  {{ w.message }}
                </li>
              </ul>
            </UiAlert>

            <!-- Timeline -->
            <div>
              <ResultHeading :text="$t('timeline.heading')" />
              <ActionTimeline
                ref="timelineRef"
                :steps="result!.steps"
                :failure="result!.failure"
                :total-duration-ms="result!.totalDurationMs"
                :warnings="result!.warnings"
                :retries="result!.retries"
                :extra-screenshot-url="lastGoodScreenshotUrl"
              />
            </div>

            <!-- Failure analysis -->
            <div v-if="result!.failure">
              <ResultHeading :text="$t('failureDetail.heading')" />
              <FailureDetail
                :failure="result!.failure"
                :failingStep
                :lastGoodScreenshotUrl
                :retries="result!.retries"
                @expand="openLightbox"
              />
            </div>

            <!-- Raw response -->
            <div class="flex justify-end">
              <UiCopyButton :value="rawJson" :label="$t('ui.copyRawResponse')" />
            </div>
          </div>
        </template>

        <!-- Idle / empty -->
        <EmptyState
          v-else
          :title="$t('workbench.inspectPane.emptyTitle')"
          :description="$t('workbench.inspectPane.emptyDescription')"
        />
      </WorkbenchPane>
    </div>
  </div>
</template>
