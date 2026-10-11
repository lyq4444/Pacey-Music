<template>
  <section class="page discover-page">
    <section class="hero discover-hero">
      <div class="hero-copy">
        <div class="hero-actions">
          <button class="primary-button" type="button" @click="playToday">
            <Play :size="18" />
            播放今日歌单
          </button>
          <RouterLink class="ghost-button" to="/playlists">逛歌单广场</RouterLink>
        </div>

        <dl class="hero-stats" aria-label="今日推荐概览">
          <div>
            <dt>{{ playlists.length || 6 }}</dt>
            <dd>推荐歌单</dd>
          </div>
          <div>
            <dt>{{ todayQueue.length || 4 }}</dt>
            <dd>待听曲目</dd>
          </div>
          <div>
            <dt>FM</dt>
            <dd>私人电台</dd>
          </div>
        </dl>
      </div>

      <div class="hero-visual" aria-label="今日推荐封面">
        <div class="listening-stage">
          <div class="vinyl" aria-hidden="true"></div>
          <img class="cover-main" :src="featuredCovers[0]" alt="今日推荐主封面" />
          <img class="cover-side cover-side-a" :src="featuredCovers[1]" alt="推荐歌单封面" />
          <img class="cover-side cover-side-b" :src="featuredCovers[2]" alt="推荐歌单封面" />
          <div class="needle-line"></div>
        </div>

        <aside class="daily-queue" aria-label="正在推荐">
          <div class="daily-queue__head">
            <span>正在推荐</span>
            <Music2 :size="18" />
          </div>
          <button
            v-for="song in todayQueue.slice(0, 4)"
            :key="song.id"
            class="queue-track"
            type="button"
            @click="player.playSong(song)"
          >
            <img :src="song.coverUrl" :alt="song.title" />
            <span>
              <strong>{{ song.title }}</strong>
              <small>{{ song.artists[0]?.name || 'Unknown' }}</small>
            </span>
          </button>
        </aside>
      </div>
    </section>

    <section class="quick-actions" aria-label="快捷入口">
      <RouterLink to="/radio">
        <Radio :size="22" />
        私人 FM
      </RouterLink>
      <RouterLink to="/rankings">
        <Flame :size="22" />
        热歌榜
      </RouterLink>
      <RouterLink to="/playlists">
        <Library :size="22" />
        歌单广场
      </RouterLink>
    </section>

    <section class="section-head">
      <h2>推荐歌单</h2>
      <RouterLink to="/playlists">全部</RouterLink>
    </section>
    <PlaylistGrid :playlists="playlists.slice(0, 6)" />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Flame, Library, Music2, Play, Radio } from '@lucide/vue'
import PlaylistGrid from '@/components/PlaylistGrid.vue'
import { heroCovers } from '@/data/mock'
import { getFeaturedPlaylists } from '@/services/music'
import { usePlayerStore } from '@/stores/player'
import type { Playlist } from '@/types/music'

const playlists = ref<Playlist[]>([])
const player = usePlayerStore()
const todayQueue = computed(() => playlists.value[0]?.songs ?? [])
const featuredCovers = computed(() => {
  const covers = playlists.value.map((playlist) => playlist.coverUrl).filter(Boolean)
  return [
    covers[0] || heroCovers[0],
    covers[1] || covers[0] || heroCovers[1],
    covers[2] || covers[0] || heroCovers[2]
  ]
})

onMounted(async () => {
  playlists.value = await getFeaturedPlaylists()
})

function playToday() {
  const today = playlists.value[0]
  if (today) player.playQueue(today.songs)
}
</script>
