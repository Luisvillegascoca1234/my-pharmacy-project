#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const STATUS_DONE_PATTERN = /^- Status:\s*DONE\s*$/m
const SPRINT_DIR_PATTERN = /^(?<number>\d{2})-(?<slug>[a-z0-9-]+)$/
const CATEGORY_ORDER = ['UI', 'BACKEND', 'INFRA']

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
}

function parseArgs(argv) {
  const args = {
    expectedResults: [],
    categoryTickets: {
      UI: [],
      BACKEND: [],
      INFRA: [],
    },
    cleanupTitle: 'Clean Up Touched Code And References',
    qaTitle: 'Run Manual QA On Affected Areas',
    thesisTitle: 'Update Thesis With Sprint Evidence',
  }

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
      case '--title':
        args.title = next
        break
      case '--slug':
        args.slug = next
        break
      case '--goal':
        args.goal = next
        break
      case '--expected-result':
        args.expectedResults.push(next)
        break
      case '--ui-ticket':
        args.categoryTickets.UI.push(next)
        break
      case '--backend-ticket':
        args.categoryTickets.BACKEND.push(next)
        break
      case '--infra-ticket':
        args.categoryTickets.INFRA.push(next)
        break
      case '--cleanup-title':
        args.cleanupTitle = next
        break
      case '--qa-title':
        args.qaTitle = next
        break
      case '--thesis-title':
        args.thesisTitle = next
        break
      default:
        throw new Error(`Unknown argument: ${current}`)
    }

    index += 1
  }

  if (!args.prdDir) throw new Error('Missing required --prd-dir')
  if (!args.title) throw new Error('Missing required --title')
  if (!args.goal) throw new Error('Missing required --goal')
  const totalCategoryTickets = CATEGORY_ORDER.reduce(
    (total, category) => total + args.categoryTickets[category].length,
    0,
  )
  if (totalCategoryTickets === 0) {
    throw new Error('At least one category ticket is required via --ui-ticket, --backend-ticket, or --infra-ticket.')
  }

  return args
}

function findSprintDirs(sprintsDir) {
  if (!fs.existsSync(sprintsDir)) return []

  return fs
    .readdirSync(sprintsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && SPRINT_DIR_PATTERN.test(entry.name))
    .map((entry) => {
      const match = entry.name.match(SPRINT_DIR_PATTERN)
      return {
        number: Number(match.groups.number),
        dir: path.join(sprintsDir, entry.name),
      }
    })
    .sort((left, right) => left.number - right.number)
}

function ensurePreviousSprintDone(sprintDirs) {
  if (sprintDirs.length === 0) return

  const previous = sprintDirs[sprintDirs.length - 1]
  const readmePath = path.join(previous.dir, 'README.md')

  if (!fs.existsSync(readmePath)) {
    throw new Error(
      `Cannot start a new sprint: previous sprint ${String(previous.number).padStart(2, '0')} is missing README.md at ${readmePath}.`,
    )
  }

  const content = fs.readFileSync(readmePath, 'utf8')
  if (!STATUS_DONE_PATTERN.test(content)) {
    throw new Error(
      `Cannot start a new sprint: previous sprint ${String(previous.number).padStart(2, '0')} is not marked '- Status: DONE' in ${readmePath}.`,
    )
  }
}

function buildTicketsByCategory(categoryTickets, cleanupTitle, qaTitle, thesisTitle) {
  const tickets = []

  for (const category of CATEGORY_ORDER) {
    for (const title of categoryTickets[category].map((item) => item.trim()).filter(Boolean)) {
      tickets.push({ category, title, kind: 'main' })
    }
  }

  const hasCleanup = tickets.some((ticket) => isCleanupTitle(ticket.title))
  const hasManualQa = tickets.some((ticket) => isManualQaTitle(ticket.title))
  const hasThesisUpdate = tickets.some((ticket) => isThesisUpdateTitle(ticket.title))

  if (!hasCleanup) {
    tickets.push({ category: 'INFRA', title: cleanupTitle, kind: 'cleanup' })
  }
  if (!hasManualQa) {
    tickets.push({ category: 'INFRA', title: qaTitle, kind: 'manual-qa' })
  }
  if (!hasThesisUpdate) {
    tickets.push({ category: 'INFRA', title: thesisTitle, kind: 'thesis-update' })
  }

  return tickets
}

