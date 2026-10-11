<template>
  <section v-if="playlist" class="page playlist-view">
    <header class="playlist-hero">
      <div class="playlist-hero__art">
        <img :src="playlist.coverUrl" :alt="playlist.name" />
      </div>
      <div class="playlist-hero__copy">
        <span class="eyebrow">Album</span>
        <h1>{{ playlist.name }}</h1>
        <p>{{ playlist.description }}</p>
        <dl class="playlist-meta" aria-label="专辑信息">
          <div>
            <dt>{{ playlist.songs.length }}</dt>
            <dd>首曲目</dd>
          </div>
          <div>
            <dt>{{ albumYear }}</dt>
            <dd>发行年份</dd>
          </div>
          <div>
            <dt>{{ albumArtist }}</dt>
            <dd>专辑艺人</dd>
          </div>
        </dl>
        <button class="primary-button" type="button" @click="player.playQueue(playlist.songs)">
          <Play :size="18" />
          播放全部
        </button>
      </div>
    </header>

    <SongList :songs="playlist.songs" />
  </section>

  <section v-else class="page">
    <p class="empty">歌单不存在</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Play } from '@lucide/vue'
import SongList from '@/components/SongList.vue'
import { getPlaylist } from '@/services/music'
import { usePlayerStore } from '@/stores/player'
import type { Playlist } from '@/types/music'

const props = defineProps<{ id: string }>()
const playlist = ref<Playlist>()
const player = usePlayerStore()

const albumArtist = computed(() => {
  const firstSong = playlist.value?.songs[0]
  return firstSong?.albumArtist || firstSong?.artists[0]?.name || '群星'
})

const albumYear = computed(() => playlist.value?.songs[0]?.year || '未知')

onMounted(async () => {
  playlist.value = await getPlaylist(Number(props.id))
})
</script>
