from pathlib import Path
import shutil
import sys

AUDIO_EXTENSIONS = {".mp3", ".flac", ".m4a", ".aac", ".wav", ".ogg"}
PROJECT_DIR = Path(__file__).resolve().parent
DEST_DIR = PROJECT_DIR / "library" / "audio"


def is_audio_file(path: Path) -> bool:
    return path.is_file() and path.suffix.lower() in AUDIO_EXTENSIONS


def unique_destination(path: Path) -> Path:
    if not path.exists():
        return path

    stem = path.stem
    suffix = path.suffix
    index = 2
    while True:
        candidate = path.with_name(f"{stem} ({index}){suffix}")
        if not candidate.exists():
            return candidate
        index += 1


def import_audio(source: Path) -> list[Path]:
    if not source.exists():
        raise FileNotFoundError(f"Source path does not exist: {source}")

    DEST_DIR.mkdir(parents=True, exist_ok=True)

    if source.is_file():
        files = [source] if is_audio_file(source) else []
    else:
        files = [path for path in source.rglob("*") if is_audio_file(path)]

    copied: list[Path] = []
    for file_path in files:
        destination = unique_destination(DEST_DIR / file_path.name)
        shutil.copy2(file_path, destination)
        copied.append(destination)

    return copied


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python import-local-audio.py <audio-file-or-folder>")
        print()
        print(f"Destination:")
        print(f"  {DEST_DIR}")
        return 1

    source = Path(sys.argv[1]).expanduser().resolve()
    copied = import_audio(source)

    print(f"Destination: {DEST_DIR}")
    print(f"Copied {len(copied)} audio file(s).")
    for path in copied[:50]:
        print(f"- {path.name}")
    if len(copied) > 50:
        print(f"... and {len(copied) - 50} more")

    print()
    print("Then rescan Pacey-music:")
    print("  Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8787/api/rescan")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
