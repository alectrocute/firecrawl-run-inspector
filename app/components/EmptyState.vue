<script setup lang="ts">
import type { IconName } from '~/types'

withDefaults(
  defineProps<{
    title: string
    description?: string
    icon?: IconName
  }>(),
  { description: undefined, icon: 'list' },
)
</script>

<template>
  <div class="m-auto max-w-xs text-center">
    <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-ash-800 bg-ash-900/40">
      <UiIcon :name="icon" class="h-5 w-5 text-ash-600" />
    </div>
    <p class="text-sm font-medium text-ash-300">{{ title }}</p>
    <p v-if="description" class="mt-1.5 text-xs leading-relaxed text-ash-500">
      {{ description }}
    </p>
  </div>
</template>
