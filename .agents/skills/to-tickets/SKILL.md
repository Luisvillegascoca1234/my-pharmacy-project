---
name: to-tickets
description: "Expand a canonical feature spec into independent, strictly sequential TODO/DONE ticket files: Backend, UI, and corrective Code Review for each tracer bullet, followed by orchestrator-owned corrective Computer Use QA and user documentation. Use only after to-spec has published the spec."
---

# To Tickets

Turn a canonical spec into the ordered execution chain that delivers it. Preserve tracer bullets as narrow, complete user-visible slices while splitting each one into Backend, UI, and corrective Code Review stages.

## Preconditions

- Require a published spec reference produced by `/to-spec`.
- Fetch and read the full spec before drafting tickets.
- Require the repo's issue-tracker configuration. Run `/setup-matt-pocock-skills` if it is missing.
- If no canonical spec exists, stop and direct the user to `/to-spec`. Do not generate tickets directly from a conversation, loose plan, or incomplete draft.

## Invariants

- Create exactly three tickets per tracer bullet, followed by one QA ticket and one Docs ticket: `3n + 2` tickets for `n` tracer bullets.
- Create one independent file or external issue per ticket. Never create a combined tickets document.
- Reference the canonical spec in every ticket.
- Use only `TODO` and `DONE` as ticket states. Every new ticket starts as `TODO`.
- Build one strict, forward-only dependency chain. There is never more than one next ticket.
- Start with `TB-01 Backend`, which has no blocker.
- Never make an earlier tracer bullet depend on a later tracer bullet.
- Never allow parallel execution between tracer bullets.
- Assign every QA ticket to the orchestrator for direct execution. Never delegate QA to a subagent.

## Process

### 1. Gather context

Read the canonical spec in full. Read the issue-tracker, delivery-workflow, domain, and relevant ADR configuration described by `AGENTS.md` and `docs/agents/` when present.

Use the exact tracer-bullet order and domain terminology from the spec. Do not invent a new slice or silently change scope.

### 2. Expand each tracer bullet

For every `TB-NN`, create these tickets in order:

1. **BACKEND** — implement the business behavior, persistence, API, shared contracts, and backend tests required by this tracer bullet. It may change the backend and required shared contracts, but not build the UI.
2. **UI** — implement the Spanish client experience and integration required by the same tracer bullet. It depends on that tracer bullet's Backend ticket.
3. **CODE REVIEW** — inspect the completed backend, UI, and shared-contract work for the tracer bullet, correct every in-scope finding, and leave the slice ready to build upon. It depends on that tracer bullet's UI ticket.

`TB-(N+1) Backend` depends on `TB-N Code Review`. This serializes the complete feature and ensures later work starts from reviewed behavior.

The Code Review ticket is corrective, not report-only. It has authority to modify backend, frontend, shared contracts, and relevant tests. Require it to detect and correct:

- dead or commented-out code;
- accidental duplication;
- premature abstractions and overengineering;
- unnecessary wrappers, fallbacks, and compatibility branches;
- oversized functions or components;
- weak names and inconsistent domain vocabulary;
- unjustified type escapes;
- incomplete error handling;
- avoidable TODOs;
- obvious, noisy, or mechanically generated comments;
- violations of the project's backend and frontend architecture guidance;
- English-code and Spanish-client-language violations;
- any other code slop introduced or exposed by the tracer bullet.

Do not assign visual or end-to-end QA to Code Review.

### 3. Append final QA

After the last tracer bullet's Code Review, create one **QA** ticket covering the complete spec. It depends on the last Code Review ticket and uses `All tracer bullets` as its tracer-bullet value.

The QA ticket must:

- declare `**Execution owner:** ORCHESTRATOR` immediately after its objective metadata;
- require the orchestrator to execute QA directly and never create or assign a subagent for it;
- read the root `AGENTS.md` before acting;
- treat the generated QA ticket as the explicit authorization required by `AGENTS.md`;
- assume the development server is already running when `AGENTS.md` says so;
- use Computer Use through the in-app browser, not source inspection alone;
- execute every QA journey and relevant error state in the spec;
- correct defects in backend, frontend, shared contracts, and tests as needed;
- repeat every affected journey after a correction;
- finish only when all in-scope journeys pass.

