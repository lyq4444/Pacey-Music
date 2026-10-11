import axios from 'axios'
import { playlists, radioChannels, songs } from '@/data/mock'
import type { Playlist, RadioChannel, Song } from '@/types/music'

const apiBaseUrl = (import.meta.env.VITE_MUSIC_API_BASE || 'http://127.0.0.1:8787/api').replace(/\/$/, '')
const apiOrigin = apiBaseUrl.replace(/\/api$/, '')

export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 8000
})

const delay = (ms = 160) => new Promise((resolve) => window.setTimeout(resolve, ms))

export async function getFeaturedPlaylists(): Promise<Playlist[]> {
  const localPlaylists = await getLocalAlbumPlaylists()
  if (localPlaylists.length) return localPlaylists

  await delay()
  return playlists
}

export async function getPlaylist(id: number): Promise<Playlist | undefined> {
  const localPlaylists = await getLocalAlbumPlaylists()
  const localPlaylist = localPlaylists.find((playlist) => playlist.id === id)
  if (localPlaylist) return localPlaylist

  await delay()
  return playlists.find((playlist) => playlist.id === id)
}

export async function getRankingSongs(): Promise<Song[]> {
  await delay()
  return [...songs].sort((a, b) => b.duration - a.duration)
}

export async function getRadioChannels(): Promise<RadioChannel[]> {
  await delay()
  return radioChannels
}

export async function getLocalLibrary(): Promise<Song[]> {
  try {
    const { data } = await api.get('/library')
    if (Array.isArray(data?.songs)) return data.songs.map(normalizeLocalSong)
  } catch {
    // The local API is optional while developing the static frontend.
  }

  return []
}

export async function rescanLocalLibrary(): Promise<Song[]> {
  const { data } = await api.post('/rescan')
  return Array.isArray(data?.songs) ? data.songs.map(normalizeLocalSong) : []
}

export async function searchSongs(keyword: string): Promise<Song[]> {
  const normalized = keyword.trim().toLowerCase()
  if (!normalized) return []

  try {
    const { data } = await api.get('/search', { params: { q: keyword } })
    if (Array.isArray(data?.songs) && data.songs.length) return data.songs.map(normalizeLocalSong)
  } catch {
    // Local fallback keeps the app usable while the backend is being wired.
  }

  await delay(120)
  return songs.filter((song) => {
    const haystack = `${song.title} ${song.album} ${song.artists.map((artist) => artist.name).join(' ')}`
    return haystack.toLowerCase().includes(normalized)
  })
}

function normalizeLocalSong(song: Song): Song {
  return {
    ...song,
    audioUrl: normalizeApiAsset(song.audioUrl),
    coverUrl: normalizeApiAsset(song.coverUrl) || '/art/default-cover.svg'
  }
}

async function getLocalAlbumPlaylists(): Promise<Playlist[]> {
  const localSongs = await getLocalLibrary()
  if (!localSongs.length) return []

  const groups = new Map<string, Song[]>()
  for (const song of localSongs) {
    const album = song.album || '本地曲库'
    groups.set(album, [...(groups.get(album) || []), song])
  }

  const albumEntries = Array.from(groups.entries())
  const curatedEntries = albumEntries.filter(([album, albumSongs]) => album !== '本地曲库' || albumSongs.length > 1)
  const entries = curatedEntries.length ? curatedEntries : albumEntries

  return entries
    .map(([album, albumSongs], index) => {
      const sortedSongs = [...albumSongs].sort((a, b) => {
        const left = Number.isFinite(Number(a.trackNumber)) ? Number(a.trackNumber) : Number.POSITIVE_INFINITY
        const right = Number.isFinite(Number(b.trackNumber)) ? Number(b.trackNumber) : Number.POSITIVE_INFINITY
        return left - right || a.title.localeCompare(b.title, 'zh-Hans-CN')
      })
      const firstSong = sortedSongs[0]
      const artist = firstSong?.albumArtist || firstSong?.artists[0]?.name || '本地音乐'

      return {
        id: 10000 + index,
        name: album,
        description: [artist, firstSong?.year, `${sortedSongs.length} 首曲目`].filter(Boolean).join(' · '),
        coverUrl: firstSong?.coverUrl || '/art/default-cover.svg',
        playCount: 0,
        mood: firstSong?.year ? String(firstSong.year) : 'Album',
        songs: sortedSongs
      }
    })
    .sort((a, b) => b.songs.length - a.songs.length || a.name.localeCompare(b.name, 'zh-Hans-CN'))
}

function normalizeApiAsset(url?: string) {
  if (!url || /^https?:\/\//.test(url) || url.startsWith('blob:')) return url
  if (url.startsWith('/api/')) return `${apiOrigin}${url}`
  return url
}
