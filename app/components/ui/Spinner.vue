<script setup lang="ts">
withDefaults(defineProps<{ size?: 'sm' | 'md' }>(), { size: 'md' })

const SIZES = { sm: 'h-4 w-4', md: 'h-8 w-8' }
</script>

<template>
  <span
    class="inline-block animate-spin rounded-full border-2 border-current border-t-transparent"
    :class="SIZES[size]"
    role="status"
    :aria-label="$t('ui.loading')"
  />
</template>
