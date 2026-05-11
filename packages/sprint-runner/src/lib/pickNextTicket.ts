import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { pickNextSprintTaskScriptPath, repoRoot } from './repoPaths.js'
import type { RunnerConfig, SprintSelectionResult } from '../types.js'

const execFileAsync = promisify(execFile)

export async function pickNextTicket(
  config: RunnerConfig,
): Promise<SprintSelectionResult> {
  const args = [pickNextSprintTaskScriptPath, '--json', 'true']

  if (config.prdDir) {
    args.push('--prd-dir', config.prdDir)
  }

  if (config.sprintDir) {
    args.push('--sprint-dir', config.sprintDir)
  }

  if (config.category) {
    args.push('--category', config.category)
  }

  if (config.prompt) {
    args.push('--prompt', config.prompt)
  }

  const { stdout, stderr } = await execFileAsync(process.execPath, args, {
    cwd: repoRoot,
    maxBuffer: 1024 * 1024,
  })

  if (stderr.trim().length > 0) {
    throw new Error(stderr.trim())
  }

  return JSON.parse(stdout) as SprintSelectionResult
}
