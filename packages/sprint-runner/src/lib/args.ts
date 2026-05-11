import fs from 'node:fs'
import path from 'node:path'
import { prdRoot, repoRoot } from './repoPaths.js'
import type { RunnerConfig, TicketCategory } from '../types.js'

const SPRINT_DIR_PATTERN = /^\d{2}-[a-z0-9-]+$/
const STATUS_PATTERN = /^- Status:\s*(.+)\s*$/m

const HELP_TEXT = `Sprint Runner

Usage:
  pnpm sprint
  pnpm sprint -- --prd-dir docs/prd/<feature-slug>

Options:
  --prd-dir <path>         PRD feature directory to monitor
  --epic-dir <path>        Legacy alias for --prd-dir
  --sprint-dir <path>      Sprint directory to monitor
  --category <value>       UI, BACKEND, INFRA, frontend, backend, infra
  --prompt <text>          Extra operator instructions appended to every Codex run
  --model <name>           Codex model override
  --poll-interval <sec>    Delay between selection attempts when blocked or idle
  --once                   Process a single eligible ticket and stop
  --paused                 Start with the queue paused
  --help                   Show this help

Defaults:
  If there is a single active PRD feature under docs/prd, the runner uses it automatically.
`

function normalizeCategory(value: string): TicketCategory {
  const normalized = value.trim().toUpperCase()

  if (normalized === 'FRONTEND') return 'UI'
  if (normalized === 'BACKEND') return 'BACKEND'
  if (normalized === 'INFRA') return 'INFRA'
  if (normalized === 'UI') return 'UI'

  throw new Error(`Unsupported category: ${value}`)
}

function resolveWorkspacePath(value: string): string {
  return path.isAbsolute(value) ? value : path.resolve(repoRoot, value)
}

function listPrdFeatureDirs(): string[] {
  if (!fs.existsSync(prdRoot)) return []

  return fs
    .readdirSync(prdRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(prdRoot, entry.name))
    .filter((featureDir) => fs.existsSync(path.join(featureDir, 'PRD.md')))
    .sort()
}

function listSprintDirs(prdDir: string): string[] {
  const sprintsDir = path.join(prdDir, 'sprints')

  if (!fs.existsSync(sprintsDir)) return []

  return fs
    .readdirSync(sprintsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && SPRINT_DIR_PATTERN.test(entry.name))
    .map((entry) => path.join(sprintsDir, entry.name))
    .sort()
}

function readSprintStatus(sprintDir: string): string | undefined {
  const readmePath = path.join(sprintDir, 'README.md')

  if (!fs.existsSync(readmePath)) return undefined

  const content = fs.readFileSync(readmePath, 'utf8')
  const match = content.match(STATUS_PATTERN)

  return match?.[1]?.trim().toUpperCase()
}

function findDefaultPrdDir(): string | undefined {
  const prdDirs = listPrdFeatureDirs()

  if (prdDirs.length === 1) {
    return prdDirs[0]
  }

  const activePrdDirs = prdDirs.filter((prdDir) => {
    const sprintDirs = listSprintDirs(prdDir)

    if (sprintDirs.length === 0) return false

    return sprintDirs.some((sprintDir) => readSprintStatus(sprintDir) !== 'DONE')
  })

  if (activePrdDirs.length === 1) {
    return activePrdDirs[0]
  }

  return undefined
}

export function parseArgs(argv: string[]): RunnerConfig {
  let prdDir: string | undefined
  let sprintDir: string | undefined
  let category: TicketCategory | undefined
  let prompt: string | undefined
  let model: string | undefined
  let pollIntervalMs = 30_000
  let once = false
  let autoStart = true

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]
    const next = argv[index + 1]

    if (current === '--') {
      continue
    }

    switch (current) {
      case '--prd-dir':
        if (!next) throw new Error('Missing value for --prd-dir')
        prdDir = resolveWorkspacePath(next)
        index += 1
        break
      case '--epic-dir':
        if (!next) throw new Error('Missing value for --epic-dir')
        prdDir = resolveWorkspacePath(next)
        index += 1
        break
      case '--sprint-dir':
        if (!next) throw new Error('Missing value for --sprint-dir')
        sprintDir = resolveWorkspacePath(next)
        index += 1
        break
      case '--category':
        if (!next) throw new Error('Missing value for --category')
        category = normalizeCategory(next)
        index += 1
        break
      case '--prompt':
        if (!next) throw new Error('Missing value for --prompt')
        prompt = next
        index += 1
        break
      case '--model':
        if (!next) throw new Error('Missing value for --model')
        model = next
        index += 1
        break
      case '--poll-interval':
        if (!next) throw new Error('Missing value for --poll-interval')
        pollIntervalMs = Number(next) * 1000
        if (Number.isNaN(pollIntervalMs) || pollIntervalMs <= 0) {
          throw new Error(`Invalid poll interval: ${next}`)
        }
        index += 1
        break
      case '--once':
        once = true
        break
      case '--paused':
        autoStart = false
        break
      case '--help':
      case '-h':
        console.log(HELP_TEXT)
        process.exit(0)
      default:
        throw new Error(`Unknown argument: ${current}`)
    }
  }

  if (prdDir && sprintDir) {
    throw new Error('Use only one of --prd-dir or --sprint-dir')
  }

  if (!prdDir && !sprintDir) {
    prdDir = findDefaultPrdDir()
  }

  if (!prdDir && !sprintDir) {
    throw new Error(
      'Provide --prd-dir or --sprint-dir. No unique default PRD feature could be inferred.',
    )
  }

  return {
    prdDir,
    sprintDir,
    category,
    prompt,
    model,
    pollIntervalMs,
    once,
    autoStart,
  }
}
