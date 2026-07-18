# Issue Tracker: GitHub

The canonical spec and its execution tickets live as GitHub issues. Use `gh` for all operations.

## Conventions

- Publish the spec as one canonical issue and retain its stable URL and number.
- Publish every ticket as an independent issue whose title starts with its two-digit execution number.
- Include `Status`, `Objective`, `Spec`, `Tracer bullet`, outcome, acceptance criteria, and blocker in every ticket body.
- Treat an open issue as `TODO` and a closed issue as `DONE`.
- Create every ticket as open and close it only after its acceptance criteria are satisfied.
- Reference the canonical spec issue in every ticket.
- Create blockers first. Every ticket except `01` is blocked by the immediately preceding ticket.
- Use GitHub's native issue dependency when available; otherwise use a `Blocked by: #<number>` line.

Infer the repo from `git remote -v`; `gh` does this automatically inside a clone.

## Operations

- **Create**: `gh issue create --title "..." --body "..."`
- **Read**: `gh issue view <number> --comments`
- **List**: `gh issue list --state all --json number,title,body,state,url`
- **Comment**: `gh issue comment <number> --body "..."`
- **Close as DONE**: `gh issue close <number> --comment "Acceptance criteria satisfied."`
- **Reopen as TODO**: `gh issue reopen <number>`

For native blocking, add the previous issue as a dependency. If native dependencies are unavailable, retain the body link and treat the previous issue's closed state as the gate.

## Publishing and selection

- `/to-spec` creates the canonical spec issue.
- `/to-tickets` creates one numbered issue per approved ticket in dependency order.
- The next ticket is the lowest-numbered open ticket whose immediately preceding blocker is closed. Never skip an earlier open ticket or work tickets in parallel.

