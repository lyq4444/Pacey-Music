<template>
  <div
    class="volume-control"
    :class="{ 'volume-control--compact': compact }"
    role="group" aria-label="音量"
  >
    <button
      class="volume-control__button"
      type="button"
      :aria-label="muted || volume === 0 ? '取消静音' : '静音'"
      :title="`音量 ${Math.round(effectiveVolume * 100)}%`"
      @click="emit('toggle-mute')"
    >
      <VolumeX v-if="muted || volume === 0" :size="20" :stroke-width="1.8" />
      <Volume2 v-else :size="20" :stroke-width="1.8" />
    </button>
    <input
      class="volume-control__range"
      type="range"
      min="0"
      max="1"
      step="0.01"
      :value="effectiveVolume"
      :style="{ '--player-volume': `${effectiveVolume * 100}%` }"
      aria-label="音量"
      @input="onInput"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Volume2, VolumeX } from '@lucide/vue'

const props = withDefaults(defineProps<{
  volume: number
  muted: boolean
  compact?: boolean
}>(), {
  compact: false
})

const emit = defineEmits<{
  'toggle-mute': []
  'volume-change': [value: number]
}>()

const effectiveVolume = computed(() => props.muted ? 0 : props.volume)

function onInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  emit('volume-change', value)
}
</script>
