import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

const timestampPattern = /\[\d{1,2}:\d{2}(?:[.:]\d{1,3})?\]/

export function getLyricsPath(audioPath) {
  const extension = path.extname(audioPath)
  return `${audioPath.slice(0, -extension.length)}.lrc`
}

export function getLyricsTextPath(audioPath) {
  const extension = path.extname(audioPath)
  return `${audioPath.slice(0, -extension.length)}.lyrics.txt`
}

export async function readLocalLyrics(audioPath) {
  try {
    const syncedLyrics = await fs.readFile(getLyricsPath(audioPath), 'utf8')
    if (!timestampPattern.test(syncedLyrics)) {
      return { source: null, syncedLyrics: '', error: 'invalid' }
    }
    const version = crypto.createHash('sha256').update(syncedLyrics).digest('hex').slice(0, 16)
    return { source: 'local', syncedLyrics, version }
  } catch (error) {
    if (error?.code === 'ENOENT') {
      try {
        await fs.access(getLyricsTextPath(audioPath))
        return { source: null, syncedLyrics: '', error: 'unaligned' }
      } catch (textError) {
        if (textError?.code !== 'ENOENT') throw textError
      }
      return { source: null, syncedLyrics: '', error: 'not_found' }
    }
    throw error
  }
}
