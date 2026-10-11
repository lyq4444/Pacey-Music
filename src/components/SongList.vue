<template>
  <div class="song-list">
    <button v-for="(song, index) in songs" :key="song.id" class="song-row" type="button" @click="play(index)">
      <span class="song-index">{{ index + 1 }}</span>
      <img :src="song.coverUrl" :alt="song.album" />
      <span>
        <strong>{{ song.title }}</strong>
        <small>{{ song.artists.map((artist) => artist.name).join(' / ') }} · {{ song.album }}</small>
      </span>
      <span class="duration">{{ formatTime(song.duration) }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { usePlayerStore } from '@/stores/player'
import type { Song } from '@/types/music'

const props = defineProps<{ songs: Song[] }>()
const player = usePlayerStore()

function play(index: number) {
  player.playQueue(props.songs, index)
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}
</script>
