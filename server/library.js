import crypto from 'node:crypto'
import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { readLocalLyrics } from './local-lyrics.js'

const audioExtensions = new Set(['.mp3', '.flac', '.m4a', '.m4s', '.aac', '.wav', '.ogg'])
const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif'])
const preferredCoverNames = ['cover', 'folder', 'front', 'album']
const defaultArtist = '\u672c\u5730\u97f3\u4e50'
const defaultAlbum = '\u672c\u5730\u66f2\u5e93'
const execFileAsync = promisify(execFile)

export class MusicLibrary {
  constructor(libraryDir) {
    this.libraryDir = libraryDir
    this.songs = []
    this.songMap = new Map()
    this.coverMap = new Map()
  }

  async ensureLibraryDir() {
    await fs.mkdir(this.libraryDir, { recursive: true })
  }

  async scan() {
    await this.ensureLibraryDir()
    const media = await walkMediaFiles(this.libraryDir)
    const coverByDir = createCoverIndex(media.images, this.libraryDir)
    const albumByDir = await createAlbumIndex(media.manifests, this.libraryDir)

    this.coverMap = new Map()
    this.songs = (await Promise.all(media.audio
      .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))
      .map((filePath) => createSong(filePath, this.libraryDir, coverByDir, albumByDir, this.coverMap))))
      .sort(compareSongs)
    this.songMap = new Map(this.songs.map((song) => [song.id, song]))
    return this.songs
  }

  getAll() {
    return this.songs
  }

  search(keyword) {
    const normalized = String(keyword || '').trim().toLowerCase()
    if (!normalized) return this.songs

    return this.songs.filter((song) => {
      const haystack = `${song.title} ${song.album} ${song.artists.map((artist) => artist.name).join(' ')}`
      return haystack.toLowerCase().includes(normalized)
    })
  }

  getById(id) {
    return this.songMap.get(id)
  }

  getCoverById(id) {
    return this.coverMap.get(id)
  }
}

function compareSongs(a, b) {
  return a.album.localeCompare(b.album, 'zh-Hans-CN')
    || compareOptionalNumber(a.trackNumber, b.trackNumber)
    || a.title.localeCompare(b.title, 'zh-Hans-CN')
}

function compareOptionalNumber(a, b) {
  const left = Number.isFinite(Number(a)) ? Number(a) : Number.POSITIVE_INFINITY
  const right = Number.isFinite(Number(b)) ? Number(b) : Number.POSITIVE_INFINITY
  return left - right
}

async function walkMediaFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const media = { audio: [], images: [], manifests: [] }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const nested = await walkMediaFiles(fullPath)
      media.audio.push(...nested.audio)
      media.images.push(...nested.images)
      media.manifests.push(...nested.manifests)
      continue
    }

    if (!entry.isFile()) continue

    const extension = path.extname(entry.name).toLowerCase()
    if (audioExtensions.has(extension)) media.audio.push(fullPath)
    if (imageExtensions.has(extension)) media.images.push(fullPath)
    if (entry.name.toLowerCase() === 'album.json') media.manifests.push(fullPath)
  }

  return media
}

async function createAlbumIndex(manifestFiles, libraryDir) {
  const albumsByDir = new Map()

  for (const filePath of manifestFiles) {
    try {
      const raw = await fs.readFile(filePath, 'utf8')
      const manifest = JSON.parse(raw)
      const relativeDir = path.dirname(path.relative(libraryDir, filePath))
      albumsByDir.set(relativeDir, normalizeAlbumManifest(manifest))
    } catch {
      // Invalid album manifests are ignored so one bad file does not break the library.
    }
  }

  return albumsByDir
}

function normalizeAlbumManifest(manifest) {
  const tracks = new Map()
  const rawTracks = Array.isArray(manifest?.tracks) ? manifest.tracks : []

  for (const track of rawTracks) {
    if (!track?.file) continue
    tracks.set(String(track.file), {
      title: track.title ? String(track.title) : undefined,
      artist: track.artist ? String(track.artist) : undefined,
      trackNumber: Number.isFinite(Number(track.trackNumber)) ? Number(track.trackNumber) : undefined
    })
  }

  return {
    album: manifest?.album || manifest?.title || manifest?.name,
    albumArtist: manifest?.albumArtist || manifest?.artist,
    year: Number.isFinite(Number(manifest?.year)) ? Number(manifest.year) : undefined,
    tracks
  }
}

