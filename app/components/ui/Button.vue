<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost'
    type?: 'button' | 'submit'
  }>(),
  { variant: 'primary', type: 'button' },
)

const BASE =
  'inline-flex items-center justify-center gap-2 font-medium transition-all focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-40'

const VARIANTS = {
  primary:
    'rounded-full bg-flame-500 px-5 py-2.5 text-sm text-white shadow-[0_0_0_4px_rgba(250,93,25,0.12)] hover:bg-flame-400 focus:ring-flame-500/50 focus:ring-offset-2 focus:ring-offset-ash-950 disabled:shadow-none',
  secondary:
    'rounded-lg border border-flame-500/30 bg-flame-500/10 px-4 py-2 text-sm text-flame-400 hover:bg-flame-500/20 focus:ring-flame-500/30',
  ghost:
    'rounded-md border border-ash-700 px-2.5 py-1 text-xs text-ash-400 hover:border-ash-600 hover:bg-ash-800/50 hover:text-ash-200 focus:ring-flame-500/30',
}
</script>

<template>
  <button :type="type" :class="[BASE, VARIANTS[variant]]">
    <slot />
  </button>
</template>
