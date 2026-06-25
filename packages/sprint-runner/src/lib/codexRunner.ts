import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { stripVTControlCharacters } from 'node:util'
import { repoRoot } from './repoPaths.js'
import type {
  CodexJsonEvent,
  RunnerConfig,
  SprintSelectionResult,
} from '../types.js'
import { buildCodexPrompt } from './prompt.js'

export interface CodexRunResult {
  exitCode: number | null
  lastAgentMessage: string | undefined
  warnings: string[]
}

interface CodexRunnerCallbacks {
  onLine?: (line: string) => void
  onWarning?: (line: string) => void
  onEvent?: (event: CodexJsonEvent) => void
}

interface CodexCommand {
  command: string
  argsPrefix: string[]
}

function cleanLine(value: string): string {
  return stripVTControlCharacters(value).trim()
}

function shouldSuppressWarning(line: string): boolean {
  return [
    'failed to open state db',
    'state db discrepancy during find_thread_path_by_id_str_in_subdir: falling_back',
    'ignoring interface.defaultPrompt',
    'Failed to delete shell snapshot',
  ].some((pattern) => line.includes(pattern))
}

function summarizeEvent(event: CodexJsonEvent): string | null {
  if (event.type === 'thread.started' && event.thread_id) {
    return `Thread started: ${event.thread_id}`
  }

  if (event.type === 'turn.started') {
    return 'Codex turn started'
  }

  if (
    event.type === 'item.completed' &&
    event.item?.type === 'agent_message' &&
    event.item.text
  ) {
    return `Agent: ${event.item.text}`
  }

  if (event.type === 'turn.completed' && event.usage) {
    return `Turn completed: ${event.usage.input_tokens} input, ${event.usage.output_tokens} output tokens`
  }

  return null
}

function findFirstExisting(paths: Array<string | undefined>): string | undefined {
  return paths.find((candidate): candidate is string => Boolean(candidate) && fs.existsSync(candidate))
}

function getCodexCommand(): CodexCommand {
  if (process.env.CODEX_EXECUTABLE) {
    return { command: process.env.CODEX_EXECUTABLE, argsPrefix: [] }
  }

  if (process.platform !== 'win32') {
    return { command: 'codex', argsPrefix: [] }
  }

  const nativeExecutable = findFirstExisting([
    process.env.LOCALAPPDATA
      ? path.join(process.env.LOCALAPPDATA, 'OpenAI', 'Codex', 'bin', 'codex.exe')
      : undefined,
    process.env.USERPROFILE
      ? path.join(process.env.USERPROFILE, 'AppData', 'Local', 'OpenAI', 'Codex', 'bin', 'codex.exe')
      : undefined,
  ])

  if (nativeExecutable) {
    return { command: nativeExecutable, argsPrefix: [] }
  }

  const npmCodexScript = findFirstExisting([
    process.env.APPDATA
      ? path.join(process.env.APPDATA, 'npm', 'node_modules', '@openai', 'codex', 'bin', 'codex.js')
      : undefined,
  ])

  if (npmCodexScript) {
    return { command: process.execPath, argsPrefix: [npmCodexScript] }
  }

  return { command: 'codex', argsPrefix: [] }
}

export function runCodexTicket(
  selection: SprintSelectionResult,
  config: RunnerConfig,
  callbacks: CodexRunnerCallbacks = {},
): {
  stop: () => void
  completed: Promise<CodexRunResult>
} {
  const prompt = buildCodexPrompt(selection, config)
  const args = ['--yolo', 'exec', '--json', '--ephemeral', '-C', repoRoot]

  if (config.model) {
    args.push('--model', config.model)
  }

  args.push(prompt)
  const codexCommand = getCodexCommand()

  const child = spawn(codexCommand.command, [...codexCommand.argsPrefix, ...args], {
    cwd: repoRoot,
    env: {
      ...process.env,
      TERM: process.env.TERM || 'xterm-256color',
      COLORTERM: process.env.COLORTERM || 'truecolor',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const warnings: string[] = []
  let lastAgentMessage: string | undefined

  const handleLine = (rawLine: string) => {
    const line = cleanLine(rawLine)

    if (!line) return

    if (line.startsWith('{') && line.endsWith('}')) {
      try {
        const event = JSON.parse(line) as CodexJsonEvent

        if (
          event.type === 'item.completed' &&
          event.item?.type === 'agent_message' &&
          event.item.text
        ) {
          lastAgentMessage = event.item.text
        }

        callbacks.onEvent?.(event)
        const summary = summarizeEvent(event)
        if (summary) {
          callbacks.onLine?.(summary)
        }
        return
      } catch {
        callbacks.onLine?.(line)
        return
      }
    }

    if (shouldSuppressWarning(line)) {
      return
    }

    warnings.push(line)
    callbacks.onWarning?.(line)
  }

  readline.createInterface({ input: child.stdout }).on('line', handleLine)
  readline.createInterface({ input: child.stderr }).on('line', handleLine)

  return {
    stop: () => {
      child.kill('SIGTERM')
    },
    completed: new Promise<CodexRunResult>((resolve, reject) => {
      child.once('error', reject)
      child.once('close', (exitCode) => {
        resolve({
          exitCode,
          lastAgentMessage,
          warnings,
        })
      })
    }),
  }
}