function createCoverIndex(imageFiles, libraryDir) {
  const coversByDir = new Map()

  for (const filePath of imageFiles.sort(compareCoverPriority)) {
    const relativeDir = path.dirname(path.relative(libraryDir, filePath))
    if (!coversByDir.has(relativeDir)) coversByDir.set(relativeDir, filePath)
  }

  return coversByDir
}

function compareCoverPriority(a, b) {
  return getCoverPriority(a) - getCoverPriority(b) || a.localeCompare(b, 'zh-Hans-CN')
}

function getCoverPriority(filePath) {
  const name = path.basename(filePath, path.extname(filePath)).toLowerCase()
  const index = preferredCoverNames.indexOf(name)
  return index === -1 ? preferredCoverNames.length : index
}

async function createSong(filePath, libraryDir, coverByDir, albumByDir, coverMap) {
  const relativePath = path.relative(libraryDir, filePath)
  const parsed = parseFileName(path.basename(filePath))
  const relativeDir = path.dirname(relativePath)
  const albumInfo = albumByDir.get(relativeDir)
  const trackInfo = albumInfo?.tracks.get(path.basename(filePath))
  const album = albumInfo?.album || getAlbumFromRelativePath(relativePath)
  const id = crypto.createHash('sha1').update(relativePath).digest('hex').slice(0, 16)
  const coverPath = getCoverForSong(relativePath, coverByDir)
  const duration = await readAudioDuration(filePath)
  const lyrics = await readLocalLyrics(filePath)

  return {
    id,
    title: trackInfo?.title || parsed.title,
    artists: [{ id: -1, name: trackInfo?.artist || albumInfo?.albumArtist || parsed.artist }],
    album,
    albumArtist: albumInfo?.albumArtist,
    year: albumInfo?.year,
    trackNumber: trackInfo?.trackNumber,
    coverUrl: createCoverUrl(coverPath, libraryDir, coverMap),
    audioUrl: `/api/stream/${id}`,
    duration,
    lyricsVersion: lyrics.version,
    source: 'local',
    fileName: path.basename(filePath),
    relativePath,
    filePath
  }
}

async function readAudioDuration(filePath) {
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      filePath
    ], {
      timeout: 8000,
      windowsHide: true
    })
    const duration = Number(stdout.trim())
    return Number.isFinite(duration) && duration > 0 ? Math.round(duration) : 0
  } catch {
    return 0
  }
}

function getCoverForSong(relativePath, coverByDir) {
  const relativeDir = path.dirname(relativePath)
  return coverByDir.get(relativeDir) || coverByDir.get('.') || null
}

function createCoverUrl(coverPath, libraryDir, coverMap) {
  if (!coverPath) return '/art/default-cover.svg'

  const relativePath = path.relative(libraryDir, coverPath)
  const id = crypto.createHash('sha1').update(relativePath).digest('hex').slice(0, 16)
  coverMap.set(id, coverPath)
  return `/api/cover/${id}`
}

function parseFileName(fileName) {
  const name = stripTrackNumber(fileName.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').trim())
  const parts = name.split(/\s*(?:-|\u2013|\u2014)\s*/).map((part) => part.trim()).filter(Boolean)

  if (parts.length >= 2 && !isTrackNumber(parts[0])) {
    return {
      artist: parts.slice(0, -1).join(' / '),
      title: parts[parts.length - 1] || name
    }
  }

  return {
    artist: defaultArtist,
    title: parts[parts.length - 1] || name || '\u672a\u547d\u540d\u6b4c\u66f2'
  }
}

function stripTrackNumber(name) {
  return name.replace(/^\s*(?:disc\s*)?\d{1,3}\s*[._-]\s*/i, '').trim()
}

function isTrackNumber(value) {
  return /^\d{1,3}$/.test(value.trim())
}

function getAlbumFromRelativePath(relativePath) {
  const dirName = path.dirname(relativePath)
  if (!dirName || dirName === '.') return defaultAlbum
  return dirName.split(path.sep).filter(Boolean).join(' / ')
}