function formatDepends(dependencies) {
  if (dependencies.length === 0) return 'none'
  return dependencies.map((dependency) => String(dependency).padStart(2, '0')).join(', ')
}

function formatBlocks(blockers) {
  if (blockers.length === 0) return 'none'
  return blockers.map((blocker) => String(blocker).padStart(2, '0')).join(', ')
}

function isCleanupTitle(title) {
  const lower = title.toLowerCase()
  return lower.includes('clean up') || lower.includes('cleanup')
}

function isManualQaTitle(title) {
  const lower = title.toLowerCase()
  return lower.includes('manual qa') || lower.includes('run qa') || lower.includes('focused parity qa')
}

function isThesisUpdateTitle(title) {
  const lower = title.toLowerCase()
  return lower.includes('thesis') || lower.includes('tesis')
}

function buildDependencyMaps(tickets) {
  const dependenciesByTicket = new Map()
  const blockersByTicket = new Map()
  const lastMainByCategory = new Map()

  for (const category of CATEGORY_ORDER) {
    const categoryMainTickets = tickets.filter((ticket) => ticket.category === category && ticket.kind === 'main')
    if (categoryMainTickets.length > 0) {
      lastMainByCategory.set(category, categoryMainTickets[categoryMainTickets.length - 1].number)
    }
  }

  for (const ticket of tickets) {
    let dependencies = []

    if (ticket.kind === 'main') {
      const previousInCategory = tickets
        .filter((candidate) => candidate.category === ticket.category && candidate.kind === 'main' && candidate.number < ticket.number)
        .at(-1)
      dependencies = previousInCategory ? [previousInCategory.number] : []
    } else if (ticket.kind === 'cleanup') {
      dependencies = Array.from(lastMainByCategory.values()).sort((left, right) => left - right)
    } else if (ticket.kind === 'manual-qa') {
      const cleanupTicket = tickets.find((candidate) => candidate.kind === 'cleanup')
      dependencies = cleanupTicket ? [cleanupTicket.number] : []
    } else if (ticket.kind === 'thesis-update') {
      const manualQaTicket = tickets.find((candidate) => candidate.kind === 'manual-qa')
      dependencies = manualQaTicket ? [manualQaTicket.number] : []
    }

    dependenciesByTicket.set(ticket.number, dependencies)
    blockersByTicket.set(ticket.number, [])
  }

  for (const [ticketNumber, dependencies] of dependenciesByTicket.entries()) {
    for (const dependency of dependencies) {
      blockersByTicket.get(dependency).push(ticketNumber)
    }
  }

  return { dependenciesByTicket, blockersByTicket }
}

