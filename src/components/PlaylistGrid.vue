<template>
  <div class="playlist-grid">
    <RouterLink v-for="playlist in playlists" :key="playlist.id" class="playlist-card" :to="`/playlist/${playlist.id}`">
      <span class="playlist-cover-wrap">
        <img :src="playlist.coverUrl" :alt="playlist.name" />
        <span class="badge">{{ playlist.mood }}</span>
        <span class="playlist-card__count">{{ playlist.songs.length }} 首</span>
      </span>
      <span class="playlist-card__body">
        <span class="playlist-card__kicker">
          <Disc3 :size="16" />
          专辑合集
        </span>
        <strong>{{ playlist.name }}</strong>
        <span class="playlist-card__desc">{{ albumArtist(playlist) }} · {{ albumYear(playlist) }}</span>
        <small>{{ playlist.songs.length }} 首曲目 · 完整专辑</small>
      </span>
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { Disc3 } from '@lucide/vue'
import type { Playlist } from '@/types/music'

defineProps<{ playlists: Playlist[] }>()

function albumArtist(playlist: Playlist) {
  return playlist.songs[0]?.albumArtist || playlist.songs[0]?.artists[0]?.name || '群星'
}

function albumYear(playlist: Playlist) {
  return playlist.songs[0]?.year || playlist.mood || 'Album'
}
</script>
