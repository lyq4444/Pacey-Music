import fs from 'node:fs'
import fsp from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'
import { config } from './config.js'
import { MusicLibrary } from './library.js'
import { readLocalLyrics } from './local-lyrics.js'

const mimeTypes = {
  '.aac': 'audio/aac',
  '.avif': 'image/avif',
  '.flac': 'audio/flac',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.m4a': 'audio/mp4',
  '.m4s': 'audio/mp4',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.wav': 'audio/wav'
}

const library = new MusicLibrary(config.libraryDir)
await library.scan()

const server = http.createServer(async (req, res) => {
  try {
    setCors(res)

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    const url = new URL(req.url || '/', `http://${req.headers.host || `${config.host}:${config.port}`}`)

    if (req.method === 'GET' && url.pathname === '/api/health') {
      sendJson(res, { ok: true, count: library.getAll().length, libraryDir: config.libraryDir })
      return
    }

    if (req.method === 'GET' && url.pathname === '/api/library') {
      sendJson(res, { songs: publicSongs(library.getAll()) })
      return
    }

    if (req.method === 'GET' && url.pathname === '/api/search') {
      sendJson(res, { songs: publicSongs(library.search(url.searchParams.get('q'))) })
      return
    }

    if (req.method === 'POST' && url.pathname === '/api/rescan') {
      const songs = await library.scan()
      sendJson(res, { songs: publicSongs(songs), count: songs.length })
      return
    }

    if (req.method === 'GET' && url.pathname.startsWith('/api/stream/')) {
      await streamSong(req, res, decodeURIComponent(url.pathname.replace('/api/stream/', '')))
      return
    }

    if (req.method === 'GET' && url.pathname.startsWith('/api/cover/')) {
      await streamCover(res, decodeURIComponent(url.pathname.replace('/api/cover/', '')))
      return
    }

    if (req.method === 'GET' && url.pathname.startsWith('/api/lyrics/')) {
      await sendLyrics(res, decodeURIComponent(url.pathname.replace('/api/lyrics/', '')))
      return
    }

    sendJson(res, { error: 'Not found' }, 404)
  } catch (error) {
    sendJson(res, { error: error instanceof Error ? error.message : 'Server error' }, 500)
  }
})

server.listen(config.port, config.host, () => {
  console.log(`Pacey-music API listening at http://${config.host}:${config.port}`)
  console.log(`Music library: ${config.libraryDir}`)
  console.log(`Songs indexed: ${library.getAll().length}`)
})

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Range')
}

function sendJson(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(data))
}

function publicSongs(songs) {
  return songs.map(({ filePath, ...song }) => song)
}

async function streamSong(req, res, id) {
  const song = library.getById(id)
  if (!song) {
    sendJson(res, { error: 'Song not found' }, 404)
    return
  }

  const stat = await fsp.stat(song.filePath)
  const range = req.headers.range
  const contentType = mimeTypes[path.extname(song.filePath).toLowerCase()] || 'application/octet-stream'

  if (!range) {
    res.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type': contentType
    })
    fs.createReadStream(song.filePath).pipe(res)
    return
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range)
  if (!match) {
    res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` })
    res.end()
    return
  }

  const start = match[1] ? Number(match[1]) : 0
  const end = match[2] ? Number(match[2]) : stat.size - 1

  if (start >= stat.size || end >= stat.size || start > end) {
    res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` })
    res.end()
    return
  }

  res.writeHead(206, {
    'Accept-Ranges': 'bytes',
    'Content-Length': end - start + 1,
    'Content-Range': `bytes ${start}-${end}/${stat.size}`,
    'Content-Type': contentType
  })
  fs.createReadStream(song.filePath, { start, end }).pipe(res)
}

async function streamCover(res, id) {
  const coverPath = library.getCoverById(id)
  if (!coverPath) {
    sendJson(res, { error: 'Cover not found' }, 404)
    return
  }

  const stat = await fsp.stat(coverPath)
  const contentType = mimeTypes[path.extname(coverPath).toLowerCase()] || 'application/octet-stream'
  res.writeHead(200, {
    'Content-Length': stat.size,
    'Content-Type': contentType
  })
  fs.createReadStream(coverPath).pipe(res)
}

async function sendLyrics(res, id) {
  const song = library.getById(id)
  if (!song) {
    sendJson(res, { error: 'Song not found' }, 404)
    return
  }

  const result = await readLocalLyrics(song.filePath)
  if (!result.syncedLyrics) {
    const status = result.error === 'invalid' ? 422 : result.error === 'unaligned' ? 409 : 404
    sendJson(res, result, status)
    return
  }

  sendJson(res, result)
}
