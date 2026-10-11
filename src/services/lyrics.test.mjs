import test from 'node:test'
import assert from 'node:assert/strict'
import { findActiveLyricIndex, parseLrc } from './lyrics-core.js'

test('parseLrc converts timestamped LRC lines into sorted lyric rows', () => {
  const rows = parseLrc(`
[ti:Sample]
[00:08.50]second line
[00:01.00][00:04.25]shared line
[00:01.00]replacement at same time
plain text without timestamp
`)

  assert.deepEqual(rows, [
    { time: 1, text: 'shared line / replacement at same time' },
    { time: 4.25, text: 'shared line' },
    { time: 8.5, text: 'second line' }
  ])
})

test('findActiveLyricIndex returns the line active at the current playback time', () => {
  const rows = [
    { time: 1, text: 'first' },
    { time: 4.25, text: 'second' },
    { time: 8.5, text: 'third' }
  ]

  assert.equal(findActiveLyricIndex(rows, 0.5), -1)
  assert.equal(findActiveLyricIndex(rows, 1), 0)
  assert.equal(findActiveLyricIndex(rows, 7.99), 1)
  assert.equal(findActiveLyricIndex(rows, 12), 2)
})
