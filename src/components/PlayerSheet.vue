<template>
  <Teleport to="body">
    <Transition name="slide-up">
      <section v-if="player.expanded && player.currentSong" class="player-sheet">
        <div class="player-bg">
          <img :src="player.currentSong.coverUrl" alt="" />
        </div>

        <header class="sheet-header">
          <button
            class="sheet-header__action"
            type="button"
            aria-label="收起播放器"
            @click="player.expanded = false"
          >
            <ChevronDown :size="21" />
          </button>
          <span class="sheet-header__track">
            <strong>{{ player.currentSong.title }}</strong>
            <small>{{ player.currentSong.artists.map((artist) => artist.name).join(' / ') }}</small>
          </span>
          <button
            class="sheet-header__action sheet-header__action--queue"
            type="button"
            :aria-label="queueOpen ? '关闭播放队列' : '打开播放队列'"
            @click="queueOpen = !queueOpen"
          >
            <ListMusic :size="20" />
            <span class="sheet-header__queue-count">{{ player.queue.length }}</span>
          </button>
        </header>

        <div class="sheet-main">
          <div class="disc-wrap" :class="{ spinning: player.isPlaying }">
            <div class="disc" aria-hidden="true"></div>
            <img class="cover" :src="player.currentSong.coverUrl" :alt="player.currentSong.album" />
          </div>

          <section class="lyric-panel" aria-label="同步歌词">
            <div v-if="lyricsLoading" class="lyric-empty">歌词加载中</div>
            <div v-else-if="lyricsError" class="lyric-empty">{{ lyricsErrorMessage }}</div>
            <div v-else-if="!lyrics.length" class="lyric-empty">暂无同步歌词</div>
            <div v-else ref="lyricsListRef" class="lyric-list">
              <p
                v-for="(line, index) in lyrics"
                :key="`${line.time}-${index}`"
                :ref="(element) => setLyricLineRef(element, index)"
                class="lyric-line"
                :class="{ active: index === activeLyricIndex, passed: index < activeLyricIndex }"
              >
                {{ line.text }}
              </p>
            </div>
          </section>
        </div>

        <div class="sheet-control-deck">
          <PlayerProgress
            :current-time="player.currentTime"
            :duration="player.duration || player.currentSong.duration"
            @seek="seek"
          />
          <div class="sheet-control-deck__actions">
            <PlayerControls
              variant="sheet"
              :is-playing="player.isPlaying"
              @previous="player.previous"
              @toggle="player.toggle"
              @next="player.next"
            />
            <VolumeControl
              :volume="player.volume"
              :muted="player.muted"
              @toggle-mute="player.toggleMute"
              @volume-change="player.setVolume"
            />
          </div>
        </div>

        <Transition name="queue-panel">
          <aside v-if="queueOpen" class="sheet-queue" aria-label="播放队列">
            <header class="sheet-queue__head">
              <span>
                <strong>播放队列</strong>
                <small>{{ player.queue.length }} 首</small>
              </span>
              <button class="icon-button light sheet-queue__close" type="button" aria-label="关闭播放队列" @click="queueOpen = false">
                <X :size="20" />
              </button>
            </header>

            <div class="sheet-queue__list">
              <button
                v-for="(song, index) in player.queue"
                :key="song.id"
                class="sheet-queue__item"
                :class="{ active: index === player.currentIndex }"
                type="button"
                @click="playFromQueue(index)"
              >
                <span class="sheet-queue__index">{{ index + 1 }}</span>
                <img :src="song.coverUrl" :alt="song.album" />
                <span class="sheet-queue__meta">
                  <strong>{{ song.title }}</strong>
                  <small>{{ song.artists.map((artist) => artist.name).join(' / ') }}</small>
                </span>
              </button>
            </div>
          </aside>
        </Transition>
      </section>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch, type ComponentPublicInstance } from 'vue'
import { ChevronDown, ListMusic, X } from '@lucide/vue'
import PlayerControls from '@/components/player/PlayerControls.vue'
import PlayerProgress from '@/components/player/PlayerProgress.vue'
import VolumeControl from '@/components/player/VolumeControl.vue'
import { findActiveLyricIndex, getSongLyrics, LyricsLookupError, type LyricLine } from '@/services/lyrics'
import { usePlayerStore } from '@/stores/player'

const lyricsCache = new Map<string, LyricLine[]>()
const player = usePlayerStore()
const queueOpen = ref(false)
const scrollLockClass = 'player-sheet-open'
const lyrics = ref<LyricLine[]>([])
const lyricsLoading = ref(false)
const lyricsError = ref(false)
const lyricsErrorReason = ref<'network' | 'not_found' | 'invalid' | 'unaligned'>('not_found')
const lyricsListRef = ref<HTMLElement>()
const lyricLineRefs = ref<HTMLElement[]>([])
let lyricsRequestId = 0
const activeLyricIndex = computed(() => findActiveLyricIndex(lyrics.value, player.currentTime))
const lyricsErrorMessage = computed(() => (
  lyricsErrorReason.value === 'network'
    ? '本地歌词读取失败'
    : lyricsErrorReason.value === 'unaligned'
      ? '歌词尚未可靠对齐'
    : lyricsErrorReason.value === 'invalid'
      ? '本地歌词格式无效'
      : '暂无本地歌词'
))

watch(
  () => player.expanded && Boolean(player.currentSong),
  (isOpen) => {
    document.documentElement.classList.toggle(scrollLockClass, isOpen)
    document.body.classList.toggle(scrollLockClass, isOpen)
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  document.documentElement.classList.remove(scrollLockClass)
  document.body.classList.remove(scrollLockClass)
})

watch(
  () => player.currentSong
    ? `${player.currentSong.id}:${player.currentSong.lyricsVersion || 'none'}`
    : null,
  async () => {
    const song = player.currentSong
    const requestId = ++lyricsRequestId
    lyrics.value = []
    lyricsError.value = false
    lyricsErrorReason.value = 'not_found'
    lyricLineRefs.value = []
    if (!song) return

    const cacheKey = `${song.id}:${song.lyricsVersion || 'none'}`
    const cachedLyrics = lyricsCache.get(cacheKey)
    if (cachedLyrics) {
      lyrics.value = cachedLyrics
      lyricsLoading.value = false
      return
    }

    lyricsLoading.value = true
    try {
      const nextLyrics = await getSongLyrics(song)
      if (requestId !== lyricsRequestId || player.currentSong?.id !== song.id) return
      lyricsCache.set(cacheKey, nextLyrics)
      lyrics.value = nextLyrics
    } catch (error) {
      if (requestId !== lyricsRequestId || player.currentSong?.id !== song.id) return
      if (error instanceof LyricsLookupError) lyricsErrorReason.value = error.reason
      lyricsError.value = true
    } finally {
      if (requestId === lyricsRequestId && player.currentSong?.id === song.id) lyricsLoading.value = false
    }
  },
  { immediate: true }
)

watch(activeLyricIndex, async (index) => {
  if (index < 0) return
  await nextTick()
  lyricLineRefs.value[index]?.scrollIntoView({ block: 'center', behavior: 'smooth' })
})

function seek(value: number) {
  player.setTime(value)
  const audio = document.querySelector<HTMLAudioElement>('.mini-player audio')
  if (audio) audio.currentTime = value
}

function playFromQueue(index: number) {
  const song = player.queue[index]
  if (!song) return
  player.playSong(song, player.queue)
}

function setLyricLineRef(element: Element | ComponentPublicInstance | null, index: number) {
  if (element instanceof HTMLElement) lyricLineRefs.value[index] = element
}
</script>
