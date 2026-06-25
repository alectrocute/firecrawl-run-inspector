<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Element/component to render as — e.g. 'div' or 'button'. */
    as?: string
    /** Adds hover affordances for clickable cards. */
    interactive?: boolean
    padding?: 'none' | 'md'
  }>(),
  { as: 'div', interactive: false, padding: 'md' },
)
</script>

<template>
  <component
    :is="as"
    class="rounded-lg border border-ash-800 bg-ash-900/30 text-left"
    :class="[
      padding === 'md' ? 'p-4' : '',
      interactive
        ? 'group transition-all hover:border-flame-500/30 hover:bg-flame-500/5 focus:outline-none focus:ring-2 focus:ring-flame-500/30'
        : '',
    ]"
  >
    <slot />
  </component>
</template>
