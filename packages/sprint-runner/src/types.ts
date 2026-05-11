export type TicketCategory = 'UI' | 'BACKEND' | 'INFRA'

export type TicketSelectionStatus =
  | 'selected'
  | 'no-pending-tickets'
  | 'all-pending-tickets-blocked'
  | 'preferred-category-blocked-by-sprint-order'
  | 'preferred-category-blocked'
  | 'preferred-category-missing'

export interface SprintTicket {
  number: number
  title: string
  path: string
  status: string
  category: TicketCategory | null
  dependsOn: number[]
  unlocked?: boolean
  unmetDependencies?: number[]
}

export interface SprintSelectionRecommendation {
  nextSkill: string | null
  nextSkillPath: string | null
}

export interface SprintSelectionResult {
  status: TicketSelectionStatus
  sprintDir: string
  preferredCategory: TicketCategory | null
  selected: SprintTicket | null
  blockingTicket?: SprintTicket
  blockedCandidate?: SprintTicket
  nextUnlockedPreferredCategory?: SprintTicket
  nextUnlockedAnyCategory?: SprintTicket
  statusAuditCandidates?: SprintTicket[]
  recommendation?: SprintSelectionRecommendation
  reason?: string
  message?: string
}

export interface RunnerConfig {
  prdDir?: string
  sprintDir?: string
  category?: TicketCategory
  prompt?: string
  model?: string
  pollIntervalMs: number
  once: boolean
  autoStart: boolean
}

export interface RunRecord {
  id: number
  ticketLabel: string
  ticketPath: string
  startedAt: string
  finishedAt?: string
  exitCode?: number | null
  status: 'running' | 'completed' | 'failed' | 'stopped'
  summary?: string
}

export interface CodexJsonEvent {
  type: string
  item?: {
    id: string
    type: string
    text?: string
  }
  usage?: {
    input_tokens: number
    cached_input_tokens: number
    output_tokens: number
  }
  thread_id?: string
}
