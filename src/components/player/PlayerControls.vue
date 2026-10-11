<template>
  <div class="transport-controls" :class="`transport-controls--${variant}`">
    <button class="transport-button transport-button--secondary" type="button" aria-label="上一首" :disabled="disabled" @click="emit('previous')">
      <SkipBack :size="variant === 'sheet' ? 23 : 19" :stroke-width="1.8" />
    </button>
    <button
      class="transport-button transport-button--primary"
      type="button"
      :aria-label="isPlaying ? '暂停' : '播放'"
      :disabled="disabled"
      @click="emit('toggle')"
    >
      <Pause v-if="isPlaying" :size="variant === 'sheet' ? 29 : 24" :stroke-width="2" />
      <Play v-else :size="variant === 'sheet' ? 29 : 24" :stroke-width="2" />
    </button>
    <button class="transport-button transport-button--secondary" type="button" aria-label="下一首" :disabled="disabled" @click="emit('next')">
      <SkipForward :size="variant === 'sheet' ? 23 : 19" :stroke-width="1.8" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { Pause, Play, SkipBack, SkipForward } from '@lucide/vue'

withDefaults(defineProps<{
  isPlaying: boolean
  variant?: 'mini' | 'sheet'
  disabled?: boolean
}>(), {
  variant: 'mini',
  disabled: false
})

const emit = defineEmits<{
  previous: []
  toggle: []
  next: []
}>()
</script>
