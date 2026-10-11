<template>
  <div class="player-progress" :class="{ 'player-progress--compact': compact }">
    <span v-if="showTimes" class="player-progress__time">{{ formatPlayerTime(currentTime) }}</span>
    <input
      class="player-progress__range"
      type="range"
      min="0"
      :max="safeDuration"
      step="0.1"
      :value="safeCurrentTime"
      :disabled="disabled"
      aria-label="播放进度"
      :style="{ '--player-progress': `${progress * 100}%` }"
      @input="onInput"
    />
    <span v-if="showTimes" class="player-progress__time player-progress__time--end">
      {{ formatPlayerTime(duration) }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { clampProgress, formatPlayerTime } from './player-format'

const props = withDefaults(defineProps<{
  currentTime: number
  duration: number
  compact?: boolean
  showTimes?: boolean
  disabled?: boolean
}>(), {
  compact: false,
  showTimes: true,
  disabled: false
})

const emit = defineEmits<{
  seek: [value: number]
}>()

const safeDuration = computed(() => Number.isFinite(props.duration) && props.duration > 0 ? props.duration : 1)
const safeCurrentTime = computed(() => Math.min(safeDuration.value, Math.max(0, props.currentTime || 0)))
const progress = computed(() => clampProgress(safeCurrentTime.value / safeDuration.value))

function onInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  emit('seek', value)
}
</script>
