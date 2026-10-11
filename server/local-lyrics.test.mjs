import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { getLyricsPath, readLocalLyrics } from './local-lyrics.js'

test('getLyricsPath replaces the audio extension with lrc', () => {
  assert.equal(getLyricsPath(path.join('album', 'song.m4a')), path.join('album', 'song.lrc'))
})

test('readLocalLyrics returns timestamped sidecar lyrics', async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pacey-lyrics-'))
  t.after(() => fs.rm(dir, { recursive: true, force: true }))
  const audioPath = path.join(dir, 'song.m4a')
  await fs.writeFile(audioPath, '')
  await fs.writeFile(getLyricsPath(audioPath), '[00:01.00]first line\n', 'utf8')

  const syncedLyrics = '[00:01.00]first line\n'
  assert.deepEqual(await readLocalLyrics(audioPath), {
    source: 'local',
    syncedLyrics,
    version: crypto.createHash('sha256').update(syncedLyrics).digest('hex').slice(0, 16)
  })
})

test('readLocalLyrics reports missing and invalid sidecars', async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pacey-lyrics-'))
  t.after(() => fs.rm(dir, { recursive: true, force: true }))
  const audioPath = path.join(dir, 'song.m4a')
  await fs.writeFile(audioPath, '')

  assert.deepEqual(await readLocalLyrics(audioPath), {
    source: null,
    syncedLyrics: '',
    error: 'not_found'
  })

  await fs.writeFile(path.join(dir, 'song.lyrics.txt'), 'first line\n', 'utf8')
  assert.deepEqual(await readLocalLyrics(audioPath), {
    source: null,
    syncedLyrics: '',
    error: 'unaligned'
  })

  await fs.writeFile(getLyricsPath(audioPath), 'plain lyrics without timestamps', 'utf8')
  assert.deepEqual(await readLocalLyrics(audioPath), {
    source: null,
    syncedLyrics: '',
    error: 'invalid'
  })
})
