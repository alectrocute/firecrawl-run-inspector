<script setup lang="ts">
const props = defineProps<{
  /** Ordered list of screenshot URLs available for navigation. */
  images: string[]
  /** Index of the currently displayed image (negative = closed). */
  modelValue: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
  close: []
}>()

const current = computed(() =>
  props.modelValue >= 0 && props.modelValue < props.images.length
    ? props.images[props.modelValue]
    : null,
)

function prev() {
  if (props.images.length < 2) return
  const next = props.modelValue <= 0 ? props.images.length - 1 : props.modelValue - 1
  emit('update:modelValue', next)
}

function next() {
  if (props.images.length < 2) return
  const nxt = props.modelValue >= props.images.length - 1 ? 0 : props.modelValue + 1
  emit('update:modelValue', nxt)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('close')
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    prev()
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    next()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div
      v-if="current"
      class="fixed inset-0 z-50 flex select-none items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      @click.self="$emit('close')"
    >
      <!-- Close -->
      <button
        class="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
        @click="$emit('close')"
      >
        <UiIcon name="x" class="h-6 w-6" />
      </button>

      <!-- Counter -->
      <span
        v-if="images.length > 1"
        class="absolute left-4 top-4 z-10 rounded-full bg-white/10 px-3 py-1.5 font-mono text-xs text-white/70"
      >
        {{ props.modelValue + 1 }} / {{ images.length }}
      </span>

      <!-- Prev -->
      <button
        v-if="images.length > 1"
        class="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
        @click.stop="prev"
      >
        <UiIcon name="arrowLeft" class="h-5 w-5" />
      </button>

      <!-- Image -->
      <img
        :src="current"
        :alt="$t('timeline.screenshot.altExpanded')"
        class="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
      />

      <!-- Next -->
      <button
        v-if="images.length > 1"
        class="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
        @click.stop="next"
      >
        <UiIcon name="arrowRight" class="h-5 w-5" />
      </button>
    </div>
  </Teleport>
</template>
