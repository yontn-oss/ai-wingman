import { spawn as nodeSpawn } from 'node:child_process'

export class ExitError extends Error {
  constructor(
    public readonly cmd: string,
    public readonly code: number
  ) {
    super(`Command "${cmd}" exited with code ${code}`)
  }
}

export function spawnCommand(
  cmd: string,
  args: string[],
  cwd: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = nodeSpawn(cmd, args, { cwd, stdio: 'inherit', shell: true })
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new ExitError(`${cmd} ${args.join(' ')}`, code ?? 1))
      }
    })
    child.on('error', reject)
  })
}

/** Same as spawnCommand but suppresses subprocess output — safe to use alongside a spinner. */
export function spawnSilent(
  cmd: string,
  args: string[],
  cwd: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = nodeSpawn(cmd, args, { cwd, stdio: 'pipe', shell: true })
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new ExitError(`${cmd} ${args.join(' ')}`, code ?? 1))
      }
    })
    child.on('error', reject)
  })
}
