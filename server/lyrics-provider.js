import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const lrclibBase = 'https://lrclib.net/api'
const neteaseBase = 'https://music.163.com/api'
const defaultTimeoutMs = 8000
const durationToleranceSeconds = 1
const execFileAsync = promisify(execFile)

export async function findOnlineLyrics(song, options = {}) {
  const fetchFn = options.fetchFn || globalThis.fetch
  const fallbackJson = options.fallbackJson || readJsonWithCurl
  const timeoutMs = options.timeoutMs || defaultTimeoutMs

  const lrclib = await getLrclibLyrics(song, fetchFn, fallbackJson, timeoutMs)
  if (lrclib.syncedLyrics) return lrclib

  const netease = await getNeteaseLyrics(song, fetchFn, fallbackJson, timeoutMs)
  if (netease.syncedLyrics) return netease

  return {
    source: null,
    syncedLyrics: '',
    error: lrclib.error === 'network' && netease.error === 'network'
      ? 'network'
      : lrclib.error === 'duration_mismatch' || netease.error === 'duration_mismatch'
        ? 'duration_mismatch'
        : 'not_found'
  }
}

async function getLrclibLyrics(song, fetchFn, fallbackJson, timeoutMs) {
  const artistName = getArtistName(song)
  const searchUrl = createUrl(`${lrclibBase}/search`, {
    track_name: song.title,
    artist_name: artistName
  })
  const search = await readJson(searchUrl, fetchFn, fallbackJson, timeoutMs)
  const match = pickLrclibSearchMatch(search.data, song)

  if (match?.syncedLyrics) {
    return durationMatchedResult('lrclib', match, song.duration)
  }

  const exactUrl = createUrl(`${lrclibBase}/get`, {
    track_name: song.title,
    artist_name: artistName,
    album_name: song.album,
    duration: song.duration || undefined
  })

  const exact = await readJson(exactUrl, fetchFn, fallbackJson, timeoutMs)
  if (exact.ok && exact.data?.syncedLyrics && isDurationMatch(exact.data.duration, song.duration)) {
    return durationMatchedResult('lrclib', exact.data, song.duration)
  }

  const hadTimedCandidate = Array.isArray(search.data)
    && search.data.some((item) => item?.syncedLyrics && Number.isFinite(Number(item?.duration)))
  return {
    source: null,
    syncedLyrics: '',
    error: hadTimedCandidate || (exact.ok && exact.data?.syncedLyrics) ? 'duration_mismatch' : exact.error || search.error || 'not_found'
  }
}

async function getNeteaseLyrics(song, fetchFn, fallbackJson, timeoutMs) {
  const keyword = `${song.title} ${getArtistName(song)}`.trim()
  const searchUrl = createUrl(`${neteaseBase}/search/get/web`, {
    s: keyword,
    type: 1,
    limit: 5,
    offset: 0
  })

  const search = await readJson(searchUrl, fetchFn, fallbackJson, timeoutMs)
  if (!search.ok) return { source: null, syncedLyrics: '', error: search.error || 'not_found' }

  const candidates = search.data?.result?.songs
  if (!Array.isArray(candidates) || !candidates.length) {
    return { source: null, syncedLyrics: '', error: 'not_found' }
  }

  const candidate = chooseNeteaseSong(candidates, song)
  if (!candidate) return { source: null, syncedLyrics: '', error: 'duration_mismatch' }

  const lyricUrl = createUrl(`${neteaseBase}/song/lyric`, {
    id: candidate.id,
    lv: 1,
    kv: 1,
    tv: -1
  })
  const lyric = await readJson(lyricUrl, fetchFn, fallbackJson, timeoutMs)
  const text = lyric.data?.lrc?.lyric || lyric.data?.klyric?.lyric

  if (lyric.ok && text) {
    return {
      source: 'netease',
      syncedLyrics: text,
      providerId: candidate.id,
      providerDuration: candidate.duration,
      durationDelta: roundedDurationDelta(candidate.duration, song.duration)
    }
  }

  return { source: null, syncedLyrics: '', error: lyric.error || 'not_found' }
}

function chooseNeteaseSong(candidates, song) {
  const title = normalizeText(song.title)
  const album = normalizeText(song.album)
  const artist = normalizeText(getArtistName(song))
  const targetDuration = Number.isFinite(Number(song.duration)) ? Number(song.duration) : null

  const match = [...candidates]
    .map((item) => {
      const itemTitle = normalizeText(item?.name)
      const itemAlbum = normalizeText(item?.album?.name || item?.albumName)
      const itemArtists = Array.isArray(item?.artists)
        ? item.artists.map((entry) => normalizeText(entry?.name))
        : []
      const rawDuration = Number(item?.duration ?? item?.dt)
      const itemDuration = rawDuration > 10000 ? rawDuration / 1000 : rawDuration
      return {
        item,
        duration: itemDuration,
        score:
          (itemTitle === title ? 12 : 0)
          + (artist && itemArtists.some((name) => name.includes(artist) || artist.includes(name)) ? 6 : 0)
          + (album && itemAlbum.includes(album) ? 4 : 0)
          + durationScore(itemDuration, targetDuration)
      }
    })
    .filter((entry) => isDurationMatch(entry.duration, targetDuration))
    .sort((left, right) => right.score - left.score)[0]
  return match ? { ...match.item, duration: match.duration } : null
}