function makeTicketBody(ticket, sprintTitle, parentPrdPath, dependencies, blockers) {
  const categoryLine = `- Category: ${ticket.category}`
  const parentPrdLine = `- Parent PRD: [PRD.md](${parentPrdPath})`

  if (isCleanupTitle(ticket.title)) {
    return `# Ticket ${String(ticket.number).padStart(2, '0')} - ${ticket.title}

- Status: TODO
${categoryLine}
${parentPrdLine}
- Depends on: ${formatDepends(dependencies)}
- Blocks: ${formatBlocks(blockers)}

## Description

Clean up the dead code, duplicate wiring, stale references, temporary instrumentation, and naming drift exposed by the sprint work, focusing only on the paths touched by sprint ${sprintTitle}.

## Scope

- sprint-touched modules, docs, or product surfaces
- temporary adapters or instrumentation introduced by the sprint
- providers, exports, helpers, and references touched by the sprint

## Out Of Scope

- broad cleanup outside the sprint scope
- new functional changes
- later-sprint refactors

## Acceptance Criteria

- no obvious dead code remains in the sprint-touched paths
- no duplicate handlers, services, providers, or wrappers remain without a clear reason
- imports, exports, naming, and references reflect a coherent post-sprint shape
- deferred debt is documented explicitly instead of being left as accidental slop
`
  }

  if (isManualQaTitle(ticket.title)) {
    return `# Ticket ${String(ticket.number).padStart(2, '0')} - ${ticket.title}

- Status: TODO
${categoryLine}
${parentPrdLine}
- Depends on: ${formatDepends(dependencies)}
- Blocks: ${formatBlocks(blockers)}

## Description

Run focused manual QA on the affected product surface for sprint ${sprintTitle}, using Playwright MCP for browser-based verification whenever the touched flow includes web UI or navigation.

When this QA ticket is the final validation step for the whole PRD epic, update the feature's \`epic.md\` file to \`- Status: DONE\` after all QA issues are fixed and revalidated.

## Scope

- verification commands relevant to the touched slices
- browser console and network requests tied to the covered flows
- the touched UI routes or product surfaces when applicable

## Out Of Scope

- starting the dev server
- broad exploratory testing outside the sprint scope
- unrelated later-sprint validation

## Acceptance Criteria

- manual QA explicitly uses Playwright MCP when the affected flow is browser-based
- the touched user flows are exercised deliberately, step by step
- no new relevant 4xx or 5xx responses appear in the covered flows
- no new relevant console errors appear during the covered flows
- blockers such as missing seed data, auth issues, or inaccessible routes are documented with the exact step and URL
- if this ticket closes the whole epic, \`epic.md\` is updated to \`- Status: DONE\` only after validation succeeds
`
  }

  if (isThesisUpdateTitle(ticket.title)) {
    return `# Ticket ${String(ticket.number).padStart(2, '0')} - ${ticket.title}

- Status: TODO
${categoryLine}
${parentPrdLine}
- Depends on: ${formatDepends(dependencies)}
- Blocks: ${formatBlocks(blockers)}

## Description

Update the academic thesis documentation with the evidence produced by sprint ${sprintTitle}. The update must be academically rigorous, traceable to implemented work, and limited to high-level implementation detail.

If the thesis document is missing context needed to explain this sprint, reconstruct that context from the PRD, epic, sprint tickets, accepted decisions, and previous related work already completed in the repo before editing. Ask the developer only when the missing information would materially change the academic claim, scope, or interpretation.

## Scope

- thesis sections affected by the sprint outcome
- high-level implementation summary: architecture decisions, modules touched, data flow, validation strategy, and known limitations
- academic framing that connects the sprint result to the research or system objectives
- traceable references to PRD decisions, sprint evidence, and validated behavior

## Out Of Scope

- unsupported academic claims
- marketing language or informal implementation narration
- code dumps, exhaustive file-by-file logs, or low-level operational details
- thesis sections unrelated to the sprint evidence

## Acceptance Criteria

- thesis updates are written in formal academic Spanish unless the existing document requires another language
- every new claim is supported by sprint evidence, previous implemented work, or an explicit documented decision
- implementation is described at a high level without copying large code fragments
- missing thesis context is filled from prior project artifacts when possible
- unresolved academic assumptions are documented clearly instead of being presented as facts
`
  }

  return `# Ticket ${String(ticket.number).padStart(2, '0')} - ${ticket.title}

- Status: TODO
${categoryLine}
${parentPrdLine}
- Depends on: ${formatDepends(dependencies)}
- Blocks: ${formatBlocks(blockers)}

## Description

[TODO: Describe the purpose of this ticket and the concrete change it should make inside sprint ${sprintTitle}.]

## Scope

- [TODO: list touched folders, modules, docs, or product surfaces]

## Out Of Scope

- [TODO: list the work intentionally deferred]

## Acceptance Criteria

- [TODO: add concrete, verifiable exit criteria]
`
}

