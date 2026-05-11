---
name: pick-next-sprint-task
description: Select the next available ticket from sprint docs under `docs/prd/<feature-slug>/sprints`. Use when the user asks to take the next task, pick the next unlocked ticket, continue the sprint, or choose the next item from a sprint plan. Enforce sprint docs beside the PRD created by `$to-prd`, prefer the category implied by the prompt (`UI`, `BACKEND`, or `INFRA`), and only select tickets whose `Depends on` requirements are already `DONE`. Map frontend or UI intent to `UI`, backend or API intent to `BACKEND`, and tooling or guardrail intent to `INFRA`. After selecting a `BACKEND` task, use [$backend-architecture](D:/ProyectoDeGradoUDABOL/.agents/skills/backend-architecture/SKILL.md). After selecting a `UI` task, use [$frontend-architecture](D:/ProyectoDeGradoUDABOL/.agents/skills/frontend-architecture/SKILL.md).
---

# Pick Next Sprint Task

Select the next unlocked ticket from sprint documentation in `docs/prd/<feature-slug>/sprints`, with optional category preference inferred from the user's prompt.

Use the bundled Node script to inspect the active sprint, parse ticket metadata, and return the next eligible ticket. Then reconcile stale ticket statuses against the real code before trusting the selection, and only after that load the repo-specific implementation skill that matches the selected category.

This skill is intentionally synced with `$to-prd`: PRDs live at `docs/prd/<feature-slug>/PRD.md`, and sprint tickets live beside the PRD under `docs/prd/<feature-slug>/sprints/<nn>-<slug>`.

## Workflow

### 1. Find the target sprint

Use one of these inputs:

- `--sprint-dir` when the user or surrounding task already points at one sprint folder
- `--prd-dir` when you should infer the active sprint from `docs/prd/<feature-slug>`

The script also accepts legacy `--epic-dir` as an alias for `--prd-dir`, but new instructions should use `--prd-dir`.

When you receive only a PRD feature folder:

- prefer the latest sprint whose `README.md` is not `- Status: DONE`
- if every sprint is `DONE`, fall back to the latest sprint folder

### 2. Infer category preference

Determine the preferred category from either:

- `--category`
- `--prompt`

Use these mappings:

- `frontend`, `ui`, `page`, `component`, `hook`, `store`, `theme`, `design`, `i18n` -> `UI`
- `backend`, `api`, `controller`, `handler`, `repository`, `workflow`, `cqrs`, `entity` -> `BACKEND`
- `infra`, `tooling`, `guardrail`, `lint`, `docs`, `qa`, `playwright`, `ci`, `build` -> `INFRA`

If the prompt clearly mixes multiple categories, do not force a category filter. Fall back to "next unlocked ticket in sprint order".

### 3. Only select unlocked tickets in sprint order

Treat a ticket as selectable only when:

- its status is not `DONE`
- its status is not `IN_PROGRESS`
- every ticket listed in `Depends on` is already `DONE`

Always respect sprint order among unlocked tickets.

- find the first unlocked ticket in sprint order
- if no category preference was requested, that is the selection
- if a category preference was requested and that first unlocked ticket matches it, select it
- if a later ticket matches the preferred category but an earlier unlocked ticket does not, do not jump ahead
- in that case, report that sprint order is currently blocking the preferred category and name the earlier unlocked ticket

If the preferred category has no selectable ticket yet:

- report that it is blocked
- name the blocking dependencies or earlier unlocked sprint-order ticket
- optionally mention the next unlocked ticket in another category as context, but do not silently switch categories

### 4. Reconcile stale ticket statuses against the real code

Sprint docs can lag behind implementation. Before treating the script output as authoritative:

- open the selected ticket and any earlier non-`DONE` ticket that the script flags for status audit
- inspect the real code in the ticket scope and compare it to the acceptance criteria
- if a ticket is already implemented, update its `- Status:` to `DONE` immediately in the sprint docs
- rerun the script after any status correction
- do not start a new ticket while earlier completed tickets still say `TODO`

When you finish implementing a ticket in the same turn, update its sprint doc to `DONE` before closing out.

### 5. Load the right implementation guide after selection

After selecting a ticket:

- for `BACKEND`, load [$backend-architecture](D:/ProyectoDeGradoUDABOL/.agents/skills/backend-architecture/SKILL.md)
- for `UI`, load [$frontend-architecture](D:/ProyectoDeGradoUDABOL/.agents/skills/frontend-architecture/SKILL.md)
- for `INFRA`, inspect the selected ticket scope and load backend or UI patterns if the infra work touches either side

### 6. Run the script

Examples:

```bash
node .agents/skills/pick-next-sprint-task/scripts/pick_next_sprint_task.mjs \
  --prd-dir docs/prd/<feature-slug> \
  --prompt "toma la siguiente tarea de frontend"
```

```bash
node .agents/skills/pick-next-sprint-task/scripts/pick_next_sprint_task.mjs \
  --sprint-dir docs/prd/<feature-slug>/sprints/01-<slug> \
  --category BACKEND
```

The script will:

- locate the target sprint
- parse ticket number, status, category, and dependencies
- infer category from the prompt if needed
- select the next unlocked ticket without skipping earlier unlocked work
- report when the preferred category is blocked by dependencies or sprint order
- flag tickets whose status should be audited against the real code before starting work

## Output expectations

When using this skill, summarize:

- selected sprint path
- selected ticket number and title
- selected category
- why it is eligible now
- whether any ticket statuses were reconciled or updated
- which repo-specific skill should be loaded next

If no ticket is selectable, explain whether the problem is:

- no active sprint
- all tickets are done
- the preferred category is blocked
- malformed sprint metadata

If you discover a ticket was already complete, say so explicitly and update the sprint doc in the same turn instead of silently moving on.

## Conventions

Assume current sprint tickets follow these metadata lines near the top:

- `- Status: ...`
- `- Category: UI|BACKEND|INFRA`
- `- Depends on: none|01|01, 02`

If a sprint still uses older tickets without `Category`, treat the category as unknown and only use prompt-based category filtering when you can do so safely.

## Notes

You can always do work on top of other agents' work, meaning you can work and modify on top of non committed code.
