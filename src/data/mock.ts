import type { Playlist, RadioChannel, Song } from '@/types/music'

const apiBaseUrl = (import.meta.env.VITE_MUSIC_API_BASE || 'http://127.0.0.1:8787/api').replace(/\/$/, '')
const sampleAudio = `${apiBaseUrl.replace(/\/api$/, '')}/api/stream/649007aef72e8562`

export const art = {
  defaultCover: '/art/default-cover.svg',
  daily: '/art/cover-daily.svg',
  focus: '/art/cover-focus.svg',
  night: '/art/cover-night.svg',
  fm: '/art/cover-fm.svg',
  indie: '/art/cover-indie.svg',
  chart: '/art/cover-chart.svg',
  radioPrivate: '/art/radio-private.svg',
  radioSleep: '/art/radio-sleep.svg',
  radioNew: '/art/radio-new.svg'
}

export const heroCovers = [art.daily, art.focus, art.night]

export const songs: Song[] = [
  {
    id: 1001,
    title: 'Beautiful In White',
    artists: [{ id: 1, name: 'Shane Filan' }],
    album: 'Acoustic Night',
    coverUrl: art.daily,
    audioUrl: sampleAudio,
    duration: 220,
    source: 'local'
  },
  {
    id: 1002,
    title: '晚风电台',
    artists: [{ id: 2, name: 'City Loop' }],
    album: 'Daily Mix',
    coverUrl: art.fm,
    audioUrl: sampleAudio,
    duration: 214,
    source: 'local'
  },
  {
    id: 1003,
    title: '雨后公路',
    artists: [{ id: 3, name: 'North Signal' }],
    album: 'Drive Home',
    coverUrl: art.night,
    audioUrl: sampleAudio,
    duration: 198,
    source: 'local'
  },
  {
    id: 1004,
    title: '红色耳机',
    artists: [{ id: 4, name: 'Cloud Nine' }],
    album: 'Portable Love',
    coverUrl: art.chart,
    audioUrl: sampleAudio,
    duration: 242,
    source: 'local'
  },
  {
    id: 1005,
    title: '清晨低语',
    artists: [{ id: 5, name: 'Mellow Room' }],
    album: 'Quiet Start',
    coverUrl: art.indie,
    audioUrl: sampleAudio,
    duration: 207,
    source: 'local'
  },
  {
    id: 1006,
    title: '玻璃海',
    artists: [{ id: 6, name: 'Blue Frame' }],
    album: 'Ocean Glass',
    coverUrl: art.focus,
    audioUrl: sampleAudio,
    duration: 231,
    source: 'local'
  }
]

export const playlists: Playlist[] = [
  {
    id: 1,
    name: '今日推荐',
    description: '醒来、通勤、午后都能顺手播放的一组歌。',
    coverUrl: art.daily,
    playCount: 146332,
    mood: 'Daily',
    songs: songs.slice(0, 4)
  },
  {
    id: 2,
    name: '轻松工作流',
    description: '节奏稳定，适合写代码和整理想法。',
    coverUrl: art.focus,
    playCount: 85421,
    mood: 'Focus',
    songs: [songs[2], songs[4], songs[5], songs[0]]
  },
  {
    id: 3,
    name: '城市夜行',
    description: '霓虹、车窗和一点点低频。',
    coverUrl: art.night,
    playCount: 67208,
    mood: 'Night',
    songs: [songs[1], songs[3], songs[5]]
  },
  {
    id: 4,
    name: '私人 FM',
    description: '从最近播放延展开来的轻量日推。',
    coverUrl: art.fm,
    playCount: 123909,
    mood: 'FM',
    songs: [songs[0], songs[5], songs[4]]
  },
  {
    id: 5,
    name: '中文独立感',
    description: '留白更多，适合傍晚以后。',
    coverUrl: art.indie,
    playCount: 40888,
    mood: 'Indie',
    songs: [songs[4], songs[3], songs[2]]
  },
  {
    id: 6,
    name: '热歌云榜',
    description: '把排行榜做成真正能扫读的列表。',
    coverUrl: art.chart,
    playCount: 219304,
    mood: 'Hot',
    songs: [songs[3], songs[1], songs[0], songs[2]]
  }
]

export const radioChannels: RadioChannel[] = [
  {
    id: 1,
    name: '私人漫游',
    description: '从当前播放队列延展出的相邻曲风。',
    coverUrl: art.radioPrivate,
    color: '#2f6f68'
  },
  {
    id: 2,
    name: '睡前二十分钟',
    description: '更慢，更轻，更靠近耳边。',
    coverUrl: art.radioSleep,
    color: '#596d69'
  },
  {
    id: 3,
    name: '新歌试衣间',
    description: '快速扫一遍可能喜欢的新歌。',
    coverUrl: art.radioNew,
    color: '#9f3228'
  }
]
