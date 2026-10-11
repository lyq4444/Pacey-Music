<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="overlay" @click.self="close">
        <section class="search-panel" aria-label="搜索">
          <div class="search-box">
            <Search :size="20" />
            <input
              ref="inputRef"
              v-model="keyword"
              type="search"
              placeholder="搜索歌曲、歌手、专辑"
              @keydown.escape="close"
            />
            <button class="icon-button" type="button" aria-label="关闭搜索" @click="close">
              <X :size="20" />
            </button>
          </div>

          <div class="search-results">
            <button
              v-for="song in results"
              :key="song.id"
              class="song-row"
              type="button"
              @click="play(song)"
            >
              <img :src="song.coverUrl" :alt="song.album" />
              <span>
                <strong>{{ song.title }}</strong>
                <small>{{ song.artists.map((artist) => artist.name).join(' / ') }} · {{ song.album }}</small>
              </span>
            </button>
            <p v-if="keyword && !results.length" class="empty">没有匹配结果</p>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { Search, X } from '@lucide/vue'
import { searchSongs } from '@/services/music'
import { usePlayerStore } from '@/stores/player'
import type { Song } from '@/types/music'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const inputRef = ref<HTMLInputElement>()
const keyword = ref('')
const results = ref<Song[]>([])
const player = usePlayerStore()

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      await nextTick()
      inputRef.value?.focus()
    }
  }
)

watch(keyword, async (value) => {
  results.value = await searchSongs(value)
})

function close() {
  emit('update:open', false)
}

function play(song: Song) {
  player.playSong(song, results.value.length ? results.value : undefined)
  close()
}
</script>
