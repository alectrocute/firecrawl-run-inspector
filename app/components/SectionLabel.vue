<script setup lang="ts">
// Numbered section divider: ember dot + 2px ember rule + mono index/label,
// mirroring Firecrawl's "01 / MAIN FEATURES" header pattern.
defineProps<{
  index: string
  label: string
}>()
</script>

<template>
  <div class="flex items-center gap-2.5 pl-3 border-l-2 border-flame-500">
    <span class="h-1 w-1 shrink-0 rounded-full bg-flame-500" aria-hidden="true" />
    <span class="font-mono text-[11px] uppercase tracking-[0.14em] text-ash-500"
      ><span class="text-flame-500">{{ index }}</span> <span class="text-ash-700">/</span> {{ label }}</span
    >
  </div>
</template>
