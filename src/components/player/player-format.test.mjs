import test from 'node:test'
import assert from 'node:assert/strict'

import { clampProgress, formatPlayerTime } from './player-format.ts'

test('formatPlayerTime formats finite seconds as m:ss', () => {
  assert.equal(formatPlayerTime(72), '1:12')
  assert.equal(formatPlayerTime(0), '0:00')
})

test('formatPlayerTime treats invalid and negative values as zero', () => {
  assert.equal(formatPlayerTime(Number.NaN), '0:00')
  assert.equal(formatPlayerTime(-8), '0:00')
})

test('clampProgress returns a value between zero and one', () => {
  assert.equal(clampProgress(-0.2), 0)
  assert.equal(clampProgress(0.45), 0.45)
  assert.equal(clampProgress(1.4), 1)
  assert.equal(clampProgress(Number.NaN), 0)
})
