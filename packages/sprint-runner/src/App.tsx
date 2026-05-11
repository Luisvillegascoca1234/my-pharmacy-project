import { Box, Text, useApp, useInput } from 'ink'
import React, { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import type { RunRecord, RunnerConfig, SprintSelectionResult } from './types.js'
import { pickNextTicket } from './lib/pickNextTicket.js'
import { runCodexTicket } from './lib/codexRunner.js'

type QueuePhase =
  | 'idle'
  | 'picking'
  | 'running'
  | 'waiting'
  | 'blocked'
  | 'done'
  | 'error'

function formatTicketLabel(selection: SprintSelectionResult | null): string {
  if (!selection?.selected) return 'No ticket selected'

  return `${String(selection.selected.number).padStart(2, '0')} - ${selection.selected.title}`
}

function useSprintAutomation(config: RunnerConfig) {
  const [phase, setPhase] = useState<QueuePhase>(config.autoStart ? 'idle' : 'waiting')
  const [isActive, setIsActive] = useState(config.autoStart)
  const [selection, setSelection] = useState<SprintSelectionResult | null>(null)
  const [lastMessage, setLastMessage] = useState<string>()
  const [lastError, setLastError] = useState<string>()
  const [logLines, setLogLines] = useState<string[]>([])
  const [history, setHistory] = useState<RunRecord[]>([])
  const [sleepUntil, setSleepUntil] = useState<number | null>(null)
  const runIdRef = useRef(0)
  const cancelledRef = useRef(false)
  const cycleRunningRef = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const sleepResolverRef = useRef<(() => void) | null>(null)
  const activeRunRef = useRef<ReturnType<typeof runCodexTicket> | null>(null)

  const appendLog = useEffectEvent((line: string) => {
    setLogLines((previous) => [...previous.slice(-11), line])
  })

  const stopSleeping = useEffectEvent(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (sleepResolverRef.current) {
      const resolve = sleepResolverRef.current
      sleepResolverRef.current = null
      resolve()
    }

    setSleepUntil(null)
  })

  const scheduleRetry = useEffectEvent(async () => {
    stopSleeping()

    if (config.once) {
      setIsActive(false)
      setPhase('idle')
      return
    }

    setPhase('waiting')
    setSleepUntil(Date.now() + config.pollIntervalMs)

    await new Promise<void>((resolve) => {
      sleepResolverRef.current = () => {
        sleepResolverRef.current = null
        resolve()
      }

      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null
        const finish = sleepResolverRef.current
        sleepResolverRef.current = null
        setSleepUntil(null)
        finish?.()
      }, config.pollIntervalMs)
    })
  })

  const runCycle = useEffectEvent(async () => {
    if (cycleRunningRef.current) {
      return
    }

    cycleRunningRef.current = true

    try {
      while (!cancelledRef.current && isActive) {
        setPhase('picking')
        appendLog('Selecting the next eligible sprint ticket')

        let nextSelection: SprintSelectionResult

        try {
          nextSelection = await pickNextTicket(config)
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          setLastError(message)
          setPhase('error')
          setIsActive(false)
          appendLog(`Selector failed: ${message}`)
          return
        }

        if (cancelledRef.current || !isActive) {
          return
        }

        setSelection(nextSelection)

        if (nextSelection.status !== 'selected' || !nextSelection.selected) {
          const message = nextSelection.message ?? `Selector status: ${nextSelection.status}`
          appendLog(message)
          setPhase(nextSelection.status === 'no-pending-tickets' ? 'done' : 'blocked')
          await scheduleRetry()
          continue
        }

        const selectedTicket = nextSelection.selected
        const ticketLabel = formatTicketLabel(nextSelection)
        appendLog(`Starting Codex for ${ticketLabel}`)
        setPhase('running')
        setLastMessage(undefined)
        setLastError(undefined)

        const runId = runIdRef.current + 1
        runIdRef.current = runId
        const startedAt = new Date().toISOString()

        setHistory((previous) => [
          {
            id: runId,
            ticketLabel,
            ticketPath: selectedTicket.path,
            startedAt,
            status: 'running',
          },
          ...previous.slice(0, 7),
        ])

        const run = runCodexTicket(nextSelection, config, {
          onLine: appendLog,
          onWarning: appendLog,
          onEvent: (event) => {
            if (
              event.type === 'item.completed' &&
              event.item?.type === 'agent_message' &&
              event.item.text
            ) {
              setLastMessage(event.item.text)
            }
          },
        })

        activeRunRef.current = run

        let result

        try {
          result = await run.completed
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          setHistory((previous) =>
            previous.map((item) =>
              item.id === runId
                ? {
                    ...item,
                    finishedAt: new Date().toISOString(),
                    exitCode: null,
                    status: 'failed',
                    summary: message,
                  }
                : item,
            ),
          )
          setLastError(message)
          setPhase('error')
          setIsActive(false)
          appendLog(`Codex launch failed: ${message}`)
          return
        } finally {
          activeRunRef.current = null
        }

        const status =
          result.exitCode === 0 ? 'completed' : result.exitCode === null ? 'stopped' : 'failed'

        setHistory((previous) =>
          previous.map((item) =>
            item.id === runId
              ? {
                  ...item,
                  finishedAt: new Date().toISOString(),
                  exitCode: result.exitCode,
                  status,
                  summary: result.lastAgentMessage,
                }
              : item,
          ),
        )

        if (result.lastAgentMessage) {
          setLastMessage(result.lastAgentMessage)
        }

        appendLog(
          result.exitCode === 0
            ? `Codex finished ${ticketLabel}`
            : `Codex exited with code ${String(result.exitCode)} for ${ticketLabel}`,
        )

        if (config.once) {
          setIsActive(false)
          setPhase(result.exitCode === 0 ? 'idle' : 'error')
          return
        }

        await scheduleRetry()
      }
    } finally {
      cycleRunningRef.current = false
    }
  })

  useEffect(() => {
    cancelledRef.current = false

    if (!isActive) {
      stopSleeping()
      return () => {
        cancelledRef.current = true
      }
    }

    void runCycle()

    return () => {
      cancelledRef.current = true
      stopSleeping()
    }
  }, [isActive])

  const toggleActive = () => {
    if (isActive) {
      setIsActive(false)
      setPhase('waiting')
      appendLog('Queue paused')
      return
    }

    setLastError(undefined)
    setIsActive(true)
    appendLog('Queue resumed')
  }

  const stopCurrentRun = () => {
    if (!activeRunRef.current) return
    activeRunRef.current.stop()
    appendLog('Stop signal sent to current Codex run')
  }

  const retryNow = () => {
    stopSleeping()
    if (!isActive) {
      setIsActive(true)
    }
    appendLog('Immediate retry requested')
  }

  return {
    phase,
    isActive,
    selection,
    lastMessage,
    lastError,
    logLines,
    history,
    sleepUntil,
    toggleActive,
    stopCurrentRun,
    retryNow,
  }
}

