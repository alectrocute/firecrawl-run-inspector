<script setup lang="ts">
// Small subsection heading used inside the inspect pane (Timeline, Failure Analysis).
defineProps<{ text: string }>()
</script>

<template>
  <h3 class="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ash-500">
    <span class="h-1 w-1 rounded-full bg-flame-500" />
    {{ text }}
  </h3>
</template>
