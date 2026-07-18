---
name: implement-spec-tickets
description: Create a separate Codex task that implements every ticket already published for a canonical to-spec feature in strict sequence, using one fresh subagent per non-QA ticket, direct orchestrator execution for QA, and an orchestrator-owned TODO-to-DONE transition. Use after to-tickets has published the approved ticket chain and the user wants the complete spec implemented automatically in a new task.
---

# Implement Spec Tickets

Launch the planned implementation in a separate project task. Do not implement tickets in the calling task.

## Preconditions

- Require the exact canonical spec reference produced by `to-spec`.
- Require the approved ticket chain produced by `to-tickets`.
- For a local reference, resolve it from the workspace and confirm the spec and its sibling `tickets/` directory exist.
- For an external reference, require a stable URL or identifier and access to its configured tracker.
- Stop when the reference is missing, ambiguous, unpublished, or has no tickets. Do not create, reorder, or rewrite tickets.

## Launch workflow

1. Read [references/orchestrator-prompt.md](references/orchestrator-prompt.md) in full.
2. Replace every literal `{SPEC_REFERENCE}` with the exact resolved reference. Preserve the initial `/goal` directive and all other template text.
3. Use the Codex project-listing tool to find the project whose local workspace is the current repository.
4. Use the Codex thread-creation tool to create exactly one new project task with:
   - the matched project ID;
   - a `local` environment;
   - the rendered template as its initial prompt;
   - no model or reasoning override unless the user explicitly requested one.
5. Do not wait for, supervise, or duplicate the implementation from the calling task. The new task owns the `/goal`, its non-QA subagents, and direct QA execution.
6. Return the created task identifier and emit the app's created-thread directive so the user can open it.

## Guardrails

- Never remove `/goal` from the rendered prompt.
- Never use a worktree unless the user explicitly requests one.
- Use one fresh subagent for every non-QA ticket and never execute those tickets in parallel.
- Detect QA by `Objective: QA` even when a legacy ticket lacks `Execution owner: ORCHESTRATOR`.
- Execute QA directly in the orchestrator task. Never spawn, assign, or hand a QA ticket to a subagent.
- Never invoke or refer to obsolete sprint ticket-selection workflows.