function makeReadme(sprintNumber, title, goal, expectedResults, tickets) {
  const resultLines =
    expectedResults.length > 0 ? expectedResults : ['[TODO: describe the expected sprint result]']

  const executionSections = CATEGORY_ORDER.map((category) => {
    const categoryTickets = tickets.filter((ticket) => ticket.category === category)
    if (categoryTickets.length === 0) return null

    const lines = categoryTickets.map((ticket) => {
      const fileName = `${String(ticket.number).padStart(2, '0')}-${slugify(`${ticket.category.toLowerCase()}-${ticket.title}`)}.md`
      return `${ticket.number}. [${fileName}](./${fileName})`
    })

    return `### ${category}\n\n${lines.join('\n')}`
  }).filter(Boolean)

  return `# Sprint ${String(sprintNumber).padStart(2, '0')} - ${title}

## Goal

${goal}

## Overall Status

- Status: TODO
- Owner: [TODO]
- External dependency: none

## Expected Result

By the end of this sprint:

${resultLines.map((line) => `- ${line}`).join('\n')}

## Execution Order

${executionSections.join('\n\n')}

## Sprint Rule

[TODO: describe the boundary of this sprint, what it intentionally changes, and what it must not mix in from later phases.]
`
}

function main() {
  const args = parseArgs(process.argv.slice(2))

  const prdDir = path.resolve(args.prdDir)
  const sprintsDir = path.join(prdDir, 'sprints')

  if (!fs.existsSync(prdDir)) {
    throw new Error(`PRD feature directory does not exist: ${prdDir}`)
  }
  const prdPath = path.join(prdDir, 'PRD.md')
  if (!fs.existsSync(prdPath)) {
    throw new Error(`PRD document does not exist: ${prdPath}`)
  }
  if (!fs.existsSync(sprintsDir)) {
    throw new Error(`PRD feature sprints directory does not exist: ${sprintsDir}`)
  }

  const sprintDirs = findSprintDirs(sprintsDir)
  ensurePreviousSprintDone(sprintDirs)

  const nextSprintNumber = sprintDirs.length > 0 ? sprintDirs[sprintDirs.length - 1].number + 1 : 1
  const sprintSlug = args.slug || slugify(args.title)
  const sprintDirName = `${String(nextSprintNumber).padStart(2, '0')}-${sprintSlug}`
  const sprintDir = path.join(sprintsDir, sprintDirName)

  if (fs.existsSync(sprintDir)) {
    throw new Error(`Sprint directory already exists: ${sprintDir}`)
  }

  const tickets = buildTicketsByCategory(args.categoryTickets, args.cleanupTitle, args.qaTitle, args.thesisTitle).map((ticket, index) => ({
    ...ticket,
    number: index + 1,
  }))
  const { dependenciesByTicket, blockersByTicket } = buildDependencyMaps(tickets)
  const parentPrdPath = path.relative(sprintDir, prdPath).replaceAll(path.sep, '/')

  fs.mkdirSync(sprintDir, { recursive: false })
  fs.writeFileSync(
    path.join(sprintDir, 'README.md'),
    makeReadme(nextSprintNumber, args.title, args.goal, args.expectedResults, tickets),
    'utf8',
  )

  for (const ticket of tickets) {
    const fileName = `${String(ticket.number).padStart(2, '0')}-${slugify(`${ticket.category.toLowerCase()}-${ticket.title}`)}.md`
    fs.writeFileSync(
      path.join(sprintDir, fileName),
      makeTicketBody(
        ticket,
        args.title,
        parentPrdPath,
        dependenciesByTicket.get(ticket.number) ?? [],
        blockersByTicket.get(ticket.number) ?? [],
      ),
      'utf8',
    )
  }

  console.log(`Created sprint: ${sprintDir}`)
  tickets.forEach((ticket) => {
    console.log(`  - ${String(ticket.number).padStart(2, '0')} [${ticket.category}]: ${ticket.title}`)
  })
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
