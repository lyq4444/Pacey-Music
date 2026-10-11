<template>
  <section class="page">
    <header class="view-title">
      <span class="eyebrow">本地曲库</span>
      <h1>本地歌曲</h1>
    </header>
    <p v-if="loading" class="empty">正在读取本地曲库…</p>
    <p v-else-if="!songs.length" class="empty">本地曲库里暂无歌曲。</p>
    <SongList v-else :songs="songs" />
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import SongList from '@/components/SongList.vue'
import { getLocalLibrary } from '@/services/music'
import type { Song } from '@/types/music'

const songs = ref<Song[]>([])
const loading = ref(true)

onMounted(async () => {
  songs.value = await getLocalLibrary()
  loading.value = false
})
</script>
