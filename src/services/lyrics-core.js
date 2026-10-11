export function parseLrc(lrc) {
  const rows = new Map()

  for (const rawLine of lrc.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue

    const matches = [...line.matchAll(/\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g)]
    if (!matches.length) continue

    const text = line.replace(/\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g, '').trim()
    if (!text) continue

    for (const match of matches) {
      const minutes = Number(match[1])
      const seconds = Number(match[2])
      const fraction = normalizeFraction(match[3])
      const time = Number((minutes * 60 + seconds + fraction).toFixed(3))
      rows.set(time, [...(rows.get(time) || []), text])
    }
  }

  return Array.from(rows.entries())
    .sort(([left], [right]) => left - right)
    .map(([time, parts]) => ({ time, text: Array.from(new Set(parts)).join(' / ') }))
}

export function findActiveLyricIndex(lines, currentTime) {
  if (!lines.length || currentTime < lines[0].time) return -1

  let low = 0
  let high = lines.length - 1

  while (low <= high) {
    const middle = Math.floor((low + high) / 2)
    if (lines[middle].time <= currentTime) {
      low = middle + 1
    } else {
      high = middle - 1
    }
  }

  return high
}

function normalizeFraction(value) {
  if (!value) return 0
  return Number(`0.${value.padEnd(3, '0').slice(0, 3)}`)
}
