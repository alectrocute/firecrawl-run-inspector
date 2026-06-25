<script setup lang="ts">
// Presentational app chrome: brand, product name, and the endpoint badge.
</script>

<template>
  <header class="shrink-0 border-b border-ash-800 bg-ash-950/80 backdrop-blur-sm">
    <div class="mx-auto flex w-full max-w-[1320px] items-center justify-between px-6 py-3">
      <div class="flex items-center gap-2.5">
        <BrandMark />
        <span class="text-sm font-medium text-ash-100">{{ $t('app.brand') }}</span>
        <span class="text-ash-700" aria-hidden="true">/</span>
        <span class="font-mono text-xs uppercase tracking-[0.14em] text-ash-400">
          {{ $t('app.productName') }}
        </span>
      </div>
    </div>
  </header>
</template>
