import { fileURLToPath } from 'node:url'
import path from 'node:path'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export const config = {
  rootDir,
  host: process.env.PACEY_MUSIC_API_HOST || '127.0.0.1',
  port: Number(process.env.PACEY_MUSIC_API_PORT || 8787),
  libraryDir: path.resolve(
    process.env.MUSIC_LIBRARY_DIR || path.join(rootDir, 'library', 'audio')
  )
}
