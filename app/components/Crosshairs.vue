<script setup lang="ts">
import type { Corner } from '~/types'

// Decorative "+" marks at panel corners — Firecrawl's blueprint signature.
// Requires a position:relative parent.
withDefaults(
  defineProps<{
    corners?: Corner[]
  }>(),
  { corners: () => ['tl', 'tr', 'bl', 'br'] },
)
</script>

<template>
  <span
    v-for="c in corners"
    :key="c"
    class="fc-cross"
    :class="`fc-cross--${c}`"
    aria-hidden="true"
  />
</template>
