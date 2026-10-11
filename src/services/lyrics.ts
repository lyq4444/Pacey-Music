import axios from 'axios'
import type { Song } from '@/types/music'
import { parseLrc, type LyricLine } from '@/services/lyrics-core'
import { api } from '@/services/music'

export { findActiveLyricIndex, parseLrc, type LyricLine } from '@/services/lyrics-core'

export type LyricsError = 'network' | 'not_found' | 'invalid' | 'unaligned'

export class LyricsLookupError extends Error {
  reason: LyricsError

  constructor(reason: LyricsError) {
    super(reason)
    this.name = 'LyricsLookupError'
    this.reason = reason
  }
}

interface LyricsResponse {
  syncedLyrics?: string
  source?: string | null
  error?: LyricsError
  version?: string
}

export async function getSongLyrics(song: Song): Promise<LyricLine[]> {
  try {
    const { data } = await api.get<LyricsResponse>(`/lyrics/${encodeURIComponent(String(song.id))}`, {
      timeout: 25000
    })

    const synced = data?.syncedLyrics
    if (synced) return parseLrc(synced)
    throw new LyricsLookupError(data?.error || 'not_found')
  } catch (error) {
    if (axios.isAxiosError<LyricsResponse>(error)) {
      throw new LyricsLookupError(error.response?.data?.error || 'network')
    }
    if (error instanceof LyricsLookupError) throw error
    throw new LyricsLookupError('network')
  }
}
