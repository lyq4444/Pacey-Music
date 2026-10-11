# Pacey Music

A local-first music library and player built with Vue 3, TypeScript, Vite, Pinia, and a small Node.js API.

## Run locally

```sh
npm install
npm run dev
```

The web app runs at `http://127.0.0.1:5173`; its local API runs at `http://127.0.0.1:8787`.

## Local music and lyrics

Put audio files in `library/audio`, optionally organized into album folders. The API scans this directory at startup. Supported formats and optional album metadata are described in [`library/audio/README.md`](library/audio/README.md).

Keep your personal audio and lyric files local. The repository ignores the contents of `library/audio` and common audio/lyric extensions, along with generated library reports.

## Configuration

The API accepts `PACEY_MUSIC_API_HOST`, `PACEY_MUSIC_API_PORT`, and `MUSIC_LIBRARY_DIR`. The frontend accepts `VITE_MUSIC_API_BASE`. Set these in your local environment if needed; environment files and credentials are ignored by Git.

## Checks

```sh
npm test
npm run build
```
