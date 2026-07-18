---
name: setup-matt-pocock-skills
description: Configure a repo for the grilling-to-spec-to-tickets engineering workflow, including tracker storage, strict TODO/DONE ticket sequencing, delivery responsibilities, and domain documentation. Run once before first use of to-spec or to-tickets.
disable-model-invocation: true
---

# Setup Matt Pocock's Skills

Scaffold the per-repo configuration consumed by the engineering workflow:

- **Issue tracker** — where the canonical spec and independent tickets live.
- **Delivery workflow** — how tracer bullets become a strict Backend, UI, Code Review, QA, and Docs chain.
- **Domain docs** — where the glossary and ADRs live and how skills consume them.

This is prompt-driven. Explore, present findings, confirm choices, show exact drafts, and only then write.

## Process

### 1. Explore

Read the current repo instead of assuming:

- `git remote -v` and `.git/config`;
- root `AGENTS.md` and `CLAUDE.md`, including any existing `## Agent skills` section;
- root `CONTEXT.md` and `CONTEXT-MAP.md`;
- `docs/adr/` and context-scoped ADR directories;
- `docs/agents/` and any prior output from this setup;
- `.scratch/` and existing local planning conventions;
- monorepo signals such as `pnpm-workspace.yaml`, `package.json` workspaces, and populated packages.

### 2. Present findings and ask

Summarize what exists and what is missing. Take one section and one answer at a time. Lead with the recommended choice so the user can accept it in one word.

#### Section A — Issue tracker

Explain that `/to-spec` publishes the canonical spec and `/to-tickets` publishes its independent execution tickets. Recommend the tracker already used by the repo when one is evident.

Offer:

- **GitHub** — specs and tickets are GitHub issues managed with `gh`.
- **GitLab** — specs and tickets are GitLab issues managed with `glab`.
- **Local Markdown** — specs and ticket files live under `.scratch/<feature-slug>/`.
- **Other** — collect the workflow as concise freeform prose.

Record the result in `docs/agents/issue-tracker.md`.

#### Section B — Domain docs

Default to **single-context**: one root `CONTEXT.md` and `docs/adr/`. Write it without asking unless exploration found genuine monorepo context boundaries.

Offer **multi-context** only for a genuinely large multi-context repo. It uses root `CONTEXT-MAP.md` plus one relevant `CONTEXT.md` per context.

Record the result in `docs/agents/domain.md`.

The delivery workflow does not branch: always seed it from `delivery-workflow.md` and record it in `docs/agents/delivery-workflow.md`.

### 3. Confirm exact drafts

Before writing, show the user:

- the exact `## Agent skills` block to add or update;
- the exact `docs/agents/issue-tracker.md`;
- the exact `docs/agents/delivery-workflow.md`;
- the exact `docs/agents/domain.md`.

Let the user edit or approve them.

### 4. Write

Choose the instruction file without creating a competing one:

- edit `CLAUDE.md` if it exists;
- otherwise edit `AGENTS.md` if it exists;
- if neither exists, ask which one to create.

Update an existing `## Agent skills` block in place. Never append a duplicate and never overwrite surrounding user instructions.

Use this block shape:

```markdown
## Agent skills

### Issue tracker

[One-line tracker and storage summary]. See `docs/agents/issue-tracker.md`.

### Delivery workflow

[One-line strict workflow summary]. See `docs/agents/delivery-workflow.md`.

### Domain docs

[One-line single-context or multi-context summary]. See `docs/agents/domain.md`.
```

Write the docs using these seed templates:

- [issue-tracker-github.md](./issue-tracker-github.md)
- [issue-tracker-gitlab.md](./issue-tracker-gitlab.md)
- [issue-tracker-local.md](./issue-tracker-local.md)
- [delivery-workflow.md](./delivery-workflow.md)
- [domain.md](./domain.md)

For another tracker, write `docs/agents/issue-tracker.md` from the user's description while preserving the workflow's canonical spec reference, independent tickets, TODO/DONE states, and strict sequential blockers.

### 5. Done

Tell the user that `/to-spec` and `/to-tickets` now read this configuration. Mention that `docs/agents/*.md` can be edited directly and that rerunning setup is only necessary to switch trackers or regenerate the configuration.