QA is corrective, not report-only. It may modify code and remains `TODO` until corrections and rechecks are complete.
The orchestrator-only execution rule is mandatory even when the surrounding delivery workflow delegates every other ticket to a fresh subagent.

### 4. Append user documentation

Create one **DOCS** ticket after QA. It depends on QA and uses `All tracer bullets` as its tracer-bullet value.

Require it to document only QA-validated behavior in the user documentation application, in Spanish and with specialized pharmaceutical terminology. It must not explain code organization or implementation details.

### 5. Number and wire the chain

Number all tickets from `01` in execution order. Every ticket except `01` is blocked by the immediately preceding ticket. A `Blocked by` link must always point backward to an earlier ticket.

For two tracer bullets, the chain is:

```text
01 TB-01 Backend       — no blocker
02 TB-01 UI            — blocked by 01
03 TB-01 Code Review   — blocked by 02
04 TB-02 Backend       — blocked by 03
05 TB-02 UI            — blocked by 04
06 TB-02 Code Review   — blocked by 05
07 QA                  — blocked by 06
08 Docs                — blocked by 07
```

The next work item is always the lowest-numbered `TODO` ticket whose blocker is `DONE`. Do not skip an earlier `TODO` ticket.

### 6. Review the draft with the user

Present the proposed chain grouped by tracer bullet. For every ticket show:

- number and title;
- objective;
- blocker;
- outcome;
- spec reference.

Ask whether the tracer-bullet granularity, responsibilities, and strict dependency chain are correct. Iterate until the user approves publication.

### 7. Publish

Publish the approved tickets in dependency order.

- **Local Markdown** — write each ticket to `.scratch/<feature-slug>/tickets/<NN>-<slug>.md`. The canonical spec is `.scratch/<feature-slug>/spec.md`, so every ticket links to `../spec.md`. Use the local template below.
- **External tracker** — create one issue per ticket. Put the stable spec URL or identifier in every issue, create blockers first, and use native blocking links when available. An open issue is `TODO`; a closed issue is `DONE`.

Do not close or modify the canonical spec while publishing tickets.

## Local ticket template

<local-ticket-template>

# <NN> — [<OBJECTIVE>] <TB-NN when applicable> — <Ticket title>

**Status:** TODO
**Objective:** <BACKEND | UI | CODE REVIEW | QA | DOCS>
<For QA only: **Execution owner:** ORCHESTRATOR>
**Spec:** [<Spec title>](../spec.md)
**Tracer bullet:** <TB-NN — name | All tracer bullets>
**Blocked by:** <linked previous ticket | None — start here>

## Outcome

Describe the behavior or corrective result this ticket must leave behind. Do not provide a layer-by-layer file list.

## Acceptance criteria

- [ ] Observable or reviewable criterion.

## Comments

</local-ticket-template>

## External issue template

<external-issue-template>

**Status:** TODO
**Objective:** <BACKEND | UI | CODE REVIEW | QA | DOCS>
<For QA only: **Execution owner:** ORCHESTRATOR>
**Spec:** <stable spec link or identifier>
**Tracer bullet:** <TB-NN — name | All tracer bullets>

## Outcome

Describe the behavior or corrective result this ticket must leave behind.

## Acceptance criteria

- [ ] Observable or reviewable criterion.

## Blocked by

<previous ticket reference | None — start here>

</external-issue-template>

Avoid specific file paths and implementation snippets in tickets. The only exception is a trimmed prototype-derived fragment that encodes an approved decision more precisely than prose.

## Completing tickets

Work only the current lowest-numbered available ticket. Set `Status` to `DONE` only after its acceptance criteria are satisfied. For an external tracker, close the issue at the same time. The next ticket becomes available only after that transition.

Execute a QA ticket directly as the orchestrator. Do not spawn, assign, or hand it off to a subagent. Continue using the configured delegation workflow for non-QA tickets.
