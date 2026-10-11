import test from 'node:test'
import assert from 'node:assert/strict'
import { findOnlineLyrics } from './lyrics-provider.js'

const song = {
  title: '烟花易冷',
  artists: [{ name: '周杰伦' }],
  album: '跨时代',
  duration: 273
}

test('findOnlineLyrics returns synced lyrics from LRCLIB search first', async () => {
  const calls = []
  const fetchFn = async (url) => {
    calls.push(String(url))
    return jsonResponse([
      {
        syncedLyrics: '[00:01.00]first line',
        id: 1,
        duration: 273
      }
    ])
  }

  const result = await findOnlineLyrics(song, { fetchFn })

  assert.equal(result.source, 'lrclib')
  assert.equal(result.syncedLyrics, '[00:01.00]first line')
  assert.equal(calls.length, 1)
  assert.match(calls[0], /lrclib\.net\/api\/search/)
})

test('findOnlineLyrics falls back to NetEase search and lyric lookup', async () => {
  const calls = []
  const fetchFn = async (url) => {
    calls.push(String(url))

    if (String(url).includes('lrclib.net')) {
      return jsonResponse({ message: 'not found' }, 404)
    }

    if (String(url).includes('/api/search/get/web')) {
      return jsonResponse({
        result: {
          songs: [
            {
              id: 1888,
              name: '烟花易冷',
              artists: [{ name: '周杰伦' }],
              duration: 273000
            }
          ]
        }
      })
    }

    return jsonResponse({
      lrc: { lyric: '[00:02.50]netease line' }
    })
  }

  const result = await findOnlineLyrics(song, { fetchFn })

  assert.equal(result.source, 'netease')
  assert.equal(result.syncedLyrics, '[00:02.50]netease line')
  assert.equal(calls.some((url) => url.includes('/api/search/get/web')), true)
  assert.equal(calls.some((url) => url.includes('/api/song/lyric')), true)
})

test('findOnlineLyrics chooses the NetEase candidate closest to album and duration', async () => {
  const calls = []
  const fetchFn = async (url) => {
    calls.push(String(url))
    if (String(url).includes('lrclib.net')) return jsonResponse({}, 404)
    if (String(url).includes('/api/search/get/web')) {
      return jsonResponse({
        result: {
          songs: [
            {
              id: 1,
              name: '烟花易冷',
              artists: [{ name: '周杰伦' }],
              album: { name: '演唱会' },
              duration: 310000
            },
            {
              id: 2,
              name: '烟花易冷',
              artists: [{ name: '周杰伦' }],
              album: { name: '跨时代' },
              duration: 273000
            }
          ]
        }
      })
    }
    return jsonResponse({ lrc: { lyric: '[00:02.50]matched line' } })
  }

  const result = await findOnlineLyrics(song, { fetchFn })

  assert.equal(result.providerId, 2)
  assert.equal(calls.some((url) => url.includes('id=2')), true)
})

test('findOnlineLyrics uses LRCLIB exact lookup with the local duration after empty search', async () => {
  const calls = []
  const fetchFn = async (url) => {
    calls.push(String(url))
    if (String(url).includes('/api/search')) return jsonResponse([])
    if (String(url).includes('duration=')) return jsonResponse({ syncedLyrics: '[00:04.00]exact line', id: 2, duration: 273 })
    return jsonResponse({ message: 'not found' }, 404)
  }

  const result = await findOnlineLyrics(song, { fetchFn })

  assert.equal(result.source, 'lrclib')
  assert.equal(result.syncedLyrics, '[00:04.00]exact line')
  assert.equal(calls.length, 2)
  assert.match(calls[0], /lrclib\.net\/api\/search/)
  assert.match(calls[1], /lrclib\.net\/api\/get/)
  assert.equal(calls[1].includes('duration='), true)
})

test('findOnlineLyrics prefers the closest LRCLIB search candidate', async () => {
  const calls = []
  const fetchFn = async (url) => {
    calls.push(String(url))
    if (!String(url).includes('/api/search')) return jsonResponse({ message: 'not found' }, 404)

    return jsonResponse([
      {
        id: 18413,
        syncedLyrics: '[00:01.00]wrong version',
        name: '自导自演',
        artistName: '周杰伦',
        albumName: '周杰伦 单曲合集',
        duration: 256
      },
      {
        id: 10250025,
        syncedLyrics: '[00:02.00]right version',
        name: '自导自演',
        artistName: '周杰伦',
        albumName: '跨时代',
        duration: 255
      }
    ])
  }

  const result = await findOnlineLyrics(
    {
      title: '自导自演',
      artists: [{ name: '周杰伦' }],
      album: '跨时代',
      duration: 255
    },
    { fetchFn }
  )

  assert.equal(result.source, 'lrclib')
  assert.equal(result.syncedLyrics, '[00:02.00]right version')
  assert.equal(result.providerId, 10250025)
  assert.equal(calls.length, 1)
})

test('findOnlineLyrics reports not_found when no provider returns synced lyrics', async () => {
  const fetchFn = async (url) => {
    if (String(url).includes('/api/search/get/web')) return jsonResponse({ result: { songs: [] } })
    return jsonResponse({}, 404)
  }

  const result = await findOnlineLyrics(song, { fetchFn })

  assert.equal(result.source, null)
  assert.equal(result.syncedLyrics, '')
  assert.equal(result.error, 'not_found')
})

test('findOnlineLyrics accepts a provider track within one second of the local audio', async () => {
  const fetchFn = async (url) => {
    if (String(url).includes('/api/search')) {
      return jsonResponse([{
        id: 20,
        name: '烟花易冷',
        artistName: '周杰伦',
        albumName: '跨时代',
        duration: 272.1,
        syncedLyrics: '[00:01.00]matched'
      }])
    }
    return jsonResponse({}, 404)
  }

  const result = await findOnlineLyrics(song, { fetchFn })

  assert.equal(result.source, 'lrclib')
  assert.equal(result.providerDuration, 272.1)
  assert.equal(result.durationDelta, 0.9)
})

test('findOnlineLyrics rejects provider tracks more than one second from the local audio', async () => {
  const fetchFn = async (url) => {
    if (String(url).includes('/api/search')) {
      return jsonResponse([{
        id: 21,
        name: '烟花易冷',
        artistName: '周杰伦',
        albumName: '跨时代',
        duration: 274.01,
        syncedLyrics: '[00:01.00]wrong version'
      }])
    }
    if (String(url).includes('lrclib.net')) return jsonResponse({}, 404)
    if (String(url).includes('/api/search/get/web')) return jsonResponse({ result: { songs: [] } })
    return jsonResponse({}, 404)
  }

  const result = await findOnlineLyrics(song, { fetchFn })

  assert.equal(result.source, null)
  assert.equal(result.syncedLyrics, '')
  assert.equal(result.error, 'duration_mismatch')
})

test('findOnlineLyrics uses fallback JSON loader when fetch fails', async () => {
  const fetchFn = async () => {
    throw new Error('fetch failed')
  }
  const fallbackJson = async () => ({
    ok: true,
    data: {
      syncedLyrics: '[00:03.00]fallback line',
      id: 99,
      duration: 273
    }
  })

  const result = await findOnlineLyrics(song, { fetchFn, fallbackJson })

  assert.equal(result.source, 'lrclib')
  assert.equal(result.syncedLyrics, '[00:03.00]fallback line')
})

function jsonResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return data
    }
  }
}
