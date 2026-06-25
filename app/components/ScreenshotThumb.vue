<script setup lang="ts">
defineProps<{ src: string; alt: string; label: string }>()
defineEmits<{ expand: [] }>()
</script>

<template>
  <div>
    <p class="mb-1.5 font-mono text-xs text-ash-500">{{ label }}</p>
    <button
      class="group relative block overflow-hidden rounded-lg border border-ash-700 bg-ash-900/50 transition-all hover:border-flame-500/30 focus:outline-none focus:ring-2 focus:ring-flame-500/30"
      @click="$emit('expand')"
    >
      <img :src="src" :alt="alt" class="h-32 w-full object-cover object-top" loading="lazy" />
      <div class="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
        <span class="rounded-md bg-black/70 px-3 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
          {{ $t('timeline.screenshot.clickToExpand') }}
        </span>
      </div>
    </button>
  </div>
</template>
