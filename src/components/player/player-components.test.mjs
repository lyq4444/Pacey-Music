import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const componentDir = new URL('./', import.meta.url)

async function source(name) {
  return readFile(new URL(name, componentDir), 'utf8')
}

test('PlayerControls exposes accessible transport actions', async () => {
  const content = await source('PlayerControls.vue')
  assert.match(content, /aria-label="上一首"/)
  assert.match(content, /:aria-label="isPlaying \? '暂停' : '播放'"/)
  assert.match(content, /aria-label="下一首"/)
  assert.match(content, /emit\('previous'\)/)
  assert.match(content, /emit\('toggle'\)/)
  assert.match(content, /emit\('next'\)/)
  assert.match(content, /:disabled="disabled"/)
})

test('PlayerProgress uses a semantic range and emits numeric seek values', async () => {
  const content = await source('PlayerProgress.vue')
  assert.match(content, /type="range"/)
  assert.match(content, /aria-label="播放进度"/)
  assert.match(content, /emit\('seek', value\)/)
  assert.match(content, /formatPlayerTime/)
})

test('VolumeControl uses a compact accessible volume range with a mute action', async () => {
  const content = await source('VolumeControl.vue')
  assert.match(content, /volume-control--compact/)
  assert.match(content, /role="group" aria-label="音量"/)
  assert.match(content, /type="range"/)
  assert.match(content, /aria-label="音量"/)
  assert.match(content, /@input="onInput"/)
  assert.match(content, /emit\('toggle-mute'\)/)
  assert.match(content, /emit\('volume-change', value\)/)
})

test('volume slider stays inside a fixed-width pill and has no expanding styles', async () => {
  const styles = await source('../../styles.css')
  assert.match(styles, /\.volume-control__range\s*\{[^}]*width:\s*68px/s)
  assert.match(styles, /\.volume-control__range::-webkit-slider-thumb[\s\S]*?width:\s*0/)
  assert.doesNotMatch(styles, /volume-control__reveal|volume-control__step/)
})
