# Issue Tracker: GitLab

The canonical spec and its execution tickets live as GitLab issues. Use `glab` for all operations.

## Conventions

- Publish the spec as one canonical issue and retain its stable URL and IID.
- Publish every ticket as an independent issue whose title starts with its two-digit execution number.
- Include `Status`, `Objective`, `Spec`, `Tracer bullet`, outcome, acceptance criteria, and blocker in every ticket description.
- Treat an open issue as `TODO` and a closed issue as `DONE`.
- Create every ticket as open and close it only after its acceptance criteria are satisfied.
- Reference the canonical spec issue in every ticket.
- Create blockers first. Every ticket except `01` is blocked by the immediately preceding ticket.
- Use GitLab's native blocking relationship when available; otherwise use a `Blocked by: #<iid>` line.

Infer the repo from `git remote -v`; `glab` does this automatically inside a clone.

## Operations

- **Create**: `glab issue create --title "..." --description "..."`
- **Read**: `glab issue view <iid> --comments`
- **List**: `glab issue list -F json`
- **Comment**: `glab issue note <iid> --message "..."`
- **Close as DONE**: post the completion note, then run `glab issue close <iid>`
- **Reopen as TODO**: `glab issue reopen <iid>`

For native blocking, add the previous issue with GitLab's blocking relationship or `/blocked_by #<iid>` quick action. If unavailable, retain the description link and treat the previous issue's closed state as the gate.

## Publishing and selection

- `/to-spec` creates the canonical spec issue.
- `/to-tickets` creates one numbered issue per approved ticket in dependency order.
- The next ticket is the lowest-numbered open ticket whose immediately preceding blocker is closed. Never skip an earlier open ticket or work tickets in parallel.

