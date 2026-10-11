import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('../../../', import.meta.url)

async function source(path) {
  return readFile(new URL(path, root), 'utf8')
}

test('MiniPlayer only renders playback controls when a song is selected', async () => {
  const content = await source('src/components/MiniPlayer.vue')
  assert.match(content, /PlayerControls/)
  assert.match(content, /PlayerProgress/)
  assert.match(content, /VolumeControl/)
  assert.match(content, /compact/)
  assert.match(content, /@seek="seek"/)
  assert.doesNotMatch(content, /PlayerVeilCanvas/)
  assert.match(content, /<section v-if="player\.currentSong" class="mini-player">/)
  assert.doesNotMatch(content, /mini-player--idle/)
  assert.doesNotMatch(content, /选择一首歌开始播放/)
})

test('mini player is constrained to a compact desktop width', async () => {
  const content = await source('src/styles.css')
  const miniRule = content.match(/\.mini-player\s*\{[^}]+\}/s)?.[0] ?? ''
  assert.match(miniRule, /max-width:\s*680px/)
  assert.match(miniRule, /min-height:\s*76px/)
})

test('responsive full player keeps lyrics visible in short viewports', async () => {
  const content = await source('src/styles.css')
  assert.match(content, /grid-template-columns:\s*minmax\(180px, 0\.72fr\) minmax\(0, 1fr\)/)
  assert.match(content, /@media \(max-width: 460px\)[\s\S]+?\.disc-wrap\s*\{[\s\S]*?display:\s*none/s)
})

test('PlayerSheet uses labeled header actions and the shared control deck', async () => {
  const content = await source('src/components/PlayerSheet.vue')
  assert.match(content, /aria-label="收起播放器"/)
  assert.match(content, /<strong>播放队列<\/strong>/)
  assert.match(content, /sheet-control-deck/)
  assert.match(content, /PlayerControls/)
  assert.match(content, /PlayerProgress/)
  assert.match(content, /VolumeControl/)
})

test('queue drawer uses a compact close action and a themed scrollbar', async () => {
  const component = await source('src/components/PlayerSheet.vue')
  const styles = await source('src/styles.css')
  assert.match(component, /class="icon-button light sheet-queue__close"/)
  assert.match(styles, /\.sheet-queue__close\s*\{[^}]*width:\s*38px/s)
  assert.match(styles, /\.sheet-queue__list::-webkit-scrollbar-thumb/)
  assert.match(styles, /scrollbar-color:\s*rgba\(255, 250, 242, 0\.28\) transparent/)
})

test('application shell no longer mounts animated canvas backgrounds', async () => {
  const content = await source('src/components/AppShell.vue')
  assert.doesNotMatch(content, /RainSurfaceBackground/)
  assert.doesNotMatch(content, /<canvas/)
})
