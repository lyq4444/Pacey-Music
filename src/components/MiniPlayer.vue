<template>
  <section v-if="player.currentSong" class="mini-player">
    <audio
      ref="audioRef"
      :src="player.currentSong.audioUrl"
      @durationchange="syncDuration"
      @timeupdate="syncTime"
      @ended="player.next"
    />

    <div class="mini-player__surface" :style="{ '--player-progress': `${progressPercent}%` }">
      <button class="track-chip" type="button" @click="player.expanded = true">
        <img :src="player.currentSong.coverUrl" :alt="player.currentSong.album" />
        <span>
          <strong>{{ player.currentSong.title }}</strong>
          <small>{{ player.currentSong.artists[0]?.name }}</small>
        </span>
      </button>

      <PlayerControls
        :is-playing="player.isPlaying"
        :disabled="!player.currentSong"
        @previous="player.previous"
        @toggle="player.toggle"
        @next="player.next"
      />

      <VolumeControl
        compact
        :volume="player.volume"
        :muted="player.muted"
        @toggle-mute="player.toggleMute"
        @volume-change="player.setVolume"
      />

      <PlayerProgress
        compact
        :current-time="player.currentTime"
        :duration="player.duration || player.currentSong?.duration || 0"
        :disabled="!player.currentSong"
        :show-times="false"
        @seek="seek"
      />
    </div>
  </section>

  <PlayerSheet v-if="player.currentSong" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PlayerSheet from '@/components/PlayerSheet.vue'
import PlayerControls from '@/components/player/PlayerControls.vue'
import PlayerProgress from '@/components/player/PlayerProgress.vue'
import VolumeControl from '@/components/player/VolumeControl.vue'
import { usePlayerStore } from '@/stores/player'

const player = usePlayerStore()
const audioRef = ref<HTMLAudioElement>()
const progressPercent = computed(() => {
  const duration = player.duration || player.currentSong?.duration || 0
  if (!duration) return 0
  return Math.min(100, Math.max(0, (player.currentTime / duration) * 100))
})

watch(
  () => [player.currentSong?.id, player.isPlaying],
  async () => {
    const audio = audioRef.value
    if (!audio) return
    syncVolume()
    if (player.isPlaying) {
      try {
        await audio.play()
      } catch {
        player.isPlaying = false
      }
    } else {
      audio.pause()
    }
  },
  { flush: 'post' }
)

watch(
  () => [player.volume, player.muted],
  () => syncVolume(),
  { immediate: true, flush: 'post' }
)

function syncTime() {
  if (audioRef.value) player.setTime(audioRef.value.currentTime)
}

function syncDuration() {
  if (audioRef.value) player.setDuration(audioRef.value.duration)
}

function syncVolume() {
  const audio = audioRef.value
  if (!audio) return
  audio.volume = player.volume
  audio.muted = player.muted
}

function seek(value: number) {
  player.setTime(value)
  if (audioRef.value) audioRef.value.currentTime = value
}
</script>
