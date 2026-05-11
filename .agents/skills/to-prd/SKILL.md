---
name: to-prd
description: Turn the current conversation context and repo understanding into a PRD under `docs/prd/<feature-slug>/PRD.md`, create the companion epic plan, and prepare an issue-ready summary. Use after discovery, usually after `$grill-me`, when the user wants the agreed feature spec turned into planning artifacts without another interview.
---

# To PRD

Create a PRD and companion epic plan from the current conversation and the repo's current state. Do not interview the user again. Synthesize from what you already know, especially prior `$grill-me` discovery, and inspect the codebase only as needed to remove ambiguity.

Normal flow:

1. `$grill-me` asks the hard product and implementation questions.
2. `$to-prd` writes the PRD and divides it into a concrete epic plan.
3. `$create-epic-sprint` consumes the PRD feature folder and epic plan to create sprints and tickets.
4. `$pick-next-sprint-task` selects executable tickets from those sprints.

## Output Paths

Default output:

- `docs/prd/<feature-slug>/PRD.md`
- `docs/prd/<feature-slug>/epic.md`

Optional companion files when useful:

- `docs/prd/<feature-slug>/notes.md`
- `docs/prd/<feature-slug>/decisions.md`
- `docs/prd/<feature-slug>/issue.md`

Rules:

- create `docs/prd` if it does not exist
- prefer the folder form above over a flat `docs/prd/<feature-slug>.md`
- keep one feature or initiative per folder
- use a lowercase hyphenated slug
- always create `epic.md` beside `PRD.md`; this is the bridge from product spec to sprint planning
- future sprint docs belong under `docs/prd/<feature-slug>/sprints/<nn>-<slug>`, but this skill does not create sprint tickets unless explicitly asked
- treat `apps/docs` as end-user documentation; this skill writes internal planning artifacts under `docs/prd`

## Repo-Specific Writing Rules

- write the PRD in Spanish
- keep technical names, module names, API names, schema names, and code identifiers in English
- do not include concrete file paths or code snippets in `Implementation Decisions`
- align backend architecture language with [$backend-architecture](D:/ProyectoDeGradoUDABOL/.agents/skills/backend-architecture/SKILL.md) when backend work is involved
- align frontend module language with [$frontend-architecture](D:/ProyectoDeGradoUDABOL/.agents/skills/frontend-architecture/SKILL.md) when UI work is involved

## Workflow

### 1. Respect prior discovery

- treat `$grill-me` output, prior conversation decisions, and user corrections as the main source of truth
- do not restart discovery or ask another interview round unless the user explicitly asks
- if an important ambiguity remains, record it as an assumption or open question instead of blocking

### 2. Build repo context quickly

- inspect the repo to understand the current state if you have not already
- identify the affected product surfaces, modules, contracts, and constraints
- look for adjacent tests or guardrails that count as prior art

### 3. Design at module and epic level

- sketch the major modules that must be built or modified
- divide the feature into one implementation epic that `$create-epic-sprint` can consume next
- if the feature is too large for one epic, still create a primary `epic.md` for the first coherent delivery slice and list later epics as deferred follow-ups
- actively look for opportunities to extract deep modules that can be tested in isolation
- prefer modules that encapsulate significant behavior behind a small, stable, testable interface
- infer testing candidates from the codebase and the conversation; do not pause to ask the user which modules to test
- if an important assumption remains, record it explicitly in `Implementation Decisions` or `Further Notes` instead of blocking

### 4. Write the PRD and epic plan

- write `docs/prd/<feature-slug>/PRD.md`
- write `docs/prd/<feature-slug>/epic.md`
- create `notes.md` only when discovery leftovers or open questions would clutter the PRD
- create `decisions.md` only when the feature has multiple architectural decisions worth tracking separately

### 5. Prepare the GitHub issue artifact

- if GitHub issue tooling is available, submit a GitHub issue after writing the PRD
- if GitHub issue tooling is not available, write `docs/prd/<feature-slug>/issue.md` with an issue-ready title and body
- the issue should be shorter than the PRD and should point back to the PRD and epic paths as the fuller source of truth

## PRD Requirements

The PRD must follow this structure:

```md
## Problem Statement

## Solution

## User Stories

## Implementation Decisions

## Testing Decisions

## Epic Breakdown

## Out of Scope

## Further Notes
```

### Section guidance

#### Problem Statement

Describe the problem from the user's perspective.

#### Solution

Describe the solution from the user's perspective.

#### User Stories

- write a long, numbered list
- use the format `As an <actor>, I want a <feature>, so that <benefit>`
- make the list extensive enough to cover primary flows, edge cases, permissions, failure handling, collaboration, visibility, lifecycle, and operational concerns

#### Implementation Decisions

Include decisions such as:

- modules to build or modify
- interfaces that will change
- technical clarifications inferred from the repo
- architectural decisions
- schema changes
- API contracts
- specific interactions

Do not include specific file paths or code snippets.

#### Testing Decisions

Include:

- what makes a good test: verify external behavior, not implementation details
- which modules should be tested
- prior art for tests in the current codebase

#### Epic Breakdown

Divide the PRD into planning slices. This section must be concrete enough for `$create-epic-sprint`.

Include:

- the primary epic name and slug
- the epic goal
- the expected delivery result
- the recommended sprint sequence at a high level
- category hints for sprint tickets using `UI`, `BACKEND`, and `INFRA`
- dependencies or sequencing constraints between slices
- deferred epics or later phases when the PRD is too broad for one implementation epic

#### Out of Scope

List the things intentionally excluded from this PRD.

#### Further Notes

Capture assumptions, rollout notes, unresolved questions that do not block the PRD, or sequencing guidance for later planning.

## Epic Plan Requirements

The `epic.md` file must be the handoff artifact for `$create-epic-sprint`.

Use this structure:

```md
# Epic - <Epic Name>

- PRD: ./PRD.md
- Status: TODO
- Slug: <feature-or-epic-slug>

## Goal

## Expected Result

## Product Scope

## Technical Scope

## Sprint Plan

## Ticket Category Hints

## Dependencies

## Out of Scope

## Notes for create-epic-sprint
```

Guidance:

- write `epic.md` in Spanish
- keep code identifiers and category names in English
- make `Sprint Plan` a numbered sequence of likely sprint themes, not full tickets
- use `Ticket Category Hints` to identify likely `UI`, `BACKEND`, and `INFRA` ticket groups
- include enough detail that `$create-epic-sprint` can scaffold the first sprint without re-reading the entire conversation
- do not create `sprints/` or ticket files here unless the user explicitly asks for sprint creation in the same turn

## GitHub Issue Guidance

When creating the issue or `issue.md`:

- use a title shaped like `PRD: <Feature Name>`
- summarize the problem and solution clearly
- include a short implementation summary
- include a short testing summary
- include the primary epic summary
- include the main out-of-scope bullets
- reference `docs/prd/<feature-slug>/PRD.md` and `docs/prd/<feature-slug>/epic.md` as the detailed artifacts

## Quality Bar

- do not interview the user again after `$grill-me`
- do not produce a shallow placeholder spec
- do not leave the PRD without an implementation epic division
- do not create sprint tickets inside `$to-prd` unless explicitly asked
- do not mirror code structure mechanically without explaining why those modules matter
- do not skip testing strategy
- do not leave user stories thin; this list should be one of the densest parts of the document
