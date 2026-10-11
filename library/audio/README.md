Put your local music files in this directory. The API scans folders recursively.

Supported audio:
- mp3
- flac
- m4a
- m4s
- aac
- wav
- ogg

Supported cover images:
- jpg
- jpeg
- png
- webp
- avif

Basic album layout:

```text
library/audio/2001 - Fantasy/cover.webp
library/audio/2001 - Fantasy/Jay Chou - In the Name of Father.m4a
```

Files in the root of `library/audio` appear under the default local library album.
Files inside a folder use that folder path as the album name.

Optional album metadata:

```json
{
  "album": "Fantasy",
  "albumArtist": "Jay Chou",
  "year": 2001,
  "tracks": [
    {
      "file": "Jay Chou - In the Name of Father.m4a",
      "title": "In the Name of Father",
      "artist": "Jay Chou",
      "trackNumber": 1
    }
  ]
}
```

Place this file at:

```text
library/audio/2001 - Fantasy/album.json
```
