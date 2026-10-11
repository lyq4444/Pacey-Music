import { spawn } from 'node:child_process'
import process from 'node:process'

const commands = [
  { name: 'api', command: process.execPath, args: ['server/index.js'] },
  { name: 'web', command: process.execPath, args: ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1'] }
]

const children = commands.map(({ name, command, args }) => {
  const child = spawn(command, args, {
    stdio: 'pipe',
    env: process.env,
    shell: false
  })

  child.stdout.on('data', (data) => process.stdout.write(prefixLines(name, data)))
  child.stderr.on('data', (data) => process.stderr.write(prefixLines(name, data)))
  child.on('exit', (code) => {
    if (code && !shuttingDown) {
      console.error(`[${name}] exited with code ${code}`)
      shutdown(code)
    }
  })

  return child
})

let shuttingDown = false

function shutdown(code = 0) {
  shuttingDown = true
  for (const child of children) child.kill()
  process.exit(code)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

function prefixLines(name, data) {
  return String(data)
    .split(/\r?\n/)
    .map((line) => (line ? `[${name}] ${line}` : line))
    .join('\n')
}
