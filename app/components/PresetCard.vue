<script setup lang="ts">
import type { Preset } from '~/types'

defineProps<{ preset: Preset }>()
defineEmits<{ select: [] }>()
</script>

<template>
  <UiCard as="button" interactive @click="$emit('select')">
    <p class="text-sm font-semibold text-ash-200 transition-colors group-hover:text-flame-400">
      {{ preset.name }}
    </p>
    <p class="mt-1.5 text-xs leading-relaxed text-ash-500">{{ preset.description }}</p>
    <p class="mt-2 font-mono text-xs text-ash-600">
      {{ $t('presets.stepCount', { count: preset.actions.length }) }} • {{ stripProtocol(preset.url) }}
    </p>
  </UiCard>
</template>
