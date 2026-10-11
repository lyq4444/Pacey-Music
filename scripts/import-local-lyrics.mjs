import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { MusicLibrary } from '../server/library.js'
import { findOnlineLyrics } from '../server/lyrics-provider.js'
import { getLyricsPath, readLocalLyrics } from '../server/local-lyrics.js'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const libraryDir = path.join(rootDir, 'library', 'audio')
const reportPath = path.join(rootDir, 'library', 'lyrics-import-report.json')
const force = process.argv.includes('--force')

const library = new MusicLibrary(libraryDir)
const songs = await library.scan()
const report = []

for (const [index, song] of songs.entries()) {
  const relativePath = song.relativePath.split(path.sep).join('/')
  const lyricsPath = getLyricsPath(song.filePath)
  const existing = await readLocalLyrics(song.filePath)

  if (!force && existing.syncedLyrics) {
    report.push(reportEntry(song, relativePath, 'skipped', { source: 'local' }))
    console.log(`[${index + 1}/${songs.length}] skipped ${relativePath}`)
    continue
  }

  const result = await findLyricsWithRetry(song)
  if (!result.syncedLyrics) {
    report.push(reportEntry(song, relativePath, 'failed', { error: result.error || 'not_found' }))
    console.warn(`[${index + 1}/${songs.length}] failed ${relativePath}: ${result.error || 'not_found'}`)
    continue
  }

  const syncedLyrics = result.syncedLyrics
  await fs.writeFile(lyricsPath, `${syncedLyrics.trim()}\n`, 'utf8')
  report.push(reportEntry(song, relativePath, 'imported', {
    source: result.source,
    providerId: result.providerId
  }))
  console.log(`[${index + 1}/${songs.length}] imported ${relativePath} from ${result.source}`)
}

const summary = {
  total: report.length,
  imported: report.filter((entry) => entry.status === 'imported').length,
  skipped: report.filter((entry) => entry.status === 'skipped').length,
  failed: report.filter((entry) => entry.status === 'failed').length
}
await fs.writeFile(reportPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), summary, songs: report }, null, 2)}\n`, 'utf8')
console.log(JSON.stringify(summary))

async function findLyricsWithRetry(song) {
  const first = await findOnlineLyrics(song)
  if (first.error !== 'network') return first
  return findOnlineLyrics(song)
}

function reportEntry(song, relativePath, status, details = {}) {
  return {
    title: song.title,
    artist: song.artists[0]?.name || '',
    album: song.album,
    relativePath,
    duration: song.duration,
    status,
    ...details
  }
}
