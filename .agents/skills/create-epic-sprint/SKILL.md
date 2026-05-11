---
name: create-epic-sprint
description: >-
  Create the next sprint and ticket batch for a repo PRD feature under
  `docs/prd/<feature-slug>/sprints`. Use after `$to-prd` has created `epic.md`.
  Enforce the previous sprint `README.md` status gate, group tickets as `UI`,
  `BACKEND`, or `INFRA`, and end with `cleanup`, `manual QA`, and thesis update tickets. Load
  project backend or frontend architecture skills when the sprint touches those areas, and
  explore the relevant code before shaping the sprint.
---

# Create Epic Sprint

Create the next sprint for a PRD feature folder inside `docs/prd`, following the existing sprint pattern in that feature, grouping tickets by category, and ending the batch with explicit `cleanup`, `manual QA`, and thesis update tickets.

Use the bundled Node script to scaffold the folder, README, and ticket files. Then refine the generated markdown so it matches the feature's real domain, the current product phase, and the style of the previous sprint.

This skill is intentionally synced with `$to-prd`: PRDs live at `docs/prd/<feature-slug>/PRD.md`, the planning handoff lives at `docs/prd/<feature-slug>/epic.md`, and sprint plans for that PRD live beside them at `docs/prd/<feature-slug>/sprints/<nn>-<slug>`. Every ticket must keep an explicit `Parent PRD` metadata link to that feature's `PRD.md`. The QA ticket that closes the last sprint of an epic is responsible for updating that `epic.md` status to `DONE` after validation succeeds.

## Discovery pitfall

If this folder exists on disk but `$create-epic-sprint` is not present in the session's `Available skills` list, the problem is usually not the `SKILL.md` frontmatter. In this repo we have seen Codex Desktop keep a stale skill snapshot for the current session, including removed skills and excluding newly added ones.

When that happens:

- do not assume the skill is malformed just because it cannot be invoked by name
- verify whether the session prompt actually lists `create-epic-sprint`
- prefer starting a fresh thread or refreshing the client session before rewriting the skill
- if a task is blocked on this, tell the developer that skill discovery appears stale for the session

## Existing draft pitfall

Sometimes the "next sprint" already exists as an untracked local draft under `docs/prd/<feature-slug>/sprints/<nn>-<slug>`.

When that happens:

- inspect `git status --short` for the PRD feature folder before scaffolding a new sprint
- read the existing draft and compare it against the PRD and previous sprint pattern
- refine the draft instead of blindly regenerating the sprint or creating a duplicate folder
- if the draft already matches the plan and local sprint pattern, tell the developer that the work appears to be pre-scaffolded and avoid overwriting it

## Cleanup-title detection pitfall

The scaffolder treats any main ticket whose title contains `cleanup` or `clean up` as the final cleanup ticket.

When that happens:

- avoid using `cleanup` or `clean up` in main implementation ticket titles when possible; prefer words like `schema reset`, `schema consolidation`, or `persistence guardrails`
- if the generated sprint already skipped the dedicated closing cleanup ticket, add it manually before manual QA and thesis update
- renumber or add the QA and thesis update tickets so the sprint still ends with dedicated cleanup, manual QA, and thesis update tickets
- tell the developer that the scaffolder matched a main implementation ticket as cleanup so future sprint titles can avoid the collision

## Missing sprints directory pitfall

Some PRD feature folders exist on disk with the `PRD.md` already created, but without `docs/prd/<feature-slug>/sprints/` yet.

When that happens:

- do not assume the scaffold script will create the missing `sprints` directory for sprint 1
- create `docs/prd/<feature-slug>/sprints` first, then run the scaffold script
- tell the developer this repo quirk showed up so the skill can keep warning future agents

## Legacy epics path pitfall

Older planning prompts or stale references may still mention `docs/epics`.

When that happens:

- do not treat `docs/epics` as canonical in this repo
- inspect the on-disk `docs/prd/<feature-slug>` folders directly and prefer each feature's own `PRD.md`, `issue.md`, `notes.md`, `decisions.md`, and `sprints`
- if a stale `docs/epics` reference could confuse later agents or contributors, update the relevant skill or doc when it is in scope

## Sprint README status lag pitfall

Sometimes every ticket in the previous sprint is already marked `DONE` but the sprint `README.md` still says `- Status: TODO`.

When that happens:

