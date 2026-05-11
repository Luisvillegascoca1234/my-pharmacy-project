import path from 'node:path'
import { fileURLToPath } from 'node:url'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))

export const repoRoot = path.resolve(moduleDir, '../../../../')
export const pickNextSprintTaskScriptPath = path.join(
  repoRoot,
  '.agents/skills/pick-next-sprint-task/scripts/pick_next_sprint_task.mjs',
)
export const agentsFilePath = path.join(repoRoot, 'AGENTS.md')
export const prdRoot = path.join(repoRoot, 'docs/prd')
