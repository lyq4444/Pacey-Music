<template>
  <section class="page library-page">
    <header class="library-hero">
      <div>
        <span class="eyebrow">Playlist court</span>
        <h1>歌单广场</h1>
      </div>
      <dl class="library-hero__stats" aria-label="歌单概览">
        <div>
          <dt>{{ playlists.length }}</dt>
          <dd>推荐专辑</dd>
        </div>
        <div>
          <dt>{{ totalSongs }}</dt>
          <dd>收录曲目</dd>
        </div>
      </dl>
    </header>

    <section class="section-head library-section-head">
      <div>
        <span class="eyebrow">Curated shelves</span>
        <h2>推荐专辑</h2>
      </div>
    </section>
    <PlaylistGrid :playlists="playlists" />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PlaylistGrid from '@/components/PlaylistGrid.vue'
import { getFeaturedPlaylists } from '@/services/music'
import type { Playlist } from '@/types/music'

const playlists = ref<Playlist[]>([])

const totalSongs = computed(() => playlists.value.reduce((sum, playlist) => sum + playlist.songs.length, 0))

onMounted(async () => {
  playlists.value = await getFeaturedPlaylists()
})
</script>