- treat the sprint gate as still blocked, because this skill keys off the previous sprint `README.md`
- verify the ticket files so you can tell whether the mismatch looks like a documentation lag or genuinely unfinished work
- tell the developer exactly which sprint README blocks the next sprint and whether the ticket set appears complete
- do not silently flip the README status just to get the scaffolder moving unless the developer explicitly asks you to close that sprint

## Epic status premature DONE pitfall

Sometimes a feature `epic.md` is already marked `- Status: DONE` even though the sprint plan still describes remaining future sprints and the user is asking to create the next sprint.

When that happens:

- treat it as a planning artifact mismatch, not as proof that no next sprint is needed
- verify the previous sprint `README.md` gate normally; that gate still controls whether a new sprint can start
- if the new sprint clearly continues the same epic, update `epic.md` back to `- Status: TODO` as part of the planning cleanup
- mention the mismatch to the developer so they understand why the epic status changed

## Workflow

### 1. Locate the PRD feature folder

Work inside:

- `docs/prd/<feature-slug>`
- `docs/prd/<feature-slug>/sprints`

Refuse to invent a new location or a different folder shape unless the user explicitly asks for a new convention.

### 2. Inspect existing sprints before writing anything

Read:

- `PRD.md`
- `epic.md`, which is the primary handoff from `$to-prd`
- any companion `issue.md`, `notes.md`, or `decisions.md`
- the previous sprint `README.md`
- at least one or two tickets from the previous sprint

Mirror the local pattern for:

- README sections
- ticket file naming
- dependency style
- category grouping
- closing tickets such as `cleanup`, `manual QA`, and thesis update

### 3. Explore the relevant code before deciding the sprint shape

Before choosing the sprint title, goal, tickets, dependencies, or acceptance criteria, do a focused exploration of the code that the PRD feature is likely to touch. Use this exploration to understand the current implementation, avoid planning work that already exists, spot integration constraints, and make better decisions about ticket scope and ordering.

At minimum:

- inspect the relevant app/package folders implied by the PRD and epic, such as `apps/api`, frontend routes, feature modules, shared packages, contracts, tests, or docs surfaces
- use `rg` and targeted file reads to find existing domain concepts, routes, handlers, components, stores, contracts, tests, and naming conventions related to the feature
- compare what the PRD asks for against what the code already does, and reflect any useful findings in the generated sprint tickets
- if the exploration reveals a surprising repo pitfall, tell the developer and add the note to the appropriate repo-specific skill file when it is in scope

### 4. Enforce the sprint gate

Never start a new sprint unless the immediately previous sprint is complete.

Treat the previous sprint as complete only when its `README.md` includes:

- `- Status: DONE`

If that line is missing or has another status, stop and tell the user which sprint blocks the new one.

### 5. Load repo-specific implementation rules when applicable

If the feature affects backend code, `apps/api`, backend architecture, CQRS, modules, contracts, workflows, repositories, entities, events, or guardrails, load and follow:

- [$backend-architecture](D:/ProyectoDeGradoUDABOL/.agents/skills/backend-architecture/SKILL.md)

If the feature affects frontend code, UI architecture, routes, pages, layouts, feature modules, hooks, stores, theming, i18n, shared UI, or design flows, load and follow:

- [$frontend-architecture](D:/ProyectoDeGradoUDABOL/.agents/skills/frontend-architecture/SKILL.md)

If the sprint is mixed, use both skills and reflect both in the ticket wording where relevant.

### 6. Scaffold the sprint with the script

Run:

```bash
node .agents/skills/create-epic-sprint/scripts/scaffold_epic_sprint.mjs \
  --prd-dir docs/prd/<feature-slug> \
  --title "<Sprint Title>" \
  --goal "<Sprint Goal>" \
  --expected-result "<Expected result bullet 1>" \
  --expected-result "<Expected result bullet 2>" \
  --ui-ticket "<UI ticket 1>" \
  --backend-ticket "<Backend ticket 1>" \
  --infra-ticket "<Infra ticket 1>"
```

Rules:

- pass main tickets through the category flags:
  - `--ui-ticket`
  - `--backend-ticket`
  - `--infra-ticket`
- do not pass cleanup, QA, or thesis update tickets manually unless you are intentionally overriding the defaults
- let the script append the final `cleanup`, `manual QA`, and thesis update tickets automatically

