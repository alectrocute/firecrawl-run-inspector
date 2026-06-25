<script setup lang="ts">
import type { Corner } from '~/types'

withDefaults(
  defineProps<{
    index: string
    label: string
    /** Crosshair corners to decorate (blueprint motif). */
    crosshairs?: Corner[]
    /** Make the body a full-height flex column so children can center with m-auto. */
    fill?: boolean
  }>(),
  { crosshairs: undefined, fill: false },
)
</script>

<template>
  <section class="relative flex min-h-0 flex-col">
    <Crosshairs v-if="crosshairs" :corners="crosshairs" />

    <div class="shrink-0 border-b border-ash-800 px-4 py-3 sm:px-6 sm:py-4">
      <div class="flex items-center justify-between gap-3">
        <SectionLabel :index :label />
        <slot name="header-extra" />
      </div>
      <slot name="subhead" />
    </div>

    <div class="fc-scroll min-h-0 flex-1 overflow-y-auto">
      <div class="px-4 py-4 sm:px-6 sm:py-6" :class="fill ? 'flex min-h-full flex-col' : ''">
        <slot />
      </div>
    </div>
  </section>
</template>
