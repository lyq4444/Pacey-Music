import { defineStore } from 'pinia'
import type { Song } from '@/types/music'

interface PlayerState {
  queue: Song[]
  currentIndex: number
  isPlaying: boolean
  currentTime: number
  duration: number
  expanded: boolean
  volume: number
  muted: boolean
}

const volumeStorageKey = 'pacey-music-volume'
const mutedStorageKey = 'pacey-music-muted'

function readStoredVolume() {
  if (typeof window === 'undefined') return 0.78
  const stored = Number(window.localStorage.getItem(volumeStorageKey))
  if (!Number.isFinite(stored)) return 0.78
  return Math.min(1, Math.max(0, stored))
}

function readStoredMuted() {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(mutedStorageKey) === 'true'
}

export const usePlayerStore = defineStore('player', {
  state: (): PlayerState => ({
    queue: [],
    currentIndex: -1,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    expanded: false,
    volume: readStoredVolume(),
    muted: readStoredMuted()
  }),
  getters: {
    currentSong: (state) => state.queue[state.currentIndex],
    progress: (state) => (state.duration > 0 ? state.currentTime / state.duration : 0),
    effectiveVolume: (state) => (state.muted ? 0 : state.volume)
  },
  actions: {
    playSong(song: Song, queue?: Song[]) {
      if (queue?.length) {
        this.queue = queue
      } else if (!this.queue.some((item) => item.id === song.id)) {
        this.queue.push(song)
      }
      this.currentIndex = this.queue.findIndex((item) => item.id === song.id)
      this.isPlaying = true
      this.expanded = true
    },
    playQueue(queue: Song[], startIndex = 0) {
      this.queue = queue
      this.currentIndex = startIndex
      this.currentTime = 0
      this.isPlaying = true
    },
    toggle() {
      if (this.currentSong) this.isPlaying = !this.isPlaying
    },
    next() {
      if (!this.queue.length) return
      this.currentIndex = (this.currentIndex + 1) % this.queue.length
      this.currentTime = 0
      this.isPlaying = true
    },
    previous() {
      if (!this.queue.length) return
      this.currentIndex = (this.currentIndex - 1 + this.queue.length) % this.queue.length
      this.currentTime = 0
      this.isPlaying = true
    },
    setTime(value: number) {
      this.currentTime = value
    },
    setDuration(value: number) {
      this.duration = Number.isFinite(value) ? value : 0
    },
    setVolume(value: number) {
      this.volume = Math.min(1, Math.max(0, value))
      this.muted = this.volume === 0
      this.persistVolume()
    },
    toggleMute() {
      this.muted = !this.muted
      if (!this.muted && this.volume === 0) this.volume = 0.5
      this.persistVolume()
    },
    persistVolume() {
      if (typeof window === 'undefined') return
      window.localStorage.setItem(volumeStorageKey, String(this.volume))
      window.localStorage.setItem(mutedStorageKey, String(this.muted))
    }
  }
})