function formatSleepRemaining(sleepUntil: number | null): string {
  if (!sleepUntil) return 'ready'

  const remainingMs = Math.max(0, sleepUntil - Date.now())
  return `${Math.ceil(remainingMs / 1000)}s`
}

function formatHistoryStatus(record: RunRecord): string {
  if (record.status === 'completed') return 'OK'
  if (record.status === 'failed') return `FAIL (${String(record.exitCode)})`
  if (record.status === 'stopped') return 'STOPPED'
  return 'RUNNING'
}

export function App({ config }: { config: RunnerConfig }) {
  const { exit } = useApp()
  const {
    phase,
    isActive,
    selection,
    lastMessage,
    lastError,
    logLines,
    history,
    sleepUntil,
    toggleActive,
    stopCurrentRun,
    retryNow,
  } = useSprintAutomation(config)

  useInput((input) => {
    if (input === 'q') {
      stopCurrentRun()
      exit()
    }

    if (input === ' ') {
      toggleActive()
    }

    if (input === 'x') {
      stopCurrentRun()
    }

    if (input === 'r') {
      retryNow()
    }
  })

  const currentTicketLabel = useMemo(
    () => formatTicketLabel(selection),
    [selection],
  )

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>Sprint Runner</Text>
      <Text>Estado: {phase}{isActive ? ' | cola activa' : ' | cola pausada'}</Text>
      <Text>Espera: {formatSleepRemaining(sleepUntil)}</Text>
      <Text>PRD feature: {config.prdDir ?? 'auto'}</Text>
      <Text>Sprint: {selection?.sprintDir ?? config.sprintDir ?? 'pending selection'}</Text>
      <Text>Ticket actual: {currentTicketLabel}</Text>
      <Text>Atajos: espacio pausa/reanuda | r reintento ahora | x corta el ticket actual | q salir</Text>

      {selection?.message ? (
        <Box marginTop={1} flexDirection="column">
          <Text bold>Selector</Text>
          <Text>{selection.message}</Text>
        </Box>
      ) : null}

      {lastError ? (
        <Box marginTop={1} flexDirection="column">
          <Text bold color="red">Error</Text>
          <Text color="red">{lastError}</Text>
        </Box>
      ) : null}

      {lastMessage ? (
        <Box marginTop={1} flexDirection="column">
          <Text bold>Último cierre de Codex</Text>
          <Text>{lastMessage}</Text>
        </Box>
      ) : null}

      <Box marginTop={1} flexDirection="column">
        <Text bold>Historial</Text>
        {history.length === 0 ? <Text dimColor>Sin ejecuciones todavía</Text> : null}
        {history.map((record) => (
          <Text key={record.id}>
            [{formatHistoryStatus(record)}] {record.ticketLabel}
          </Text>
        ))}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold>Log reciente</Text>
        {logLines.length === 0 ? <Text dimColor>Esperando actividad...</Text> : null}
        {logLines.map((line, index) => (
          <Text key={`${index}-${line}`}>{line}</Text>
        ))}
      </Box>
    </Box>
  )
}
