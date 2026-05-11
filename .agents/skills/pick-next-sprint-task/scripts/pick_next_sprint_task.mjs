#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const SPRINT_DIR_PATTERN = /^(?<number>\d{2})-(?<slug>[a-z0-9-]+)$/
const STATUS_PATTERN = /^- Status:\s*(.+)\s*$/m
const CATEGORY_PATTERN = /^- Category:\s*(UI|BACKEND|INFRA)\s*$/m
const DEPENDS_PATTERN = /^- Depends on:\s*(.+)\s*$/m
const TICKET_TITLE_PATTERN = /^# Ticket (?<number>\d{2}) - (?<title>.+)$/m
const TICKET_FILE_PATTERN = /^(?<number>\d{2})-(?<slug>[a-z0-9-]+)\.md$/

function parseArgs(argv) {
  const args = {}

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]
    const next = argv[index + 1]

    if (!current.startsWith('--')) {
      throw new Error(`Unexpected argument: ${current}`)
    }
    if (next === undefined || next.startsWith('--')) {
      throw new Error(`Missing value for ${current}`)
    }

    switch (current) {
      case '--prd-dir':
        args.prdDir = next
        break
      case '--epic-dir':
        args.prdDir = next
        break
      case '--sprint-dir':
        args.sprintDir = next
        break
      case '--category':
        args.category = normalizeCategory(next)
        break
      case '--prompt':
        args.prompt = next
        break
      case '--json':
        args.json = next === 'true'
        break
      default:
        throw new Error(`Unknown argument: ${current}`)
    }

    index += 1
  }

  if (!args.prdDir && !args.sprintDir) {
    throw new Error('Provide --prd-dir or --sprint-dir.')
  }
  if (args.prdDir && args.sprintDir) {
    throw new Error('Use only one of --prd-dir or --sprint-dir.')
  }

  return args
}

function normalizeCategory(value) {
  const normalized = value.trim().toUpperCase()
  if (normalized === 'FRONTEND') return 'UI'
  if (!['UI', 'BACKEND', 'INFRA'].includes(normalized)) {
    throw new Error(`Unsupported category: ${value}`)
  }
  return normalized
}

