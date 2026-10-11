export interface Artist {
  id: number
  name: string
}

export interface Song {
  id: number
  title: string
  artists: Artist[]
  album: string
  albumArtist?: string
  year?: number
  trackNumber?: number
  coverUrl: string
  audioUrl?: string
  duration: number
  lyricsVersion?: string
  source: 'local' | 'remote'
}

export interface Playlist {
  id: number
  name: string
  description: string
  coverUrl: string
  playCount: number
  mood: string
  songs: Song[]
}

export interface RadioChannel {
  id: number
  name: string
  description: string
  coverUrl: string
  color: string
}
