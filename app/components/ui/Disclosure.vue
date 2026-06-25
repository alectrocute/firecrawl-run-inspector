<script setup lang="ts">
defineProps<{ summary: string }>()
</script>

<template>
  <details class="rounded-lg border border-ash-800">
    <summary
      class="cursor-pointer px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-ash-400 transition-colors hover:bg-ash-900/50 hover:text-ash-300"
    >
      {{ summary }}
    </summary>
    <div class="border-t border-ash-800">
      <slot />
    </div>
  </details>
</template>