function pickLrclibSearchMatch(items, song) {
  if (!Array.isArray(items) || !items.length) return null

  const title = normalizeText(song.title)
  const album = normalizeText(song.album)
  const artist = normalizeText(getArtistName(song))
  const targetDuration = Number.isFinite(Number(song.duration)) ? Number(song.duration) : null

  return [...items]
    .filter((item) => item?.syncedLyrics && isDurationMatch(item?.duration, targetDuration))
    .map((item) => ({
      item,
      score:
        (normalizeText(item?.name) === title ? 8 : 0) +
        (album && normalizeText(item?.albumName).includes(album) ? 4 : 0) +
        (artist && normalizeText(item?.artistName).includes(artist) ? 2 : 0) +
        durationScore(item?.duration, targetDuration)
    }))
    .sort((left, right) => right.score - left.score)
    .map((entry) => entry.item)[0] || null
}

function isDurationMatch(candidateDuration, targetDuration) {
  const candidate = Number(candidateDuration)
  const target = Number(targetDuration)
  return Number.isFinite(candidate)
    && candidate > 0
    && Number.isFinite(target)
    && target > 0
    && Math.abs(candidate - target) <= durationToleranceSeconds
}

function roundedDurationDelta(candidateDuration, targetDuration) {
  return Number(Math.abs(Number(candidateDuration) - Number(targetDuration)).toFixed(3))
}

function durationMatchedResult(source, item, targetDuration) {
  return {
    source,
    syncedLyrics: item.syncedLyrics,
    providerId: item.id,
    providerDuration: Number(item.duration),
    durationDelta: roundedDurationDelta(item.duration, targetDuration)
  }
}

function durationScore(candidateDuration, targetDuration) {
  if (!Number.isFinite(targetDuration)) return 0
  const candidate = Number(candidateDuration)
  if (!Number.isFinite(candidate) || candidate <= 0) return 0
  const delta = Math.abs(candidate - targetDuration)
  return Math.max(0, 12 - Math.round(delta))
}

async function readJson(url, fetchFn, fallbackJson, timeoutMs) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timeout = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null

  try {
    const response = await fetchFn(url, {
      headers: {
        Accept: 'application/json',
        Referer: 'https://music.163.com/',
        'User-Agent': 'Pacey-music/0.1'
      },
      signal: controller?.signal
    })

    const data = await response.json().catch(() => null)
    return response.ok ? { ok: true, data } : { ok: false, data, error: 'not_found' }
  } catch {
    if (fallbackJson) return fallbackJson(url, timeoutMs)
    return { ok: false, data: null, error: 'network' }
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

async function readJsonWithCurl(url, timeoutMs) {
  try {
    const seconds = Math.max(1, Math.ceil(timeoutMs / 1000))
    const command = process.platform === 'win32' ? 'powershell.exe' : 'curl'
    const args = process.platform === 'win32'
      ? [
          '-NoProfile',
          '-Command',
          'param($seconds,$url) & curl.exe -s --max-time $seconds -H "Accept: application/json" -H "Referer: https://music.163.com/" -H "User-Agent: Pacey-music/0.1" $url',
          String(seconds),
          String(url)
        ]
      : [
          '-s',
          '--max-time',
          String(seconds),
          '-H',
          'Accept: application/json',
          '-H',
          'Referer: https://music.163.com/',
          '-H',
          'User-Agent: Pacey-music/0.1',
          String(url)
        ]
    const { stdout } = await execFileAsync(command, args, {
      timeout: timeoutMs + 2000,
      windowsHide: true,
      maxBuffer: 1024 * 1024 * 8,
      env: normalizeProcessEnv()
    })

    if (!stdout.trim()) return { ok: false, data: null, error: 'network' }
    return { ok: true, data: JSON.parse(stdout) }
  } catch {
    return { ok: false, data: null, error: 'network' }
  }
}

function createUrl(base, params) {
  const url = new URL(base)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  }
  return url
}

function getArtistName(song) {
  return song.artists?.[0]?.name || song.albumArtist || ''
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '')
}

function normalizeProcessEnv() {
  const env = { ...process.env }
  if (process.platform === 'win32' && env.Path && env.PATH) delete env.PATH
  return env
}