function containsKeyword(text, keyword) {
  if (keyword.includes('-')) {
    return text.includes(keyword)
  }

  if (keyword.length <= 4) {
    const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(keyword)}([^a-z0-9]|$)`, 'i')
    return pattern.test(text)
  }

  return text.includes(keyword)
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function inferCategory(prompt) {
  if (!prompt) return null

  const lower = prompt.toLowerCase()

  const uiTerms = ['frontend', 'ui', 'page', 'component', 'hook', 'store', 'theme', 'design', 'i18n']
  const backendTerms = ['backend', 'api', 'controller', 'handler', 'repository', 'workflow', 'cqrs', 'entity']
  const infraTerms = ['infra', 'tooling', 'guardrail', 'lint', 'docs', 'qa', 'playwright', 'ci', 'build']

  const matches = []
  if (uiTerms.some((term) => containsKeyword(lower, term))) matches.push('UI')
  if (backendTerms.some((term) => containsKeyword(lower, term))) matches.push('BACKEND')
  if (infraTerms.some((term) => containsKeyword(lower, term))) matches.push('INFRA')

  return matches.length === 1 ? matches[0] : null
}

function findActiveSprintFromPrd(prdDir) {
  const sprintsDir = path.join(prdDir, 'sprints')
  if (!fs.existsSync(sprintsDir)) {
    throw new Error(`PRD feature sprints directory does not exist: ${sprintsDir}`)
  }

  const sprintDirs = fs
    .readdirSync(sprintsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && SPRINT_DIR_PATTERN.test(entry.name))
    .map((entry) => path.join(sprintsDir, entry.name))
    .sort()

  if (sprintDirs.length === 0) {
    throw new Error(`No sprint directories found under ${sprintsDir}`)
  }

  const active = [...sprintDirs].reverse().find((dir) => {
    const readmePath = path.join(dir, 'README.md')
    if (!fs.existsSync(readmePath)) return false
    const content = fs.readFileSync(readmePath, 'utf8')
    return !/^- Status:\s*DONE\s*$/m.test(content)
  })

  return active ?? sprintDirs[sprintDirs.length - 1]
}

function parseDepends(rawDepends) {
  if (!rawDepends) return []
  const value = rawDepends.trim().toLowerCase()
  if (value === 'none') return []

  return rawDepends
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Number(item))
    .filter((item) => !Number.isNaN(item))
}

function parseTicket(ticketPath) {
  const content = fs.readFileSync(ticketPath, 'utf8')
  const fileMatch = path.basename(ticketPath).match(TICKET_FILE_PATTERN)
  const titleMatch = content.match(TICKET_TITLE_PATTERN)
  const statusMatch = content.match(STATUS_PATTERN)
  const categoryMatch = content.match(CATEGORY_PATTERN)
  const dependsMatch = content.match(DEPENDS_PATTERN)

  if (!fileMatch || !titleMatch || !statusMatch) {
    throw new Error(`Malformed ticket metadata in ${ticketPath}`)
  }

  return {
    number: Number(titleMatch.groups.number ?? fileMatch.groups.number),
    title: titleMatch.groups.title.trim(),
    path: ticketPath,
    status: statusMatch[1].trim().toUpperCase(),
    category: categoryMatch ? categoryMatch[1].trim().toUpperCase() : null,
    dependsOn: parseDepends(dependsMatch ? dependsMatch[1] : 'none'),
  }
}

function loadTickets(sprintDir) {
  return fs
    .readdirSync(sprintDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && TICKET_FILE_PATTERN.test(entry.name))
    .map((entry) => parseTicket(path.join(sprintDir, entry.name)))
    .sort((left, right) => left.number - right.number)
}

function isDone(ticket) {
  return ticket.status === 'DONE'
}

function isSelectable(ticket) {
  return !['DONE', 'IN_PROGRESS'].includes(ticket.status)
}

function computeUnlockedTickets(tickets) {
  const byNumber = new Map(tickets.map((ticket) => [ticket.number, ticket]))

  return tickets.map((ticket) => {
    const unmetDependencies = ticket.dependsOn.filter((dependency) => {
      const dependencyTicket = byNumber.get(dependency)
      return !dependencyTicket || !isDone(dependencyTicket)
    })

    return {
      ...ticket,
      unlocked: unmetDependencies.length === 0,
      unmetDependencies,
    }
  })
}

function collectStatusAuditCandidates(tickets, selectedTicketNumber) {
  return tickets.filter(
    (ticket) =>
      ticket.number <= selectedTicketNumber &&
      ticket.unlocked &&
      ticket.status !== 'DONE',
  )
}

function formatRecommendation(category) {
  if (category === 'BACKEND') {
    return {
      nextSkill: 'backend-architecture',
      nextSkillPath:
        'D:/ProyectoDeGradoUDABOL/.agents/skills/backend-architecture/SKILL.md',
    }
  }

  if (category === 'UI') {
    return {
      nextSkill: 'frontend-architecture',
      nextSkillPath:
        'D:/ProyectoDeGradoUDABOL/.agents/skills/frontend-architecture/SKILL.md',
    }
  }

  return {
    nextSkill: null,
    nextSkillPath: null,
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2))

  const sprintDir = args.sprintDir
    ? path.resolve(args.sprintDir)
    : findActiveSprintFromPrd(path.resolve(args.prdDir))

  if (!fs.existsSync(sprintDir)) {
    throw new Error(`Sprint directory does not exist: ${sprintDir}`)
  }

  const preferredCategory = args.category ?? inferCategory(args.prompt)
  const tickets = computeUnlockedTickets(loadTickets(sprintDir))
  const selectableTickets = tickets.filter((ticket) => isSelectable(ticket))
  const unlockedTickets = selectableTickets.filter((ticket) => ticket.unlocked)
  const firstUnlockedTicket = unlockedTickets[0] ?? null

  if (selectableTickets.length === 0) {
    return emit(args.json, {
      status: 'no-pending-tickets',
      sprintDir,
      preferredCategory,
      selected: null,
      message: 'No pending tickets remain in the target sprint.',
    })
  }

  if (preferredCategory) {
    if (
      firstUnlockedTicket &&
      firstUnlockedTicket.category === preferredCategory
    ) {
      const selected = firstUnlockedTicket
      return emit(args.json, {
        status: 'selected',
        sprintDir,
        preferredCategory,
        selected,
        statusAuditCandidates: collectStatusAuditCandidates(
          tickets,
          selected.number,
        ),
        recommendation: formatRecommendation(selected.category),
        reason: 'Selected the first unlocked ticket in the preferred category.',
      })
    }

    const preferredUnlocked = unlockedTickets.filter(
      (ticket) => ticket.category === preferredCategory,
    )
    if (preferredUnlocked.length > 0 && firstUnlockedTicket) {
      return emit(args.json, {
        status: 'preferred-category-blocked-by-sprint-order',
        sprintDir,
        preferredCategory,
        selected: null,
        blockingTicket: firstUnlockedTicket,
        nextUnlockedPreferredCategory: preferredUnlocked[0],
        message:
          'A later ticket matches the preferred category, but sprint order blocks skipping the earlier unlocked ticket.',
      })
    }

    const preferredBlocked = selectableTickets.filter(
      (ticket) => ticket.category === preferredCategory,
    )
    if (preferredBlocked.length > 0) {
      const blockedCandidate = preferredBlocked[0]
      const nextAny = firstUnlockedTicket
      return emit(args.json, {
        status: 'preferred-category-blocked',
        sprintDir,
        preferredCategory,
        selected: null,
        blockedCandidate,
        nextUnlockedAnyCategory: nextAny,
        message: 'The preferred category has no unlocked ticket yet.',
      })
    }

    return emit(args.json, {
      status: 'preferred-category-missing',
      sprintDir,
      preferredCategory,
      selected: null,
      nextUnlockedAnyCategory: unlockedTickets[0] ?? null,
      message: 'The sprint has no ticket in the preferred category.',
    })
  }

  const selected = firstUnlockedTicket
  if (!selected) {
    return emit(args.json, {
      status: 'all-pending-tickets-blocked',
      sprintDir,
      preferredCategory: null,
      selected: null,
      message: 'Every pending ticket is still blocked by unmet dependencies.',
    })
  }

  return emit(args.json, {
    status: 'selected',
    sprintDir,
    preferredCategory: null,
    selected,
    statusAuditCandidates: collectStatusAuditCandidates(tickets, selected.number),
    recommendation: formatRecommendation(selected.category),
    reason: 'Selected the first unlocked ticket in sprint order.',
  })
}

function emit(asJson, payload) {
  if (asJson) {
    console.log(JSON.stringify(payload, null, 2))
    return
  }

  console.log(`Sprint: ${payload.sprintDir}`)
  console.log(`Status: ${payload.status}`)
  if (payload.preferredCategory) {
    console.log(`Preferred category: ${payload.preferredCategory}`)
  }

  if (payload.selected) {
    console.log(`Selected ticket: ${String(payload.selected.number).padStart(2, '0')} - ${payload.selected.title}`)
    console.log(`Category: ${payload.selected.category ?? 'UNKNOWN'}`)
    console.log(`Path: ${payload.selected.path}`)
    if (payload.statusAuditCandidates?.length) {
      console.log(
        `Status audit candidates: ${payload.statusAuditCandidates
          .map((ticket) => `${String(ticket.number).padStart(2, '0')} (${ticket.status})`)
          .join(', ')}`,
      )
      console.log(
        'Next step: verify those ticket statuses against the current codebase before starting implementation.',
      )
    }
    if (payload.reason) console.log(`Reason: ${payload.reason}`)
    if (payload.recommendation?.nextSkill) {
      console.log(`Next skill: ${payload.recommendation.nextSkill}`)
      console.log(`Next skill path: ${payload.recommendation.nextSkillPath}`)
    }
    return
  }

  if (payload.blockedCandidate) {
    console.log(
      `Blocked preferred ticket: ${String(payload.blockedCandidate.number).padStart(2, '0')} - ${payload.blockedCandidate.title}`,
    )
    console.log(
      `Unmet dependencies: ${payload.blockedCandidate.unmetDependencies.map((value) => String(value).padStart(2, '0')).join(', ')}`,
    )
  }

  if (payload.blockingTicket) {
    console.log(
      `Earlier unlocked ticket: ${String(payload.blockingTicket.number).padStart(2, '0')} - ${payload.blockingTicket.title}`,
    )
    console.log(`Earlier category: ${payload.blockingTicket.category ?? 'UNKNOWN'}`)
    console.log(`Earlier path: ${payload.blockingTicket.path}`)
  }

  if (payload.nextUnlockedPreferredCategory) {
    console.log(
      `Later preferred ticket: ${String(payload.nextUnlockedPreferredCategory.number).padStart(2, '0')} - ${payload.nextUnlockedPreferredCategory.title}`,
    )
    console.log(`Preferred path: ${payload.nextUnlockedPreferredCategory.path}`)
  }

  if (payload.nextUnlockedAnyCategory) {
    console.log(
      `Next unlocked in another category: ${String(payload.nextUnlockedAnyCategory.number).padStart(2, '0')} - ${payload.nextUnlockedAnyCategory.title}`,
    )
    console.log(`Other category: ${payload.nextUnlockedAnyCategory.category ?? 'UNKNOWN'}`)
    console.log(`Other path: ${payload.nextUnlockedAnyCategory.path}`)
  }

  if (payload.message) {
    console.log(`Message: ${payload.message}`)
  }
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