The script also accepts legacy `--epic-dir` as an alias for `--prd-dir`, but new instructions should use `--prd-dir`.

The script will:

- detect the next sprint number
- validate that the previous sprint is `DONE`
- validate that `PRD.md` exists in the PRD feature folder
- create `README.md`
- create numbered ticket files
- assign every ticket to `UI`, `BACKEND`, or `INFRA`
- add a `Parent PRD` metadata link to every generated ticket
- group execution order by category
- append `cleanup`, `manual QA`, and thesis update at the end if they are missing

### 7. Refine the generated docs

After scaffolding, edit the generated markdown so it reflects the real PRD feature and repo context.

At minimum, refine:

- sprint goal
- expected result bullets
- ticket descriptions
- scope and out-of-scope
- acceptance criteria
- references to PRD artifacts or policy docs, while preserving the generated `Parent PRD` metadata line in every ticket
- dependency graph if the default sequential structure is too naive
- `cleanup` so it focuses on touched dead code, stale references, temporary instrumentation, and naming drift exposed by the sprint
- `manual QA` so it names the actual routes, flows, or product surfaces to verify, and so it explicitly says to update `epic.md` to `- Status: DONE` when the QA run closes the entire epic
- thesis update so it names the sprint evidence to incorporate, writes only academically rigorous material, documents implementation at a high level, and fills missing thesis context by considering the PRD, epic, sprint tickets, and all previous related work already completed in the repo

### 8. Keep the category and closing shape explicit

Generate main tickets inside these categories for now:

1. `UI`
2. `BACKEND`
3. `INFRA`

Use `INFRA` for cross-cutting operational work such as guardrails, tooling, docs glue, repo wiring, or validation plumbing.

End every sprint with:

1. a `cleanup` ticket
2. a `manual QA` ticket
3. a thesis update ticket

Use the same spirit across PRD feature folders:

- `cleanup` removes dead code, stale references, duplicate wiring, and temporary scaffolding left by the sprint work
- `manual QA` verifies the touched product surface deliberately, not with vague exploration
- `manual QA` must explicitly use Playwright MCP when the affected surface is a web UI or browser flow
- when `manual QA` is the final validation ticket for the whole epic, it must update `docs/prd/<feature-slug>/epic.md` from `- Status: TODO` to `- Status: DONE` after all QA issues are fixed and revalidated
- thesis update must revise the academic thesis documentation after the sprint using only evidence-backed, academically rigorous content
- thesis update should describe the implementation only at a high level: architecture decisions, modules touched, data flow, validation strategy, limitations, and how the sprint contributes to the research or system objectives
- thesis update must not include unsupported claims, marketing language, code dumps, operational chatter, or overly detailed implementation logs
- if the thesis document lacks a needed section or context, infer the missing academic framing from the PRD, epic, sprint docs, accepted decisions, and previous implemented work before writing; ask the user only when the missing information changes the academic claim or scope materially

## Default conventions

Use these defaults unless the PRD feature folder already uses a different explicit pattern:

- sprint folder: `<nn>-<slug>`
- ticket file: `<nn>-<category>-<slug>.md`
- README title: `# Sprint NN - <Title>`
- ticket title: `# Ticket NN - <Title>`
- ticket categories: `UI`, `BACKEND`, `INFRA`
- status for new work: `TODO`
- every ticket metadata block includes `- Parent PRD: [PRD.md](../../PRD.md)` unless the feature folder uses a different relative depth
- the first ticket in each category depends on `none` by default
- later tickets depend on the immediately previous ticket in the same category by default
- `cleanup` depends on the last main ticket from every non-empty category
- `manual QA` depends on `cleanup`
- thesis update depends on `manual QA`
- the generated `manual QA` ticket should mention Playwright MCP explicitly when browser-based verification applies
- the generated `manual QA` ticket should mention closing `epic.md` with `- Status: DONE` when that QA ticket is the final epic validation step
- the generated thesis update ticket should be the final ticket in the sprint and should use category `INFRA`

## When to stop and ask the user

Stop and ask only if:

- there is no clear PRD feature folder under `docs/prd`
- the previous sprint is not `DONE`
- the PRD feature folder has no visible sprint pattern to mirror
- there are two plausible next-sprint directions with materially different outcomes

Otherwise, make reasonable assumptions, scaffold the sprint, and explain those assumptions after the work.
