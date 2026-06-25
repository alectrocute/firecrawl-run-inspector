<script setup lang="ts">
import type { Preset } from '~/types'

defineProps<{ presets: Preset[] }>()
const emit = defineEmits<{ select: [preset: Preset] }>()

// Collapsed by default on mobile; always shown from `lg` up via `lg:!grid`.
const open = ref(false)
</script>

<template>
  <div>
    <button
      type="button"
      class="flex w-full items-center justify-between lg:cursor-default"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="font-mono text-xs text-ash-500">{{ $t('presets.heading') }}</span>
      <UiIcon
        name="chevronDown"
        class="h-4 w-4 text-ash-500 transition-transform lg:hidden"
        :class="{ 'rotate-180': open }"
      />
    </button>

    <div class="mt-3 grid grid-cols-1 gap-3 lg:!grid" :class="{ hidden: !open }">
      <PresetCard
        v-for="preset in presets"
        :key="preset.id"
        :preset
        @select="emit('select', preset)"
      />
    </div>
  </div>
</template>
