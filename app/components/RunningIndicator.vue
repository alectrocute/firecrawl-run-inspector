<script setup lang="ts">
// Estimated, time-based status updates while a run is in flight.
// The API gives no progress events, so these stages are heuristics keyed to
// elapsed time — enough to reassure the user that work is happening. Labels
// come from `runningIndicator.stages`; timings stay here as presentation.
const STAGE_TIMINGS = [0, 3, 8, 20, 35, 50]
const STAGES = STAGE_TIMINGS.map((at, i) => ({
  at,
  label: $tm('runningIndicator.stages')[i] ?? '',
}))

const ESTIMATED_TOTAL_S = 60

const elapsed = ref(0)
let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  timer = setInterval(() => { elapsed.value += 1 }, 1000)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

const stage = computed(() => {
  let current = STAGES[0]!
  for (const s of STAGES) {
    if (elapsed.value >= s.at) current = s
  }
  return current.label
})

const pct = computed(() =>
  Math.min(95, Math.round((elapsed.value / ESTIMATED_TOTAL_S) * 100)),
)
</script>

<template>
  <div class="m-auto w-full max-w-xs text-center">
    <UiSpinner class="mx-auto mb-4 text-flame-500" />
    <p class="text-sm font-medium text-flame-400">{{ $t('runningIndicator.heading') }}</p>
    <p class="mt-1.5 font-mono text-xs text-ash-400">{{ stage }}…</p>
    <p class="mt-1 font-mono text-[11px] text-ash-600">
      {{ $t('runningIndicator.elapsed', { elapsed, total: ESTIMATED_TOTAL_S }) }}
    </p>
    <div class="mx-auto mt-4 h-1 w-full max-w-[200px] overflow-hidden rounded-full bg-ash-800">
      <div
        class="h-full rounded-full bg-flame-500/70 transition-all duration-1000 ease-linear"
        :style="{ width: `${pct}%` }"
      />
    </div>
  </div>
</template>
